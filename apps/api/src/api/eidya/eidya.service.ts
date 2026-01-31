import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateEidyaDto } from './dto/eidya.dto';

@Injectable()
export class EidyaService {
  constructor(private prisma: PrismaService) {}

  // Generate a short unique code
  private generateCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createEidya(userId: string, dto: CreateEidyaDto) {
    const { asset, totalAmount, quantity, message } = dto;

    // 1. Check User Balance
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_asset_network_accountType: {
          userId,
          asset,
          network: 'TRC20', // Default network for now, or assume internal logic checks sum of all networks? 
          // Actually schema has (userId, asset, network, accountType) unique. 
          // We should probably find ANY spot wallet with enough balance or ask user to specify network?
          // For internal Eidya, usually we just deduct from Spot balance regardless of network technically, but DB structure requires network.
          // Let's assume TRC20 for USDT for simplicity or findFirst.
          accountType: 'SPOT',
        },
      },
    });

    // Fallback: Find any spot wallet for this asset with enough balance
    const userWallet = await this.prisma.wallet.findFirst({
        where: { userId, asset, accountType: 'SPOT', balance: { gte: totalAmount } }
    });

    if (!userWallet) {
      throw new BadRequestException(`Insufficient ${asset} balance`);
    }

    // 2. Deduct Balance & Create Eidya
    const code = this.generateCode();

    const result = await this.prisma.$transaction(async (tx) => {
        // Deduct
        await tx.wallet.update({
            where: { id: userWallet.id },
            data: { balance: { decrement: totalAmount } }
        });

        // Create Transaction Record
        await tx.transaction.create({
            data: {
                userId,
                type: 'TRANSFER_OUT', // Or create a new type EIDYA_CREATE
                asset,
                amount: totalAmount,
                status: 'COMPLETED',
                note: `Created Eidya (Gift) - ${quantity} people`,
            }
        });

        // Create Eidya
        const eidya = await tx.eidya.create({
            data: {
                creatorId: userId,
                asset,
                totalAmount,
                quantity,
                message,
                code,
                status: 'ACTIVE',
            }
        });

        return eidya;
    });

    return result;
  }

  async getEidyaByCode(code: string) {
    const eidya = await this.prisma.eidya.findUnique({
        where: { code },
        include: { creator: { select: { name: true, avatarUrl: true } } }
    });
    
    if (!eidya) throw new NotFoundException('Eidya not found');
    return eidya;
  }

  async claimEidya(userId: string, code: string) {
    const eidya = await this.prisma.eidya.findUnique({
        where: { code },
    });

    if (!eidya) throw new NotFoundException('Eidya not found');
    if (eidya.status !== 'ACTIVE') throw new BadRequestException('Eidya is not active');
    if (eidya.creatorId === userId) throw new BadRequestException('You cannot claim your own Eidya');

    // Check if already claimed
    const existingClaim = await this.prisma.eidyaClaim.findUnique({
        where: {
            eidyaId_claimerId: {
                eidyaId: eidya.id,
                claimerId: userId
            }
        }
    });

    if (existingClaim) throw new BadRequestException('You have already claimed this Eidya');

    // Calculate claim amount (Simple logic: Total / Quantity)
    // Precision handling needed for decimals
    const claimAmount = Number(eidya.totalAmount) / eidya.quantity; 
    
    // Check if depleted (Should be handled by status, but double check count)
    if (eidya.claimedCount >= eidya.quantity) {
        throw new BadRequestException('This Eidya has been fully claimed');
    }

    const result = await this.prisma.$transaction(async (tx) => {
        // Update Eidya
        const updatedEidya = await tx.eidya.update({
            where: { id: eidya.id },
            data: {
                claimedCount: { increment: 1 },
                claimedAmount: { increment: claimAmount },
                // If this is the last claim, mark depleted
                status: (eidya.claimedCount + 1 >= eidya.quantity) ? 'DEPLETED' : 'ACTIVE'
            }
        });

        // Create Claim
        await tx.eidyaClaim.create({
            data: {
                eidyaId: eidya.id,
                claimerId: userId,
                amount: claimAmount
            }
        });

        // Credit User Wallet
        // Find or create wallet
        let wallet = await tx.wallet.findFirst({
            where: { userId, asset: eidya.asset, accountType: 'SPOT' }
        });

        if (!wallet) {
            // Default to TRC20 if creating new wallet for USDT
            // Ideally we should know the network of the source funds or just pick one.
            wallet = await tx.wallet.create({
                data: {
                    userId,
                    asset: eidya.asset,
                    network: 'TRC20', // Simplification
                    accountType: 'SPOT',
                    balance: 0,
                    lockedBalance: 0
                }
            });
        }

        await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: claimAmount } }
        });

        // Transaction Record
        await tx.transaction.create({
            data: {
                userId,
                type: 'TRANSFER_IN', // Or EIDYA_CLAIM
                asset: eidya.asset,
                amount: claimAmount,
                status: 'COMPLETED',
                note: `Claimed Eidya from ${code}`,
            }
        });

        // Notification for Creator
        await tx.notification.create({
            data: {
                userId: eidya.creatorId,
                type: 'SYSTEM',
                title: 'Eidya Claimed! 🎁',
                message: `Someone claimed ${claimAmount} ${eidya.asset} from your Eidya envelope.`
            }
        });

        return { claimAmount, status: updatedEidya.status };
    });

    return result;
  }

  async getUserHistory(userId: string) {
      const created = await this.prisma.eidya.findMany({
          where: { creatorId: userId },
          orderBy: { createdAt: 'desc' }
      });

      const claimed = await this.prisma.eidyaClaim.findMany({
          where: { claimerId: userId },
          include: { eidya: { include: { creator: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' }
      });

      return { created, claimed };
  }
}
