import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { SmsService } from '../sms/sms.service';
import { Decimal } from '@prisma/client/runtime/library';
import { normalizePhoneNumber } from '../../shared/utils/phone.util';
import { generateOtp, hashOtp, verifyOtp, maskSensitiveData, generateTransactionId } from '../../shared/utils/crypto.util';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private smsService: SmsService,
  ) {}

  async getUserWallets(userId: string, accountType: 'SPOT' | 'FUNDING' = 'SPOT') {
    return this.prisma.wallet.findMany({
      where: { userId, accountType },
    });
  }

  async getWalletByAsset(userId: string, asset: string, network: string) {
    return this.prisma.wallet.findFirst({
      where: { userId, asset, network },
    });
  }

  async createOrGetWallet(userId: string, asset: string, network: string, accountType: 'SPOT' | 'FUNDING' = 'SPOT') {
    const existing = await this.prisma.wallet.findFirst({
      where: { userId, asset, network, accountType },
    });

    if (existing) return existing;

    return this.prisma.wallet.create({
      data: { userId, asset, network, accountType, balance: 0, lockedBalance: 0 },
    });
  }

  async updateBalance(walletId: string, amount: number, lock: number = 0) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Pre-check for negative results
    const currentBalance = new Decimal(wallet.balance);
    const currentLocked = new Decimal(wallet.lockedBalance);
    if (currentBalance.add(amount).isNegative() || currentLocked.add(lock).isNegative()) {
      throw new BadRequestException('Insufficient balance');
    }

    // Use atomic operations to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      // Build atomic where clause for deductions
      const whereClause: any = { id: walletId };
      
      // If decrementing balance, add atomic check
      if (amount < 0) {
        whereClause.balance = { gte: Math.abs(amount) };
      }
      // If decrementing locked, add atomic check
      if (lock < 0) {
        whereClause.lockedBalance = { gte: Math.abs(lock) };
      }

      const updateResult = await tx.wallet.updateMany({
        where: whereClause,
        data: {
          balance: { increment: amount },
          lockedBalance: { increment: lock },
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('Insufficient balance (concurrent modification detected)');
      }

      return tx.wallet.findUnique({ where: { id: walletId } });
    });
  }

  // [DEV ONLY] Add test balance to user wallet
  // 🔒 SECURITY: This method should ONLY be used in development
  async addTestBalance(userId: string, asset: string, amount: number) {
    // Double-check environment for safety
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Test balance is disabled in production');
    }

    // Limit test balance amount
    const MAX_TEST_BALANCE = 10000;
    if (amount > MAX_TEST_BALANCE) {
      throw new BadRequestException(`Test balance cannot exceed ${MAX_TEST_BALANCE}`);
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, asset, accountType: 'SPOT' },
    });

    if (!wallet) {
      return this.prisma.wallet.create({
        data: { userId, asset, network: 'TRC20', accountType: 'SPOT', balance: amount, lockedBalance: 0 },
      });
    }

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: Number(wallet.balance) + amount },
    });
  }

  async transfer(userId: string, asset: string, amount: number, from: 'SPOT' | 'FUNDING', to: 'SPOT' | 'FUNDING') {
    if (from === to) throw new BadRequestException('Cannot transfer to same account');

    const sourceWallet = await this.prisma.wallet.findFirst({
      where: { userId, asset, accountType: from },
    });

    if (!sourceWallet || new Decimal(sourceWallet.balance).lessThan(amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const destWallet = await this.createOrGetWallet(userId, asset, sourceWallet.network, to);

    await this.prisma.$transaction(async (tx) => {
      const sender = await tx.wallet.updateMany({
        where: { 
          id: sourceWallet.id, 
          balance: { gte: amount } // Atomic check: Balance must be >= amount
        },
        data: { balance: { decrement: amount } },
      });

      if (sender.count === 0) {
        throw new BadRequestException('Insufficient balance (Race Condition Detected)');
      }

      await tx.wallet.update({
        where: { id: destWallet.id },
        data: { balance: { increment: amount } },
      });
    });

    return { message: 'Transfer successful' };
  }

  async sendToUser(userId: string, data: { asset: string; amount: number; recipient: string; network?: string }) {
    const amount = Number(data.amount);
    if (!data.asset) throw new BadRequestException('Asset is required');
    if (!data.recipient) throw new BadRequestException('Recipient is required');
    if (!amount || amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const senderWallet = await this.prisma.wallet.findFirst({
      where: {
        userId,
        asset: data.asset,
        accountType: 'SPOT',
        ...(data.network ? { network: data.network } : {}),
      },
    });

    if (!senderWallet || new Decimal(senderWallet.balance).lessThan(amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const recipientUser = await this.findRecipient(data.recipient);

    if (recipientUser.id === userId) {
      throw new BadRequestException('Cannot send to your own account');
    }

    const network = data.network || senderWallet.network;
    const recipientWallet = await this.createOrGetWallet(recipientUser.id, data.asset, network, 'SPOT');

    const [, , senderTransaction] = await this.prisma.$transaction(async (tx) => {
      const sender = await tx.wallet.updateMany({
        where: { 
          id: senderWallet.id, 
          balance: { gte: amount } 
        },
        data: { balance: { decrement: amount } },
      });

      if (sender.count === 0) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: amount } },
      });

      const txOut = await tx.transaction.create({
        data: {
          userId,
          type: 'TRANSFER_OUT',
          asset: data.asset,
          network,
          amount,
          fee: 0,
          toAddress: recipientUser.id,
          status: 'COMPLETED',
        },
      });

      await tx.transaction.create({
        data: {
          userId: recipientUser.id,
          type: 'TRANSFER_IN',
          asset: data.asset,
          network,
          amount,
          fee: 0,
          fromAddress: userId,
          status: 'COMPLETED',
        },
      });

      return [null, null, txOut];
    });

    return {
      message: 'Transfer successful',
      transactionId: senderTransaction.id,
      recipientId: recipientUser.id,
    };
  }

  async lookupRecipient(userId: string, recipient: string) {
    const recipientUser = await this.findRecipient(recipient);
    if (recipientUser.id === userId) {
      throw new BadRequestException('Cannot send to your own account');
    }

    return {
      id: recipientUser.id,
      name: recipientUser.name,
      avatarUrl: recipientUser.avatarUrl || undefined,
    };
  }

  async getTransactions(userId: string, filters?: any) {
    const where: any = { userId };
    if (filters?.type) where.type = filters.type;
    if (filters?.asset) where.asset = filters.asset;
    if (filters?.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(filters?.limit) || 50,
        skip: parseInt(filters?.offset) || 0,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items,
      total,
      page: Math.floor((parseInt(filters?.offset) || 0) / (parseInt(filters?.limit) || 50)) + 1,
      limit: parseInt(filters?.limit) || 50,
      totalPages: Math.ceil(total / (parseInt(filters?.limit) || 50)),
    };
  }

  async getTransactionById(userId: string, id: string) {
    return this.prisma.transaction.findFirst({
      where: { id, userId },
    });
  }

  async createTransaction(data: {
    userId: string;
    type: string;
    asset: string;
    amount: number;
    fee?: number;
    status?: string;
    fromAddress?: string;
    toAddress?: string;
    txHash?: string;
    network?: string;
    metadata?: Record<string, unknown>;
    note?: string;
  }) {
    return this.prisma.transaction.create({ data: data as any });
  }

  async getPortfolioValue(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId, accountType: 'SPOT' },
    });

    let totalUsd = new Decimal(0);
    for (const wallet of wallets) {
      if (wallet.asset === 'USDT' || wallet.asset === 'USDC') {
        totalUsd = totalUsd.add(wallet.balance);
      }
    }

    return {
      totalUsd: totalUsd.toNumber(),
      change24h: 0,
      wallets,
    };
  }

  async getDepositAddress(userId: string, asset: string, network: string) {
    // First try to find a wallet with an existing address
    let wallet = await this.prisma.wallet.findFirst({
      where: { userId, asset, network, address: { not: null } },
    });

    // If no wallet with address, find any SPOT wallet for this asset/network
    if (!wallet) {
      wallet = await this.prisma.wallet.findFirst({
        where: { userId, asset, network, accountType: 'SPOT' },
      });
    }

    if (!wallet) {
      // Create new wallet with unique address
      const address = this.generateDepositAddress(network);
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          asset,
          network,
          address,
          balance: 0,
          lockedBalance: 0,
        },
      });
    } else if (!wallet.address) {
      // Wallet exists but has no address - generate and PERSIST it
      const address = this.generateDepositAddress(network);
      wallet = await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { address },
      });
    }

    return {
      address: wallet.address!,
      network,
      asset,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallet.address}`,
    };
  }

  /**
   * 🚨 IMPORTANT: This generates PLACEHOLDER addresses for development/demo purposes.
   * In PRODUCTION, you MUST integrate with a real wallet provider (e.g., Fireblocks, BitGo, etc.)
   * to generate actual blockchain addresses that can receive deposits.
   * 
   * TODO: Replace with real wallet integration before production deployment
   */
  private generateDepositAddress(network: string): string {
    // 🔒 PRODUCTION WARNING: Log warning in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ WARNING: Using placeholder deposit addresses in production! Integrate real wallet provider.');
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let address = '';
    let prefix = '';
    let length = 34;

    switch (network) {
      case 'TRC20':
        prefix = 'T';
        length = 33;
        break;
      case 'ERC20':
      case 'BEP20':
      case 'POLYGON':
      case 'Arbitrum One':
        prefix = '0x';
        length = 40;
        break;
      case 'SOL':
      case 'SPL':
        prefix = '';
        length = 44;
        break;
      case 'Bitcoin':
      case 'BTC':
        prefix = 'bc1q';
        length = 38;
        break;
      default:
        prefix = '';
        length = 34;
    }
    
    for (let i = 0; i < length; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return prefix + address;
  }

  async requestWithdrawal(userId: string, data: {
    asset: string;
    network: string;
    address: string;
    amount: number;
    memo?: string;
  }) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, asset: data.asset, network: data.network },
    });

    if (!wallet || new Decimal(wallet.balance).lessThan(data.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const fee = this.calculateWithdrawalFee(data.asset, data.network);
    const totalAmount = new Decimal(data.amount).add(fee);

    if (new Decimal(wallet.balance).lessThan(totalAmount)) {
      throw new BadRequestException('Insufficient balance for fee');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAW',
        asset: data.asset,
        network: data.network,
        amount: data.amount,
        fee,
        toAddress: data.address,
        status: 'PENDING',
        note: data.memo,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      const sender = await tx.wallet.updateMany({
        where: { 
          id: wallet.id, 
          balance: { gte: totalAmount.toNumber() } 
        },
        data: { balance: { decrement: totalAmount.toNumber() } },
      });

      if (sender.count === 0) {
        throw new BadRequestException('Insufficient balance');
      }
    });

    return {
      transactionId: transaction.id,
      message: 'Withdrawal request submitted',
    };
  }

  async validateAddress(address: string, network: string) {
    let valid = false;
    let message = '';

    switch (network) {
      case 'TRC20':
        valid = /^T[a-zA-Z0-9]{33}$/.test(address);
        message = valid ? 'Valid TRC20 address' : 'Invalid TRC20 address. Must start with T and be 34 characters.';
        break;
      case 'ERC20':
      case 'BEP20':
      case 'POLYGON':
      case 'Arbitrum One':
        valid = /^0x[a-fA-F0-9]{40}$/.test(address);
        message = valid ? `Valid ${network} address` : `Invalid ${network} address. Must start with 0x and be 42 characters.`;
        break;
      case 'SOL':
      case 'SPL':
        valid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
        message = valid ? 'Valid Solana address' : 'Invalid Solana address (Base58 format required).';
        break;
      case 'Bitcoin':
      case 'BTC':
        valid = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-Z0-9]{25,90}$/.test(address);
        message = valid ? 'Valid Bitcoin address' : 'Invalid Bitcoin address.';
        break;
      default:
        message = 'Unknown network';
    }

    return { valid, message, network };
  }

  async getWithdrawalFee(asset: string, network: string, amount: number) {
    const fee = this.calculateWithdrawalFee(asset, network);
    return {
      fee,
      total: amount + fee,
    };
  }

  private async findRecipient(identifier: string) {
    const trimmed = identifier.trim();
    if (!trimmed) throw new BadRequestException('Recipient is required');

    const criteria: Array<{ id?: string; email?: string; phone?: string }> = [{ id: trimmed }];

    if (trimmed.includes('@')) {
      criteria.push({ email: trimmed.toLowerCase() });
    }

    const digits = trimmed.replace(/[^\d+]/g, '');
    if (digits) {
      // 🌍 GLOBAL: Auto-detect country from phone number
      const normalized = normalizePhoneNumber(trimmed, 'GLOBAL');
      if (normalized.full) {
        criteria.push({ phone: normalized.full });
      }
    }

    const user = await this.prisma.user.findFirst({ where: { OR: criteria } });
    if (!user) throw new NotFoundException('Recipient not found');
    if (!user.isActive || user.isBanned) throw new BadRequestException('Recipient not available');
    return user;
  }

  private calculateWithdrawalFee(asset: string, network: string): number {
    const fees: Record<string, Record<string, number>> = {
      USDT: { TRC20: 1, ERC20: 5, BEP20: 0.3, SOL: 0.1, POLYGON: 0.1, 'Arbitrum One': 0.5 },
      USDC: { TRC20: 1, ERC20: 5, BEP20: 0.3, SOL: 0.1, POLYGON: 0.1, 'Arbitrum One': 0.5 },
      BUSD: { BEP20: 0.3 },
      DAI: { ERC20: 5, BEP20: 0.3 },
      BTC: { Bitcoin: 0.0005, BEP20: 0.0001 },
      ETH: { ERC20: 0.003, BEP20: 0.0005, 'Arbitrum One': 0.0003 },
    };
    return fees[asset]?.[network] || 1;
  }

  // ============================================
  // 🔒 SECURE 2-STEP WITHDRAWAL WITH OTP
  // ============================================

  /**
   * 🔒 ENTERPRISE-GRADE SECURE WITHDRAWAL - Step 1
   * Validates request, acquires lock, generates secure OTP, and sends notification
   */
  async initiateSecureWithdrawal(userId: string, data: {
    asset: string;
    network: string;
    address: string;
    amount: number;
    memo?: string;
  }) {
    // 🔒 Acquire distributed lock to prevent concurrent withdrawal requests
    const lockKey = `withdrawal:${userId}`;
    const lockValue = await this.redis.acquireLock(lockKey, 60); // 60 second lock
    
    if (!lockValue) {
      throw new BadRequestException('Another withdrawal is being processed. Please wait.');
    }

    try {
      // Get user for phone number
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.isBanned) throw new BadRequestException('Account is suspended');

      // Validate wallet balance
      const wallet = await this.prisma.wallet.findFirst({
        where: { userId, asset: data.asset, network: data.network },
      });

      if (!wallet || new Decimal(wallet.balance).lessThan(data.amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      const fee = this.calculateWithdrawalFee(data.asset, data.network);
      const totalAmount = new Decimal(data.amount).add(fee);

      if (new Decimal(wallet.balance).lessThan(totalAmount)) {
        throw new BadRequestException('Insufficient balance for fee');
      }

      // Validate address
      const addressValidation = await this.validateAddress(data.address, data.network);
      if (!addressValidation.valid) {
        throw new BadRequestException(addressValidation.message);
      }

      // 🔐 Generate cryptographically secure OTP
      const otp = generateOtp(6);
      const otpHash = hashOtp(otp); // Secure hash with salt
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const transactionId = generateTransactionId();

      // Create pending withdrawal request with secure OTP hash
      const withdrawalRequest = await this.prisma.transaction.create({
        data: {
          userId,
          type: 'WITHDRAW',
          asset: data.asset,
          network: data.network,
          amount: data.amount,
          fee,
          toAddress: data.address,
          status: 'PENDING',
          note: data.memo,
          metadata: {
            otpHash, // Securely hashed OTP
            otpExpiresAt: expiresAt.toISOString(),
            requiresOtp: true,
            otpVerified: false,
            transactionId,
            initiatedAt: new Date().toISOString(),
            ipAddress: 'system', // Should be passed from controller
          } as any,
        },
      });

      // Store OTP in Redis for quick verification (encrypted)
      await this.redis.set(
        `withdrawal:otp:${withdrawalRequest.id}`,
        otpHash,
        600 // 10 minutes
      );

      // 📤 Send OTP via SMS
      const userLanguage = (user as any).language === 'ar' ? 'ar' : 'en';
      const smsSent = await this.smsService.sendWithdrawalOtp(
        user.phone,
        otp,
        data.amount,
        data.asset,
        userLanguage
      );
      
      if (!smsSent && process.env.NODE_ENV === 'production') {
        // In production, fail if SMS couldn't be sent
        throw new BadRequestException('Failed to send verification code. Please try again.');
      }
      
      // 📝 Log for development only
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Withdrawal OTP for ${maskSensitiveData(user.phone, 3)}: ${otp}`);
      }

      return {
        requestId: withdrawalRequest.id,
        transactionId,
        message: 'OTP sent to your registered phone number',
        expiresAt,
        amount: data.amount,
        fee,
        total: totalAmount.toNumber(),
        address: maskSensitiveData(data.address, 6), // Mask in response
        network: data.network,
      };
    } finally {
      // 🔓 Always release the lock
      await this.redis.releaseLock(lockKey, lockValue);
    }
  }

  /**
   * 🔒 ENTERPRISE-GRADE SECURE WITHDRAWAL - Step 2
   * Verifies OTP securely, acquires lock, and processes withdrawal atomically
   */
  async confirmSecureWithdrawal(userId: string, requestId: string, otpInput: string) {
    // 🔒 Acquire distributed lock for this specific withdrawal
    const lockKey = `withdrawal:confirm:${requestId}`;
    const lockValue = await this.redis.acquireLock(lockKey, 30);
    
    if (!lockValue) {
      throw new BadRequestException('Withdrawal confirmation in progress. Please wait.');
    }

    try {
      // Find the pending withdrawal with OTP requirement
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          id: requestId,
          userId,
          status: 'PENDING',
        },
      });

      if (!transaction) {
        throw new BadRequestException('Withdrawal request not found or already processed');
      }

      const metadata = transaction.metadata as any;
      
      // Check if this requires OTP and hasn't been verified
      if (!metadata?.requiresOtp || metadata?.otpVerified) {
        throw new BadRequestException('Invalid withdrawal request');
      }
      
      // Check OTP expiration
      if (new Date(metadata.otpExpiresAt) < new Date()) {
        await this.prisma.transaction.update({
          where: { id: requestId },
          data: { status: 'FAILED' },
        });
        // Clean up Redis
        await this.redis.del(`withdrawal:otp:${requestId}`);
        throw new BadRequestException('OTP has expired. Please request a new withdrawal.');
      }

      // 🔐 Securely verify OTP using constant-time comparison
      const isValidOtp = verifyOtp(otpInput, metadata.otpHash);
      
      if (!isValidOtp) {
        // Track failed attempts
        const failedKey = `withdrawal:failed:${userId}`;
        const failedAttempts = await this.redis.increment(failedKey);
        await this.redis.expire(failedKey, 3600); // 1 hour window
        
        if (failedAttempts >= 5) {
          // Block user temporarily
          await this.redis.set(`withdrawal:blocked:${userId}`, '1', 3600);
          throw new BadRequestException('Too many failed attempts. Account temporarily locked for withdrawals.');
        }
        
        throw new BadRequestException(`Invalid OTP code. ${5 - failedAttempts} attempts remaining.`);
      }

      // Reset failed attempts on success
      await this.redis.del(`withdrawal:failed:${userId}`);

      // Get wallet and verify balance again (double-check)
      const wallet = await this.prisma.wallet.findFirst({
        where: { userId, asset: transaction.asset, network: transaction.network || 'TRC20' },
      });

      const totalAmount = new Decimal(transaction.amount).add(transaction.fee);

      if (!wallet || new Decimal(wallet.balance).lessThan(totalAmount)) {
        throw new BadRequestException('Insufficient balance');
      }

      // 🔄 Process withdrawal atomically
      const result = await this.prisma.$transaction(async (tx) => {
        // Deduct balance with atomic check
        const deductResult = await tx.wallet.updateMany({
          where: { 
            id: wallet.id, 
            balance: { gte: totalAmount.toNumber() } 
          },
          data: { balance: { decrement: totalAmount.toNumber() } },
        });

        if (deductResult.count === 0) {
          throw new BadRequestException('Insufficient balance (concurrent modification)');
        }

        // Update transaction status to PROCESSING
        const updatedTx = await tx.transaction.update({
          where: { id: requestId },
          data: { 
            status: 'PROCESSING',
            metadata: {
              ...metadata,
              otpVerified: true,
              otpVerifiedAt: new Date().toISOString(),
              processedAt: new Date().toISOString(),
            } as any,
          },
        });

        // Create notification for user
        await tx.notification.create({
          data: {
            userId,
            type: 'TRANSACTION',
            title: 'Withdrawal Processing',
            message: `Your withdrawal of ${transaction.amount} ${transaction.asset} is being processed.`,
          },
        });

        return updatedTx;
      });

      // Clean up Redis
      await this.redis.del(`withdrawal:otp:${requestId}`);

      return {
        transactionId: requestId,
        transactionRef: metadata.transactionId,
        message: 'Withdrawal confirmed and is being processed',
        status: 'PROCESSING',
        amount: transaction.amount,
        fee: transaction.fee,
        total: totalAmount.toNumber(),
        estimatedTime: '10-30 minutes',
      };
    } finally {
      // 🔓 Always release the lock
      await this.redis.releaseLock(lockKey, lockValue);
    }
  }

  /**
   * Check if user is blocked from withdrawals
   */
  async isWithdrawalBlocked(userId: string): Promise<boolean> {
    const blocked = await this.redis.get(`withdrawal:blocked:${userId}`);
    return !!blocked;
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, type: 'WITHDRAW' },
    });

    if (!transaction) {
      throw new NotFoundException('Withdrawal not found');
    }

    return {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      fee: transaction.fee,
      asset: transaction.asset,
      network: transaction.network,
      address: maskSensitiveData(transaction.toAddress || '', 6),
      createdAt: transaction.createdAt,
      txHash: transaction.txHash,
    };
  }
}
