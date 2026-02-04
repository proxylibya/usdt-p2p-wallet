import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ========== ADMIN AUTH ==========

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const payload = { 
      sub: admin.id, 
      email: admin.email, 
      role: admin.role,
      isAdmin: true,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '24h' });

    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async getAdminProfile(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async initialSetup(data: { email: string; password: string; name: string; setupKey?: string }) {
    // Check if any admin exists
    const adminCount = await this.prisma.adminUser.count();
    
    if (adminCount > 0) {
      throw new BadRequestException('Setup already completed. Admin users exist.');
    }

    // Optional: Verify setup key from environment
    const envSetupKey = process.env.ADMIN_SETUP_KEY;
    if (envSetupKey && data.setupKey !== envSetupKey) {
      throw new UnauthorizedException('Invalid setup key');
    }

    // Create the first admin
    const passwordHash = await bcrypt.hash(data.password, 12);
    const admin = await this.prisma.adminUser.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: 'superadmin',
        isActive: true,
      },
    });

    // Generate token for immediate login
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '24h' });

    return {
      success: true,
      message: 'Admin account created successfully',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  // ========== DASHBOARD ==========

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      pendingKyc,
      totalTransactions,
      pendingWithdrawals,
      activeP2POffers,
      openDisputes,
      totalWalletBalance,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'PENDING', type: 'WITHDRAW' } }),
      this.prisma.p2POffer.count({ where: { isActive: true } }),
      this.prisma.p2PTrade.count({ where: { status: 'DISPUTED' } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }),
    ]);

    const recentTransactions = await this.prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    const recentUsers = await this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, createdAt: true, kycStatus: true },
    });

    return {
      users: { total: totalUsers, active: activeUsers, banned: bannedUsers, pendingKyc },
      transactions: { total: totalTransactions, pendingWithdrawals },
      p2p: { activeOffers: activeP2POffers, openDisputes },
      totalBalance: Number(totalWalletBalance._sum.balance) || 0,
      recentTransactions,
      recentUsers,
    };
  }

  // ========== USERS MANAGEMENT ==========

  async getUsers(page = 1, limit = 20, filters?: { search?: string; status?: string; kycStatus?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status === 'active') where.isActive = true;
    if (filters?.status === 'inactive') where.isActive = false;
    if (filters?.status === 'banned') where.isBanned = true;
    if (filters?.kycStatus) where.kycStatus = filters.kycStatus;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          isBanned: true,
          kycStatus: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { wallets: true, transactions: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map(user => ({
      ...user,
      trades: user._count.transactions, // Simplified proxy for trades
      balance: 0, // Would need to aggregate wallets for total balance
      role: 'user', // Default role
    }));

    return { users: formattedUsers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallets: true,
        transactions: { take: 20, orderBy: { createdAt: 'desc' } },
        p2pOffers: { take: 10 },
        p2pTradesAsBuyer: { take: 10 },
        p2pTradesAsSeller: { take: 10 },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, twoFactorSecret, biometricKey, ...safeUser } = user;
    return safeUser;
  }

  async updateUserProfile(id: string, data: { name?: string; email?: string; avatarUrl?: string; isActive?: boolean; isBanned?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Check email uniqueness if changing
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        throw new BadRequestException('Email already registered');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isBanned !== undefined && { isBanned: data.isBanned }),
      },
    });

    await this.createAuditLog('USER_PROFILE_UPDATE', id, data);
    return { message: 'User profile updated', user: this.sanitizeUser(updated) };
  }

  async createUser(data: { name: string; phone: string; email?: string; password: string; role?: string }) {
    // Check if phone already exists
    const existingUser = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingUser) {
      throw new BadRequestException('Phone number already registered');
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        throw new BadRequestException('Email already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user with default wallets
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          passwordHash,
          isActive: true,
          kycStatus: 'NOT_VERIFIED',
        },
      });

      // Create default USDT wallets
      await tx.wallet.createMany({
        data: [
          { userId: newUser.id, asset: 'USDT', network: 'TRC20', accountType: 'SPOT', balance: 0, lockedBalance: 0 },
          { userId: newUser.id, asset: 'USDT', network: 'TRC20', accountType: 'FUNDING', balance: 0, lockedBalance: 0 },
        ],
      });

      return newUser;
    });

    await this.createAuditLog('USER_CREATED', user.id, { name: data.name, phone: data.phone, email: data.email });
    return { message: 'User created successfully', user: this.sanitizeUser(user) };
  }

  async updateUserStatus(id: string, data: { isActive?: boolean; isBanned?: boolean; banReason?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isBanned !== undefined && { isBanned: data.isBanned }),
      },
    });

    await this.createAuditLog('USER_STATUS_UPDATE', id, data);
    return { message: 'User status updated', user: this.sanitizeUser(updated) };
  }

  // ========== KYC MANAGEMENT ==========

  async getPendingKyc(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { kycStatus: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          kycStatus: true,
          kycData: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where: { kycStatus: 'PENDING' } }),
    ]);

    const requests = users.map(user => {
        const kycData = user.kycData as any || {};
        return {
            id: user.id, // Using userId as request ID for simplicity or generate one if you track requests separately
            userId: user.id,
            userName: user.name,
            email: user.email,
            documentType: kycData.documentType || 'unknown',
            status: user.kycStatus.toLowerCase(),
            submittedAt: user.createdAt, // Or a specific kycSubmittedAt field if added
            documents: kycData.documents || [],
        };
    });

    return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async verifyKyc(userId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.kycStatus !== 'PENDING') {
      throw new BadRequestException('KYC is not pending');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: status,
        ...(reason && { kycData: { ...(user.kycData as any), reviewNote: reason, reviewedAt: new Date() } }),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: status === 'VERIFIED' ? 'KYC Approved' : 'KYC Rejected',
        message: status === 'VERIFIED' 
          ? 'Your identity verification has been approved.' 
          : `Your identity verification was rejected. Reason: ${reason || 'Not specified'}`,
      },
    });

    await this.createAuditLog('KYC_VERIFICATION', userId, { status, reason });
    return { message: `KYC ${status.toLowerCase()}`, user: this.sanitizeUser(updated) };
  }

  // ========== TRANSACTIONS ==========

  async getTransactions(page = 1, limit = 20, filters?: { type?: string; status?: string; userId?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.type && filters.type !== 'all') where.type = filters.type.toUpperCase();
    if (filters?.status && filters.status !== 'all') where.status = filters.status.toUpperCase();
    if (filters?.userId) where.userId = filters.userId;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, phone: true } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const formattedTransactions = transactions.map(tx => ({
        id: tx.id,
        type: tx.type.toLowerCase(),
        userId: tx.userId,
        userName: tx.user.name,
        asset: tx.asset,
        amount: Number(tx.amount),
        fee: Number(tx.fee),
        status: tx.status.toLowerCase(),
        txHash: tx.txHash,
        createdAt: tx.createdAt,
    }));

    return { transactions: formattedTransactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateTransaction(id: string, data: { status: string; adminNote?: string }) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { status: data.status as any },
    });

    await this.createAuditLog('TRANSACTION_UPDATE', id, data);
    return updated;
  }
  
  // ========== WALLETS ==========

  async getWalletStats() {
    // Aggregate all wallets by asset
    const stats = await this.prisma.wallet.groupBy({
      by: ['asset'],
      _sum: {
        balance: true,
        lockedBalance: true,
      },
      _count: {
        userId: true,
      },
    });

    // Mock 24h change for now, or calculate from transactions if needed
    const formattedStats = stats.map(stat => ({
      asset: stat.asset,
      totalBalance: Number(stat._sum.balance) || 0,
      lockedBalance: Number(stat._sum.lockedBalance) || 0,
      usersCount: stat._count.userId,
      change24h: 0, // Placeholder
    }));

    return { wallets: formattedStats };
  }

  // ========== STAKING (EARN) ==========

  async getStakingProducts(activeOnly = false) {
    return this.prisma.stakingProduct.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });
  }

  async createStakingProduct(data: { asset: string; apy: number; durationDays: number; minAmount: number; maxAmount?: number }) {
    const product = await this.prisma.stakingProduct.create({
      data: {
        asset: data.asset,
        apy: data.apy,
        durationDays: data.durationDays,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        isActive: true,
      }
    });
    await this.createAuditLog('STAKING_PRODUCT_CREATE', product.id, data);
    return product;
  }

  async updateStakingProductStatus(id: string, isActive: boolean) {
    const product = await this.prisma.stakingProduct.update({
      where: { id },
      data: { isActive }
    });
    await this.createAuditLog('STAKING_PRODUCT_STATUS_UPDATE', id, { isActive });
    return product;
  }

  // ========== P2P TRADING ==========

  async getP2POffers(page = 1, limit = 20, filters?: { type?: string; status?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.type && filters.type !== 'all') where.type = filters.type;
    if (filters?.status) {
      if (filters.status === 'active') where.isActive = true;
      if (filters.status === 'paused') where.isActive = false;
      // Add more status logic if needed based on P2POffer model
    }

    const [offers, total] = await Promise.all([
      this.prisma.p2POffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.p2POffer.count({ where }),
    ]);

    // Format for admin dashboard
    const formattedOffers = offers.map(offer => ({
      id: offer.id,
      type: offer.type,
      userId: offer.userId,
      userName: offer.user.name,
      asset: offer.asset,
      fiatCurrency: offer.fiatCurrency,
      price: Number(offer.price),
      available: Number(offer.available),
      minLimit: Number(offer.minLimit),
      maxLimit: Number(offer.maxLimit),
      paymentMethods: offer.paymentMethods,
      status: offer.isActive ? 'active' : 'paused',
      trades: offer.completedTrades,
      createdAt: offer.createdAt,
    }));

    return { offers: formattedOffers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleOfferStatus(offerId: string, isActive: boolean) {
    const offer = await this.prisma.p2POffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');

    const updated = await this.prisma.p2POffer.update({
      where: { id: offerId },
      data: { isActive },
    });

    await this.createAuditLog('P2P_OFFER_STATUS_UPDATE', offerId, { isActive });
    return updated;
  }

  async getP2PTrades(page = 1, limit = 20, filters?: { status?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status.toUpperCase();
    }

    const [trades, total] = await Promise.all([
      this.prisma.p2PTrade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
          offer: { select: { asset: true, fiatCurrency: true } },
        },
      }),
      this.prisma.p2PTrade.count({ where }),
    ]);

    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      offerId: trade.offerId,
      buyerId: trade.buyerId,
      buyerName: trade.buyer.name,
      sellerId: trade.sellerId,
      sellerName: trade.seller.name,
      asset: trade.offer.asset,
      amount: Number(trade.amount),
      fiatAmount: Number(trade.fiatAmount),
      fiatCurrency: trade.offer.fiatCurrency,
      status: trade.status.toLowerCase(),
      createdAt: trade.createdAt,
      completedAt: trade.releasedAt || trade.cancelledAt,
    }));

    return { trades: formattedTrades, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ========== P2P DISPUTES ==========

  async getDisputes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      this.prisma.p2PTrade.findMany({
        where: { status: 'DISPUTED' },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          offer: true,
          buyer: { select: { id: true, name: true, phone: true } },
          seller: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.p2PTrade.count({ where: { status: 'DISPUTED' } }),
    ]);

    const formattedDisputes = disputes.map(dispute => ({
      id: dispute.id,
      tradeId: dispute.id,
      initiatorId: dispute.buyerId, // Assumption: Buyer initiates often, but logic should be better if we tracked it
      initiatorName: dispute.buyer.name,
      respondentId: dispute.sellerId,
      respondentName: dispute.seller.name,
      reason: dispute.disputeReason || 'No reason provided',
      status: 'open', // Map P2PTradeStatus to Dispute status if needed
      priority: 'medium', // Default priority
      amount: Number(dispute.amount),
      asset: dispute.offer.asset,
      createdAt: dispute.updatedAt, // Use updatedAt as dispute creation time
    }));

    return { disputes: formattedDisputes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveDispute(tradeId: string, resolution: { winner: 'buyer' | 'seller'; reason: string }) {
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id: tradeId },
      include: { offer: true },
    });

    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.status !== 'DISPUTED') throw new BadRequestException('Trade is not in dispute');

    const winnerId = resolution.winner === 'buyer' ? trade.buyerId : trade.sellerId;
    const loserId = resolution.winner === 'buyer' ? trade.sellerId : trade.buyerId;

    await this.prisma.$transaction(async (tx) => {
      await tx.p2PTrade.update({
        where: { id: tradeId },
        data: {
          status: 'RESOLVED',
          disputeResult: resolution.winner === 'buyer' ? 'buyer_wins' : 'seller_wins',
          disputeReason: JSON.stringify({
            winner: resolution.winner,
            reason: resolution.reason,
            resolvedAt: new Date(),
          }),
        },
      });

      if (resolution.winner === 'buyer') {
        // BUYER WINS: Release locked funds from seller TO buyer
        // 1. Decrement seller's locked balance
        await tx.wallet.updateMany({
          where: { userId: trade.sellerId, asset: trade.offer.asset, accountType: 'FUNDING' },
          data: { lockedBalance: { decrement: Number(trade.amount) } },
        });

        // 2. Credit buyer's wallet
        let buyerWallet = await tx.wallet.findFirst({
          where: { userId: trade.buyerId, asset: trade.offer.asset, accountType: 'SPOT' },
        });

        if (!buyerWallet) {
          buyerWallet = await tx.wallet.create({
            data: {
              userId: trade.buyerId,
              asset: trade.offer.asset,
              network: 'TRC20',
              accountType: 'SPOT',
              balance: 0,
              lockedBalance: 0,
            },
          });
        }

        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: { increment: Number(trade.amount) } },
        });
      } else {
        // SELLER WINS: Refund locked funds BACK to seller's balance
        await tx.wallet.updateMany({
          where: { userId: trade.sellerId, asset: trade.offer.asset, accountType: 'FUNDING' },
          data: { 
            balance: { increment: Number(trade.amount) },
            lockedBalance: { decrement: Number(trade.amount) },
          },
        });
      }

      await tx.notification.createMany({
        data: [
          {
            userId: winnerId,
            type: 'P2P_TRADE',
            title: 'Dispute Resolved - In Your Favor',
            message: `The dispute for trade #${tradeId.slice(0, 8)} has been resolved in your favor.`,
          },
          {
            userId: loserId,
            type: 'P2P_TRADE',
            title: 'Dispute Resolved',
            message: `The dispute for trade #${tradeId.slice(0, 8)} has been resolved. Reason: ${resolution.reason}`,
          },
        ],
      });
    });

    await this.createAuditLog('DISPUTE_RESOLUTION', tradeId, resolution);
    return { message: 'Dispute resolved', winner: resolution.winner };
  }

  // ========== AUDIT LOGS ==========

  async getAuditLogs(page = 1, limit = 50, filters?: { level?: string; category?: string }) {
    const skip = (page - 1) * limit;
    // Add filtering logic if audit logs have level/category fields
    const where: any = {}; 

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = logs.map(log => ({
        id: log.id,
        level: 'info', // Default as model might not have level
        category: log.action.split('_')[0].toLowerCase(), // Derive from action
        message: `${log.action} on ${log.entity}`,
        userId: log.userId,
        timestamp: log.createdAt,
        metadata: log.newValue as any,
    }));

    return { logs: formattedLogs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ========== SYSTEM SETTINGS ==========

  async getSystemSettings() {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { key: 'platform_config' },
    });

    if (!settings) {
      // Return defaults if not found
      return {
        platformName: 'USDT P2P Platform',
        supportEmail: 'support@usdtp2p.com',
        maintenanceMode: false,
        registrationEnabled: true,
        kycRequired: true,
        tradingFee: 0.1,
        withdrawalFee: 1.0,
        p2pFee: 0.1,
        minWithdrawal: 10,
        maxWithdrawal: 50000,
        dailyWithdrawalLimit: 100000,
        minP2PTrade: 10,
        maxP2PTrade: 10000,
        twoFactorRequired: false,
        passwordMinLength: 8,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
      };
    }

    return settings.value;
  }

  async updateSystemSettings(data: any, adminId: string) {
    const settings = await this.prisma.systemSettings.upsert({
      where: { key: 'platform_config' },
      update: {
        value: data,
        updatedBy: adminId,
      },
      create: {
        key: 'platform_config',
        value: data,
        updatedBy: adminId,
      },
    });

    await this.createAuditLog('SYSTEM_SETTINGS_UPDATE', settings.id, data);
    return settings.value;
  }

  // ========== NOTIFICATIONS MANAGEMENT ==========

  async getNotificationsList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { type: 'SYSTEM' }, // Only manage system broadcasts usually
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { type: 'SYSTEM' } }),
    ]);

    // This logic assumes we want to see a list of SENT notifications (templates or broadcasts)
    // The current Notification model is per-user. For a "System Broadcast" feature, 
    // we typically create records for all users or have a separate Broadcast model.
    // For simplicity, we'll return recent system notifications.
    
    // In a real system, you'd likely aggregate these or have a separate "Broadcast" table.
    // Here we'll return a mock aggregation or just the raw list.
    // Let's assume we return raw list for now.

    const formattedNotifications = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: 'info', // Default
      target: 'specific', // Since it's per user
      targetCount: 1,
      sentAt: n.createdAt,
      readCount: n.isRead ? 1 : 0,
    }));

    return { notifications: formattedNotifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createBroadcastNotification(data: { title: string; message: string; type: string; target: string }) {
    // 1. Find target users
    let where: any = {};
    if (data.target === 'users') where = { role: 'user' }; // Assuming role exists on user or logic
    if (data.target === 'merchants') where = { role: 'merchant' }; // Assuming role exists
    
    // Get all user IDs (careful with large scale)
    const users = await this.prisma.user.findMany({ where, select: { id: true } });

    // 2. Create notifications in batches
    const notifications = users.map(u => ({
      userId: u.id,
      type: 'SYSTEM', // Cast to enum
      title: data.title,
      message: data.message,
      isRead: false,
    }));

    // Prisma createMany
    await this.prisma.notification.createMany({
        data: notifications as any
    });

    await this.createAuditLog('BROADCAST_NOTIFICATION', 'system', { ...data, count: users.length });
    return { success: true, count: users.length };
  }

  async deleteNotification(id: string) {
      // This deletes a specific user notification instance
      await this.prisma.notification.delete({ where: { id } });
      return { success: true };
  }

  // ========== REPORTS ==========

  async getReportsData(range: 'week' | 'month' | 'quarter' | 'year') {
    // Determine start date
    const now = new Date();
    const startDate = new Date();
    if (range === 'week') startDate.setDate(now.getDate() - 7);
    if (range === 'month') startDate.setMonth(now.getMonth() - 1);
    if (range === 'quarter') startDate.setMonth(now.getMonth() - 3);
    if (range === 'year') startDate.setFullYear(now.getFullYear() - 1);

    // Aggregate Transactions by Date (Volume)
    // This requires raw SQL for date truncation usually, or heavy processing in JS.
    // We'll do a simple JS aggregation for now.
    
    const transactions = await this.prisma.transaction.findMany({
        where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
        select: { createdAt: true, amount: true, type: true }
    });

    // Group by date (Day)
    const volumeByDate = new Map<string, number>();
    const usersByDate = new Map<string, number>(); // This would need User creation dates

    transactions.forEach(tx => {
        const dateKey = tx.createdAt.toISOString().split('T')[0];
        const current = volumeByDate.get(dateKey) || 0;
        volumeByDate.set(dateKey, current + Number(tx.amount));
    });

    const newUsers = await this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
    });

    newUsers.forEach(u => {
        const dateKey = u.createdAt.toISOString().split('T')[0];
        const current = usersByDate.get(dateKey) || 0;
        usersByDate.set(dateKey, current + 1);
    });

    const graphData = Array.from(volumeByDate.entries()).map(([date, volume]) => ({
        date,
        volume,
        users: usersByDate.get(date) || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Stats
    const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalNewUsers = newUsers.length;
    const totalTxCount = transactions.length;
    
    // Revenue (Mock calculation from fees)
    const revenue = totalVolume * 0.001; // 0.1%

    return {
        graphData,
        stats: {
            volume: totalVolume,
            newUsers: totalNewUsers,
            transactions: totalTxCount,
            revenue
        }
    };
  }

  // ========== TRANSACTION DETAILS ==========

  async getTransactionDetails(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      id: transaction.id,
      type: transaction.type,
      userId: transaction.user.id,
      userName: transaction.user.name,
      userPhone: transaction.user.phone,
      asset: transaction.asset,
      amount: Number(transaction.amount),
      fee: Number(transaction.fee || 0),
      netAmount: Number(transaction.amount) - Number(transaction.fee || 0),
      status: transaction.status,
      txHash: transaction.txHash,
      address: transaction.toAddress || transaction.fromAddress,
      network: transaction.network || 'TRC20',
      createdAt: transaction.createdAt.toISOString(),
      completedAt: transaction.completedAt?.toISOString(),
    };
  }

  // ========== P2P OFFER DETAILS ==========

  async getOfferDetails(id: string) {
    const offer = await this.prisma.p2POffer.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
        _count: {
          select: { trades: true },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return {
      id: offer.id,
      type: offer.type,
      userId: offer.user.id,
      userName: offer.user.name,
      userPhone: offer.user.phone,
      asset: offer.asset,
      fiatCurrency: offer.fiatCurrency,
      price: Number(offer.price),
      available: Number(offer.available),
      totalAmount: Number(offer.available), // Using available as total
      minLimit: Number(offer.minLimit),
      maxLimit: Number(offer.maxLimit),
      paymentMethods: offer.paymentMethods,
      terms: offer.terms,
      isActive: offer.isActive,
      completedTrades: offer._count.trades,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }

  // ========== P2P TRADE DETAILS ==========

  async getTradeDetails(id: string) {
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, name: true, phone: true },
        },
        seller: {
          select: { id: true, name: true, phone: true },
        },
        offer: {
          select: { id: true, paymentMethods: true, asset: true, fiatCurrency: true },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    return {
      id: trade.id,
      offerId: trade.offer.id,
      buyerId: trade.buyer.id,
      buyerName: trade.buyer.name,
      sellerId: trade.seller.id,
      sellerName: trade.seller.name,
      asset: trade.offer.asset,
      amount: Number(trade.amount),
      price: Number(trade.price),
      fiatAmount: Number(trade.fiatAmount),
      fiatCurrency: trade.offer.fiatCurrency,
      paymentMethod: trade.offer.paymentMethods[0] || 'N/A',
      status: trade.status,
      createdAt: trade.createdAt.toISOString(),
      paidAt: trade.paidAt?.toISOString(),
      releasedAt: trade.releasedAt?.toISOString(),
      cancelledAt: trade.cancelledAt?.toISOString(),
      disputeReason: trade.disputeReason,
    };
  }

  async cancelTrade(id: string) {
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id },
      include: { offer: true },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.status === 'COMPLETED' || trade.status === 'CANCELLED') {
      throw new BadRequestException('Trade cannot be cancelled');
    }

    // Return locked funds to seller
    await this.prisma.$transaction([
      this.prisma.p2PTrade.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      }),
      this.prisma.p2POffer.update({
        where: { id: trade.offerId },
        data: { available: { increment: trade.amount } },
      }),
    ]);

    await this.createAuditLog('P2P_TRADE_CANCELLED', id, { tradeId: id });
    return { success: true, message: 'Trade cancelled successfully' };
  }

  async releaseTrade(id: string) {
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id },
      include: { offer: { select: { asset: true } } },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.status !== 'PAID') {
      throw new BadRequestException('Trade must be in PAID status to release');
    }

    // Transfer funds to buyer
    await this.prisma.$transaction([
      this.prisma.p2PTrade.update({
        where: { id },
        data: { status: 'COMPLETED', releasedAt: new Date() },
      }),
      this.prisma.wallet.update({
        where: {
          userId_asset_network_accountType: {
            userId: trade.buyerId,
            asset: trade.offer.asset,
            network: 'TRC20',
            accountType: 'SPOT',
          },
        },
        data: { balance: { increment: trade.amount } },
      }),
    ]);

    await this.createAuditLog('P2P_TRADE_RELEASED', id, { tradeId: id });
    return { success: true, message: 'Funds released successfully' };
  }

  private async createAuditLog(action: string, targetId: string, details: any) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: 'system',
        entityId: targetId,
        newValue: details as any,
      },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, biometricKey, securityQuestions, ...safe } = user;
    return safe;
  }

  // ========== ADMIN USERS ==========

  async getAdminUsers() {
    const admins = await this.prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      admins: admins.map(admin => ({
        ...admin,
        lastLoginAt: admin.lastLoginAt?.toISOString() || null,
        createdAt: admin.createdAt.toISOString().split('T')[0],
      })),
    };
  }

  async createAdminUser(data: { name: string; email: string; password: string; role: string }) {
    const existing = await this.prisma.adminUser.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const admin = await this.prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as any,
      },
    });

    return { success: true, id: admin.id };
  }

  async toggleAdminStatus(id: string, isActive: boolean) {
    await this.prisma.adminUser.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  }

  // ========== SYSTEM HEALTH ==========

  async getSystemHealth() {
    const startTime = Date.now();
    
    // Check database
    let dbResponseTime = 0;
    let dbStatus = 'offline';
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'online';
    } catch {
      dbResponseTime = -1;
    }

    // Get real metrics
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    const activeUsers = await this.prisma.user.count({ where: { isActive: true } });

    // Get recent errors from audit log
    const recentErrors = await this.prisma.auditLog.findMany({
      where: {
        action: { contains: 'ERROR' },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: dbStatus === 'online' ? 'healthy' : 'critical',
      uptime: process.uptime() > 86400 
        ? `${Math.floor(process.uptime() / 86400)}d ${Math.floor((process.uptime() % 86400) / 3600)}h`
        : `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      lastChecked: new Date().toISOString(),
      services: [
        { name: 'API Server', status: 'online', responseTime: Date.now() - startTime },
        { name: 'Database', status: dbStatus, responseTime: dbResponseTime },
      ],
      metrics: {
        memoryUsage: memoryUsagePercent,
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        activeUsers,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      recentErrors: recentErrors.map(e => ({
        id: e.id,
        action: e.action,
        timestamp: e.createdAt,
      })),
    };
  }

  // ========== SUPPORT TICKETS ==========

  async getSupportTickets(filters: { status?: string; priority?: string }) {
    const where: any = {};
    if (filters.status && filters.status !== 'all') where.status = filters.status;
    if (filters.priority && filters.priority !== 'all') where.priority = filters.priority;

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Calculate stats
    const [open, inProgress, resolved] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      this.prisma.supportTicket.count({ where: { status: 'resolved' } }),
    ]);

    return {
      tickets: tickets.map(t => ({
        ...t,
        lastMessage: t.messages[0]?.message || null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      stats: { open, inProgress, resolved, avgResponseTime: '15m' },
    };
  }

  async updateTicketStatus(id: string, status: string) {
    await this.prisma.supportTicket.update({
      where: { id },
      data: { 
        status,
        ...(status === 'resolved' && { resolvedAt: new Date() }),
      },
    });

    await this.createAuditLog('TICKET_STATUS_UPDATE', id, { status });
    return { success: true };
  }

  async replyToTicket(id: string, message: string, adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });

    await this.prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: adminId,
        senderType: 'admin',
        senderName: admin?.name || 'Admin',
        message,
        attachments: [],
      },
    });

    // Update ticket status to in_progress if it was open
    await this.prisma.supportTicket.updateMany({
      where: { id, status: 'open' },
      data: { status: 'in_progress' },
    });

    return { success: true };
  }

  // ========== PAYMENT METHODS ==========

  async getPaymentMethods() {
    const methods = await this.prisma.p2PPaymentMethod.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // If no methods exist, seed default ones
    if (methods.length === 0) {
      const defaultMethods = [
        { name: 'Bank Transfer', nameAr: 'تحويل بنكي', type: 'bank', icon: 'bank', requiresDetails: ['bankName', 'accountNumber', 'accountName'], countries: ['LY'], processingTime: '1-2 hours', sortOrder: 0 },
        { name: 'Sadad', nameAr: 'سداد', type: 'ewallet', icon: 'wallet', requiresDetails: ['phoneNumber'], countries: ['LY'], processingTime: 'Instant', sortOrder: 1 },
        { name: 'Mobi Cash', nameAr: 'موبي كاش', type: 'ewallet', icon: 'smartphone', requiresDetails: ['phoneNumber'], countries: ['LY'], processingTime: 'Instant', sortOrder: 2 },
        { name: 'Cash in Person', nameAr: 'كاش شخصي', type: 'cash', icon: 'cash', requiresDetails: ['location'], countries: ['LY'], processingTime: 'Instant', sortOrder: 3 },
      ];

      await this.prisma.p2PPaymentMethod.createMany({ data: defaultMethods });
      const seededMethods = await this.prisma.p2PPaymentMethod.findMany({ orderBy: { sortOrder: 'asc' } });
      return { methods: seededMethods };
    }

    return { methods };
  }

  async createPaymentMethod(data: { name: string; nameAr?: string; type: string; requiresDetails: string[]; countries: string[]; processingTime: string; icon?: string }) {
    const method = await this.prisma.p2PPaymentMethod.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        type: data.type,
        icon: data.icon,
        requiresDetails: data.requiresDetails,
        countries: data.countries,
        processingTime: data.processingTime,
        isActive: true,
      },
    });

    await this.createAuditLog('PAYMENT_METHOD_CREATE', method.id, data);
    return { success: true, id: method.id, method };
  }

  async updatePaymentMethod(id: string, data: any) {
    const method = await this.prisma.p2PPaymentMethod.update({
      where: { id },
      data,
    });

    await this.createAuditLog('PAYMENT_METHOD_UPDATE', id, data);
    return { success: true, method };
  }

  async togglePaymentMethodStatus(id: string, isActive: boolean) {
    await this.prisma.p2PPaymentMethod.update({
      where: { id },
      data: { isActive },
    });

    await this.createAuditLog('PAYMENT_METHOD_STATUS', id, { isActive });
    return { success: true };
  }

  async deletePaymentMethod(id: string) {
    await this.prisma.p2PPaymentMethod.delete({ where: { id } });
    await this.createAuditLog('PAYMENT_METHOD_DELETE', id, {});
    return { success: true };
  }

  // ========== ANNOUNCEMENTS ==========

  async getAnnouncements() {
    const announcements = await this.prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      announcements: announcements.map(a => ({
        ...a,
        type: a.type.toLowerCase(),
      })),
    };
  }

  async createAnnouncement(data: {
    title: string;
    titleAr?: string;
    content: string;
    contentAr?: string;
    type?: string;
    target?: string;
    isPinned?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        titleAr: data.titleAr,
        content: data.content,
        contentAr: data.contentAr,
        type: (data.type?.toUpperCase() || 'INFO') as any,
        target: data.target || 'all',
        isPinned: data.isPinned || false,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: true,
      },
    });

    await this.createAuditLog('ANNOUNCEMENT_CREATE', announcement.id, data);
    return { success: true, id: announcement.id, announcement };
  }

  async updateAnnouncement(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.type) updateData.type = data.type.toUpperCase();
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    await this.createAuditLog('ANNOUNCEMENT_UPDATE', id, data);
    return { success: true, announcement };
  }

  async toggleAnnouncementStatus(id: string, isActive: boolean) {
    await this.prisma.announcement.update({
      where: { id },
      data: { isActive },
    });

    await this.createAuditLog('ANNOUNCEMENT_STATUS', id, { isActive });
    return { success: true };
  }

  async deleteAnnouncement(id: string) {
    await this.prisma.announcement.delete({ where: { id } });
    await this.createAuditLog('ANNOUNCEMENT_DELETE', id, {});
    return { success: true };
  }

  // ========== ADVANCED DASHBOARD ==========

  async getLiveStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalTransactions,
      transactionsToday,
      pendingTransactions,
      activeOffers,
      activeTrades,
      completedTradesToday,
      disputes,
      volume24h,
      volumeWeek,
      volumeMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      this.prisma.p2POffer.count({ where: { isActive: true } }),
      this.prisma.p2PTrade.count({ where: { status: { in: ['WAITING_PAYMENT', 'PAID'] } } }),
      this.prisma.p2PTrade.count({ where: { status: 'COMPLETED', releasedAt: { gte: todayStart } } }),
      this.prisma.p2PTrade.count({ where: { status: 'DISPUTED' } }),
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: todayStart }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: weekStart }, status: 'COMPLETED' },
        _sum: { fee: true },
      }),
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: monthStart }, status: 'COMPLETED' },
        _sum: { fee: true },
      }),
    ]);

    // Calculate growth (compare with previous period)
    const previousMonthStart = new Date();
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 2);
    const usersLastMonth = await this.prisma.user.count({
      where: { createdAt: { gte: previousMonthStart, lt: monthStart } },
    });
    const usersThisMonth = await this.prisma.user.count({
      where: { createdAt: { gte: monthStart } },
    });
    const growth = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;

    const uptimePercent = ((process.uptime() / (24 * 60 * 60)) * 100).toFixed(1);

    return {
      users: { 
        total: totalUsers, 
        active: activeUsers, 
        newToday: newUsersToday, 
        growth: Math.round(growth * 10) / 10 
      },
      transactions: { 
        total: totalTransactions, 
        today: transactionsToday, 
        pending: pendingTransactions, 
        volume24h: Number(volume24h._sum.amount) || 0 
      },
      p2p: { 
        activeOffers, 
        activeTrades, 
        completedToday: completedTradesToday, 
        disputes 
      },
      revenue: { 
        today: Number(volume24h._sum.amount) * 0.001 || 0,
        week: Number(volumeWeek._sum.fee) || 0, 
        month: Number(volumeMonth._sum.fee) || 0, 
        feePercent: 0.1 
      },
      system: { 
        uptime: `${uptimePercent}%`, 
        uptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }

  async getChartsData(period: string) {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get real transaction data grouped by day
    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
      select: { createdAt: true, amount: true, fee: true },
    });

    // Get real user registration data
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, countryCode: true },
    });

    // Group by date
    const volumeByDate = new Map<string, { volume: number; trades: number; fees: number }>();
    const usersByDate = new Map<string, number>();

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      volumeByDate.set(key, { volume: 0, trades: 0, fees: 0 });
      usersByDate.set(key, 0);
    }

    transactions.forEach(tx => {
      const key = tx.createdAt.toISOString().split('T')[0];
      const existing = volumeByDate.get(key);
      if (existing) {
        existing.volume += Number(tx.amount);
        existing.trades += 1;
        existing.fees += Number(tx.fee);
      }
    });

    users.forEach(u => {
      const key = u.createdAt.toISOString().split('T')[0];
      const existing = usersByDate.get(key) || 0;
      usersByDate.set(key, existing + 1);
    });

    // Get asset distribution from wallets
    const assetStats = await this.prisma.wallet.groupBy({
      by: ['asset', 'network'],
      _sum: { balance: true },
    });

    const totalBalance = assetStats.reduce((sum, a) => sum + Number(a._sum.balance || 0), 0);
    const assetDistribution = assetStats
      .filter(a => Number(a._sum.balance) > 0)
      .map(a => ({
        name: `${a.asset} ${a.network}`,
        value: totalBalance > 0 ? Math.round((Number(a._sum.balance) / totalBalance) * 100) : 0,
        color: a.asset === 'USDT' ? '#26A17B' : a.asset === 'USDC' ? '#2775CA' : '#848E9C',
      }))
      .slice(0, 5);

    // Get top countries
    const countryStats = await this.prisma.user.groupBy({
      by: ['countryCode'],
      _count: true,
    });

    const topCountries = countryStats
      .sort((a, b) => b._count - a._count)
      .slice(0, 5)
      .map(c => ({
        country: c.countryCode || 'Unknown',
        users: c._count,
      }));

    // Format data for charts
    const sortedDates = Array.from(volumeByDate.keys()).sort();
    
    return {
      volumeData: sortedDates.slice(-7).map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        volume: volumeByDate.get(date)?.volume || 0,
        trades: volumeByDate.get(date)?.trades || 0,
      })),
      userGrowth: sortedDates.slice(-7).map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        newUsers: usersByDate.get(date) || 0,
      })),
      revenueData: sortedDates.slice(-7).map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        fees: volumeByDate.get(date)?.fees || 0,
      })),
      assetDistribution,
      topCountries,
    };
  }

  // ========== FEES MANAGEMENT ==========

  async getFeeRules() {
    const rules = await this.prisma.feeRule.findMany({
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });

    // Seed default rules if none exist
    if (rules.length === 0) {
      const defaultRules = [
        { name: 'Trading Fee', type: 'percentage', category: 'trading', value: 0.1, appliesTo: 'all', description: 'Standard trading fee' },
        { name: 'Withdrawal Fee', type: 'fixed', category: 'withdrawal', value: 1, appliesTo: 'all', description: 'Fixed fee per withdrawal' },
        { name: 'P2P Trading Fee', type: 'percentage', category: 'p2p', value: 0.1, appliesTo: 'all', description: 'Fee for P2P transactions' },
        { name: 'VIP Trading Fee', type: 'percentage', category: 'trading', value: 0.05, appliesTo: 'vip', description: 'Reduced fee for VIP' },
        { name: 'Swap Fee', type: 'percentage', category: 'swap', value: 0.3, appliesTo: 'all', description: 'Fee for token swaps' },
      ];

      await this.prisma.feeRule.createMany({ data: defaultRules });
      const seededRules = await this.prisma.feeRule.findMany({ orderBy: { category: 'asc' } });
      return { rules: seededRules.map(r => ({ ...r, value: Number(r.value) })) };
    }

    return { rules: rules.map(r => ({ ...r, value: Number(r.value) })) };
  }

  async createFeeRule(data: {
    name: string;
    type?: string;
    category: string;
    value: number;
    minAmount?: number;
    maxAmount?: number;
    appliesTo?: string;
    description?: string;
  }) {
    const rule = await this.prisma.feeRule.create({
      data: {
        name: data.name,
        type: data.type || 'percentage',
        category: data.category,
        value: data.value,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        appliesTo: data.appliesTo || 'all',
        description: data.description,
        isActive: true,
      },
    });

    await this.createAuditLog('FEE_RULE_CREATE', rule.id, data);
    return { success: true, id: rule.id, rule };
  }

  async updateFeeRule(id: string, data: any) {
    const rule = await this.prisma.feeRule.update({
      where: { id },
      data,
    });

    await this.createAuditLog('FEE_RULE_UPDATE', id, data);
    return { success: true, rule };
  }

  async toggleFeeRuleStatus(id: string, isActive: boolean) {
    await this.prisma.feeRule.update({
      where: { id },
      data: { isActive },
    });

    await this.createAuditLog('FEE_RULE_STATUS', id, { isActive });
    return { success: true };
  }

  async deleteFeeRule(id: string) {
    await this.prisma.feeRule.delete({ where: { id } });
    await this.createAuditLog('FEE_RULE_DELETE', id, {});
    return { success: true };
  }

  async getRevenueStats() {
    return {
      totalRevenue: 125000,
      tradingFees: 45000,
      withdrawalFees: 15000,
      p2pFees: 35000,
      stakingRevenue: 30000,
      dailyAverage: 4166,
      monthlyGrowth: 15.5,
    };
  }

  // ========== SECURITY CENTER ==========

  async getSecurityAlerts() {
    const alerts = await this.prisma.securityAlert.findMany({
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return {
      alerts: alerts.map(a => ({
        ...a,
        timestamp: a.createdAt.toISOString(),
      })),
    };
  }

  async updateAlertStatus(id: string, status: string) {
    await this.prisma.securityAlert.update({
      where: { id },
      data: { 
        status,
        ...(status === 'resolved' && { resolvedAt: new Date() }),
      },
    });

    return { success: true };
  }

  async getBlockedEntities() {
    const blocked = await this.prisma.blockedEntity.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      blocked: blocked.map(b => ({
        ...b,
        blockedAt: b.createdAt.toISOString(),
        expiresAt: b.expiresAt?.toISOString(),
      })),
    };
  }

  async blockEntity(data: { type: string; value: string; reason: string; duration: string }) {
    // Calculate expiration
    let expiresAt: Date | null = null;
    if (data.duration !== 'permanent') {
      const hours = {
        '1h': 1, '24h': 24, '7d': 168, '30d': 720,
      }[data.duration] || 24;
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const entity = await this.prisma.blockedEntity.upsert({
      where: { type_value: { type: data.type, value: data.value } },
      update: { reason: data.reason, duration: data.duration, expiresAt },
      create: {
        type: data.type,
        value: data.value,
        reason: data.reason,
        duration: data.duration,
        expiresAt,
        blockedBy: 'Admin',
      },
    });

    await this.createAuditLog('ENTITY_BLOCKED', entity.id, data);
    return { success: true, id: entity.id };
  }

  async unblockEntity(id: string) {
    await this.prisma.blockedEntity.delete({ where: { id } });
    await this.createAuditLog('ENTITY_UNBLOCKED', id, {});
    return { success: true };
  }

  async getSecurityStats() {
    const [totalAlerts, criticalAlerts, blockedIPs, blockedUsers] = await Promise.all([
      this.prisma.securityAlert.count(),
      this.prisma.securityAlert.count({ where: { severity: 'critical', status: 'new' } }),
      this.prisma.blockedEntity.count({ where: { type: 'ip' } }),
      this.prisma.blockedEntity.count({ where: { type: 'user' } }),
    ]);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [failedLogins24h, suspiciousTx24h] = await Promise.all([
      this.prisma.securityAlert.count({ where: { type: 'login_attempt', createdAt: { gte: yesterday } } }),
      this.prisma.securityAlert.count({ where: { type: 'suspicious_tx', createdAt: { gte: yesterday } } }),
    ]);

    // Calculate security score based on open alerts
    const openAlerts = await this.prisma.securityAlert.count({ where: { status: 'new' } });
    const securityScore = Math.max(0, 100 - (openAlerts * 2) - (criticalAlerts * 10));

    return {
      totalAlerts,
      criticalAlerts,
      blockedIPs,
      blockedUsers,
      failedLogins24h,
      suspiciousTx24h,
      securityScore,
    };
  }

  // ========== LIMITS & RESTRICTIONS ==========

  async getLimitRules() {
    const limits = await this.prisma.limitRule.findMany({
      orderBy: [{ category: 'asc' }, { userType: 'asc' }],
    });

    // Seed default limits if none exist
    if (limits.length === 0) {
      const defaultLimits = [
        { name: 'Unverified Withdrawal', category: 'withdrawal', userType: 'unverified', minAmount: 10, maxAmount: 500, dailyLimit: 500, monthlyLimit: 2000, requiresApproval: false, approvalThreshold: 0 },
        { name: 'Verified Withdrawal', category: 'withdrawal', userType: 'verified', minAmount: 10, maxAmount: 10000, dailyLimit: 50000, monthlyLimit: 200000, requiresApproval: true, approvalThreshold: 5000 },
        { name: 'VIP Withdrawal', category: 'withdrawal', userType: 'vip', minAmount: 10, maxAmount: 100000, dailyLimit: 500000, monthlyLimit: 2000000, requiresApproval: true, approvalThreshold: 50000 },
        { name: 'P2P Daily Limit', category: 'p2p', userType: 'all', minAmount: 50, maxAmount: 50000, dailyLimit: 100000, monthlyLimit: 1000000, requiresApproval: false, approvalThreshold: 0 },
      ];

      await this.prisma.limitRule.createMany({ data: defaultLimits });
      const seededLimits = await this.prisma.limitRule.findMany({ orderBy: { category: 'asc' } });
      return { limits: seededLimits.map(l => this.formatLimitRule(l)) };
    }

    return { limits: limits.map(l => this.formatLimitRule(l)) };
  }

  private formatLimitRule(l: any) {
    return {
      ...l,
      minAmount: Number(l.minAmount),
      maxAmount: Number(l.maxAmount),
      dailyLimit: Number(l.dailyLimit),
      monthlyLimit: Number(l.monthlyLimit),
      approvalThreshold: Number(l.approvalThreshold),
    };
  }

  async createLimitRule(data: {
    name: string;
    category: string;
    userType?: string;
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
    requiresApproval?: boolean;
    approvalThreshold?: number;
  }) {
    const rule = await this.prisma.limitRule.create({
      data: {
        name: data.name,
        category: data.category,
        userType: data.userType || 'all',
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        dailyLimit: data.dailyLimit,
        monthlyLimit: data.monthlyLimit,
        requiresApproval: data.requiresApproval || false,
        approvalThreshold: data.approvalThreshold || 0,
        isActive: true,
      },
    });

    await this.createAuditLog('LIMIT_RULE_CREATE', rule.id, data);
    return { success: true, id: rule.id, rule };
  }

  async updateLimitRule(id: string, data: any) {
    const rule = await this.prisma.limitRule.update({
      where: { id },
      data,
    });

    await this.createAuditLog('LIMIT_RULE_UPDATE', id, data);
    return { success: true, rule };
  }

  async toggleLimitRuleStatus(id: string, isActive: boolean) {
    await this.prisma.limitRule.update({
      where: { id },
      data: { isActive },
    });

    await this.createAuditLog('LIMIT_RULE_STATUS', id, { isActive });
    return { success: true };
  }

  async getRestrictions() {
    const restrictions = await this.prisma.restriction.findMany({
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });

    // Seed default restrictions if none exist
    if (restrictions.length === 0) {
      const defaultRestrictions = [
        { type: 'country', value: 'KP', action: 'block', reason: 'Sanctioned country' },
        { type: 'country', value: 'IR', action: 'block', reason: 'Sanctioned country' },
      ];

      await this.prisma.restriction.createMany({ data: defaultRestrictions });
      const seeded = await this.prisma.restriction.findMany({ orderBy: { type: 'asc' } });
      return { restrictions: seeded };
    }

    return { restrictions };
  }

  async addRestriction(data: { type: string; value: string; action?: string; reason?: string }) {
    const restriction = await this.prisma.restriction.create({
      data: {
        type: data.type,
        value: data.value,
        action: data.action || 'block',
        reason: data.reason,
        isActive: true,
      },
    });

    await this.createAuditLog('RESTRICTION_CREATE', restriction.id, data);
    return { success: true, id: restriction.id, restriction };
  }

  async removeRestriction(id: string) {
    await this.prisma.restriction.delete({ where: { id } });
    await this.createAuditLog('RESTRICTION_DELETE', id, {});
    return { success: true };
  }

  // ========== API KEYS ==========

  async getApiKeys() {
    const keys = await this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      keys: keys.map(k => ({
        ...k,
        lastUsedAt: k.lastUsedAt?.toISOString(),
        createdAt: k.createdAt.toISOString(),
      })),
    };
  }

  async createApiKey(data: { name: string; permissions?: string[]; ipWhitelist?: string[]; rateLimit?: number }) {
    const key = `pk_live_${Math.random().toString(36).substring(2, 15)}`;
    const secret = `sk_live_${Math.random().toString(36).substring(2, 30)}`;
    const keyHash = await bcrypt.hash(secret, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        keyPrefix: key.substring(0, 12),
        permissions: data.permissions || ['read:users'],
        ipWhitelist: data.ipWhitelist || [],
        rateLimit: data.rateLimit || 1000,
        isActive: true,
        createdBy: 'Admin',
      },
    });

    await this.createAuditLog('API_KEY_CREATE', apiKey.id, { name: data.name });
    return { success: true, key, secret, id: apiKey.id };
  }

  async toggleApiKeyStatus(id: string, isActive: boolean) {
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    await this.createAuditLog('API_KEY_STATUS', id, { isActive });
    return { success: true };
  }

  async revokeApiKey(id: string) {
    await this.prisma.apiKey.delete({ where: { id } });
    await this.createAuditLog('API_KEY_REVOKED', id, {});
    return { success: true };
  }

  // ========== SITE CONFIGURATION ==========

  async getSiteConfig() {
    let config = await this.prisma.siteConfig.findFirst();
    
    if (!config) {
      // Create default config if not exists
      config = await this.prisma.siteConfig.create({
        data: {
          appName: 'UbinPay',
          appTagline: 'The Global P2P USDT Platform',
          appTaglineAr: 'المنصة العالمية الرائدة لتداول USDT P2P',
        },
      });
    }
    
    return config;
  }

  async updateSiteConfig(data: any, adminId?: string) {
    let config = await this.prisma.siteConfig.findFirst();
    
    if (!config) {
      config = await this.prisma.siteConfig.create({
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    } else {
      config = await this.prisma.siteConfig.update({
        where: { id: config.id },
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    }
    
    return config;
  }

  // ========== PAYMENT METHODS CONFIG ==========

  async getPaymentMethodConfigs(filters?: { countryCode?: string; scope?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.countryCode) where.countryCode = filters.countryCode;
    if (filters?.scope) where.scope = filters.scope;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const methods = await this.prisma.paymentMethodConfig.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return { methods, total: methods.length };
  }

  async createPaymentMethodConfig(data: {
    key: string;
    label: string;
    labelAr?: string;
    iconUrl?: string;
    scope?: string;
    countryCode?: string;
    isActive?: boolean;
    sortOrder?: number;
    config?: any;
  }) {
    const method = await this.prisma.paymentMethodConfig.create({
      data: {
        key: data.key,
        label: data.label,
        labelAr: data.labelAr,
        iconUrl: data.iconUrl,
        scope: data.scope || 'local',
        countryCode: data.countryCode,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        config: data.config,
      },
    });

    return method;
  }

  async updatePaymentMethodConfig(id: string, data: any) {
    const method = await this.prisma.paymentMethodConfig.update({
      where: { id },
      data,
    });

    return method;
  }

  async deletePaymentMethodConfig(id: string) {
    await this.prisma.paymentMethodConfig.delete({ where: { id } });
    return { success: true };
  }

  async togglePaymentMethodConfigStatus(id: string, isActive: boolean) {
    await this.prisma.paymentMethodConfig.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  }

  // ========== CURRENCY CONFIG ==========

  async getCurrencyConfigs(filters?: { isActive?: boolean }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const currencies = await this.prisma.currencyConfig.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { symbol: 'asc' }],
    });

    return { currencies, total: currencies.length };
  }

  async createCurrencyConfig(data: {
    symbol: string;
    name: string;
    nameAr?: string;
    iconUrl?: string;
    networks?: string[];
    isActive?: boolean;
    sortOrder?: number;
    minAmount?: number;
    maxAmount?: number;
  }) {
    const currency = await this.prisma.currencyConfig.create({
      data: {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        nameAr: data.nameAr,
        iconUrl: data.iconUrl,
        networks: data.networks || [],
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        minAmount: data.minAmount ?? 1,
        maxAmount: data.maxAmount ?? 100000,
      },
    });

    return currency;
  }

  async updateCurrencyConfig(id: string, data: any) {
    const currency = await this.prisma.currencyConfig.update({
      where: { id },
      data,
    });

    return currency;
  }

  async deleteCurrencyConfig(id: string) {
    await this.prisma.currencyConfig.delete({ where: { id } });
    return { success: true };
  }

  // ========== BANNER CONFIG ==========

  async getBannerConfigs(filters?: { position?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.position) where.position = filters.position;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const banners = await this.prisma.bannerConfig.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return { banners, total: banners.length };
  }

  async createBannerConfig(data: {
    title: string;
    titleAr?: string;
    subtitle?: string;
    subtitleAr?: string;
    imageUrl?: string;
    linkUrl?: string;
    linkType?: string;
    position?: string;
    isActive?: boolean;
    sortOrder?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const banner = await this.prisma.bannerConfig.create({ data });
    return banner;
  }

  async updateBannerConfig(id: string, data: any) {
    const banner = await this.prisma.bannerConfig.update({
      where: { id },
      data,
    });

    return banner;
  }

  async deleteBannerConfig(id: string) {
    await this.prisma.bannerConfig.delete({ where: { id } });
    return { success: true };
  }

  async toggleBannerStatus(id: string, isActive: boolean) {
    await this.prisma.bannerConfig.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  }

  // ========== PUBLIC CONFIG API (For Mobile App) ==========

  async getPublicSiteConfig() {
    const config = await this.getSiteConfig();
    const paymentMethods = await this.prisma.paymentMethodConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        key: true,
        label: true,
        labelAr: true,
        iconUrl: true,
        scope: true,
        countryCode: true,
      },
    });

    const currencies = await this.prisma.currencyConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        symbol: true,
        name: true,
        nameAr: true,
        iconUrl: true,
        networks: true,
      },
    });

    const banners = await this.prisma.bannerConfig.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      ...config,
      paymentMethods,
      currencies,
      banners,
    };
  }

  // ========== AUTH CONFIG MANAGEMENT ==========

  async getAuthConfig() {
    let config = await this.prisma.authConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      // Create default config if not exists
      config = await this.prisma.authConfig.create({
        data: {
          isActive: true,
        },
      });
    }

    return config;
  }

  async updateAuthConfig(data: any, adminId?: string) {
    let config = await this.prisma.authConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      // Create with the provided data
      config = await this.prisma.authConfig.create({
        data: {
          ...data,
          isActive: true,
          updatedBy: adminId,
        },
      });
    } else {
      // Update existing config
      config = await this.prisma.authConfig.update({
        where: { id: config.id },
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    }

    return config;
  }

  // Public auth config (no secrets exposed)
  async getPublicAuthConfig() {
    const config = await this.getAuthConfig();
    
    // Return only public fields (no API keys/secrets)
    return {
      // Registration Methods
      enablePhoneRegistration: config.enablePhoneRegistration,
      phoneRequired: config.phoneRequired,
      phoneVerificationRequired: config.phoneVerificationRequired,
      enableEmailRegistration: config.enableEmailRegistration,
      emailRequired: config.emailRequired,
      emailVerificationRequired: config.emailVerificationRequired,
      
      // Social Login (only enabled flags, not keys)
      enableGoogleLogin: config.enableGoogleLogin,
      enableAppleLogin: config.enableAppleLogin,
      enableFacebookLogin: config.enableFacebookLogin,
      
      // Login Settings
      enableDirectLogin: config.enableDirectLogin,
      enableOtpLogin: config.enableOtpLogin,
      
      // Password Policy
      minPasswordLength: config.minPasswordLength,
      requireUppercase: config.requireUppercase,
      requireLowercase: config.requireLowercase,
      requireNumbers: config.requireNumbers,
      requireSpecialChars: config.requireSpecialChars,
      
      // Security
      enableTwoFactor: config.enableTwoFactor,
      enableBiometric: config.enableBiometric,
      
      // Registration Fields
      requireName: config.requireName,
      requireAvatar: config.requireAvatar,
      defaultCountryCode: config.defaultCountryCode,
      defaultCurrency: config.defaultCurrency,
      defaultLanguage: config.defaultLanguage,
      
      // Terms & Privacy
      termsUrl: config.termsUrl,
      termsUrlAr: config.termsUrlAr,
      privacyUrl: config.privacyUrl,
      privacyUrlAr: config.privacyUrlAr,
      requireTermsAcceptance: config.requireTermsAcceptance,
      
      // UI Customization
      loginScreenTitle: config.loginScreenTitle,
      loginScreenTitleAr: config.loginScreenTitleAr,
      registerScreenTitle: config.registerScreenTitle,
      registerScreenTitleAr: config.registerScreenTitleAr,
      loginBackgroundUrl: config.loginBackgroundUrl,
      registerBackgroundUrl: config.registerBackgroundUrl,
    };
  }
}
