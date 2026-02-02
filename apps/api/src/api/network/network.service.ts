import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService, AuditAction } from '../../infrastructure/audit/audit.service';
import { 
  UpdateNetworkModeDto, 
  UpdateNetworkConfigDto, 
  SetConfirmationCodeDto,
  NetworkMode 
} from './dto/network.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class NetworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getNetworkConfig() {
    let config = await this.prisma.networkConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      config = await this.prisma.networkConfig.create({
        data: {
          networkMode: 'TESTNET',
          displayName: 'Testnet',
          displayNameAr: 'شبكة الاختبار',
          description: 'Test environment - No real funds',
          descriptionAr: 'بيئة اختبار - لا أموال حقيقية',
          primaryColor: '#F0B90B',
          warningColor: '#F6465D',
          badgeColor: '#FF6B35',
          borderColor: '#FF6B35',
          showGlobalBanner: true,
          showWatermark: true,
          requireConfirmation: true,
          blockchainConfig: this.getDefaultBlockchainConfig(),
        },
      });
    }

    return this.formatConfig(config);
  }

  async getPublicNetworkStatus() {
    const config = await this.getNetworkConfig();
    return {
      networkMode: config.networkMode,
      displayName: config.displayName,
      displayNameAr: config.displayNameAr,
      primaryColor: config.primaryColor,
      warningColor: config.warningColor,
      badgeColor: config.badgeColor,
      borderColor: config.borderColor,
      showGlobalBanner: config.showGlobalBanner,
      showWatermark: config.showWatermark,
      isMainnet: config.networkMode === 'MAINNET',
      isTestnet: config.networkMode === 'TESTNET',
      features: {
        deposits: config.enableDeposits,
        withdrawals: config.enableWithdrawals,
        p2p: config.enableP2P,
        swap: config.enableSwap,
        staking: config.enableStaking,
      },
      limits: {
        maxTransactionAmount: config.maxTransactionAmount,
        dailyLimit: config.dailyLimit,
      },
    };
  }

  async updateNetworkMode(
    dto: UpdateNetworkModeDto,
    adminId: string,
    adminName: string,
    ipAddress?: string,
  ) {
    const config = await this.prisma.networkConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      throw new NotFoundException('Network configuration not found');
    }

    if (dto.networkMode === 'MAINNET') {
      if (config.requireConfirmation) {
        if (!dto.confirmationCode) {
          throw new BadRequestException('Confirmation code is required to switch to Mainnet');
        }

        if (!config.confirmationCode) {
          throw new BadRequestException('No confirmation code has been set. Please set a confirmation code first.');
        }

        const isCodeValid = await bcrypt.compare(dto.confirmationCode, config.confirmationCode);
        if (!isCodeValid) {
          throw new ForbiddenException('Invalid confirmation code');
        }
      }
    }

    const previousMode = config.networkMode;

    await this.prisma.networkModeHistory.create({
      data: {
        networkConfigId: config.id,
        previousMode: previousMode as any,
        newMode: dto.networkMode as any,
        changedBy: adminId,
        changedByName: adminName,
        reason: dto.reason,
        ipAddress,
      },
    });

    const newDisplaySettings = dto.networkMode === 'MAINNET' 
      ? {
          displayName: 'Mainnet',
          displayNameAr: 'الشبكة الرئيسية',
          primaryColor: '#0ECB81',
          badgeColor: '#0ECB81',
          borderColor: '#0ECB81',
          showGlobalBanner: false,
          showWatermark: false,
        }
      : {
          displayName: 'Testnet',
          displayNameAr: 'شبكة الاختبار',
          primaryColor: '#F0B90B',
          badgeColor: '#FF6B35',
          borderColor: '#FF6B35',
          showGlobalBanner: true,
          showWatermark: true,
        };

    const updatedConfig = await this.prisma.networkConfig.update({
      where: { id: config.id },
      data: {
        networkMode: dto.networkMode as any,
        ...newDisplaySettings,
        lastModeChangeAt: new Date(),
        lastModeChangeBy: adminId,
        modeChangeReason: dto.reason,
      },
    });

    await this.audit.log({
      action: AuditAction.NETWORK_MODE_CHANGED,
      entity: 'NetworkConfig',
      entityId: config.id,
      context: { adminId, ipAddress },
      oldValue: { networkMode: previousMode },
      newValue: { networkMode: dto.networkMode },
    });

    return this.formatConfig(updatedConfig);
  }

  async updateNetworkConfig(dto: UpdateNetworkConfigDto, adminId: string, ipAddress?: string) {
    const config = await this.prisma.networkConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      throw new NotFoundException('Network configuration not found');
    }

    const updatedConfig = await this.prisma.networkConfig.update({
      where: { id: config.id },
      data: {
        ...dto,
        blockchainConfig: dto.blockchainConfig ? dto.blockchainConfig : undefined,
      },
    });

    await this.audit.log({
      action: AuditAction.NETWORK_CONFIG_UPDATED,
      entity: 'NetworkConfig',
      entityId: config.id,
      context: { adminId, ipAddress },
      oldValue: config,
      newValue: updatedConfig,
    });

    return this.formatConfig(updatedConfig);
  }

  async setConfirmationCode(dto: SetConfirmationCodeDto, adminId: string, ipAddress?: string) {
    const config = await this.prisma.networkConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      throw new NotFoundException('Network configuration not found');
    }

    if (config.confirmationCode && dto.currentCode) {
      const isCurrentCodeValid = await bcrypt.compare(dto.currentCode, config.confirmationCode);
      if (!isCurrentCodeValid) {
        throw new ForbiddenException('Current confirmation code is invalid');
      }
    }

    const hashedCode = await bcrypt.hash(dto.code, 12);

    await this.prisma.networkConfig.update({
      where: { id: config.id },
      data: { confirmationCode: hashedCode },
    });

    await this.audit.log({
      action: AuditAction.NETWORK_CONFIRMATION_CODE_SET,
      entity: 'NetworkConfig',
      entityId: config.id,
      context: { adminId, ipAddress },
      newValue: { action: 'Confirmation code updated' },
    });

    return { success: true, message: 'Confirmation code has been set successfully' };
  }

  async getModeHistory(limit: number = 50) {
    const history = await this.prisma.networkModeHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history;
  }

  async getBlockchainConfig() {
    const config = await this.getNetworkConfig();
    return config.blockchainConfig;
  }

  private formatConfig(config: any) {
    return {
      ...config,
      maxTransactionAmount: Number(config.maxTransactionAmount),
      dailyLimit: Number(config.dailyLimit),
      blockchainConfig: config.blockchainConfig || {},
    };
  }

  private getDefaultBlockchainConfig() {
    return {
      mainnet: {
        bsc: {
          chainId: 56,
          name: 'BNB Smart Chain',
          rpcUrl: 'https://bsc-dataseed.binance.org/',
          explorerUrl: 'https://bscscan.com',
          contracts: {
            usdt: '0x55d398326f99059ff775485246999027b3197955',
            usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
          },
        },
        tron: {
          chainId: 728126428,
          name: 'TRON Mainnet',
          rpcUrl: 'https://api.trongrid.io',
          explorerUrl: 'https://tronscan.org',
          contracts: {
            usdt: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          },
        },
        ethereum: {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpcUrl: 'https://eth.llamarpc.com',
          explorerUrl: 'https://etherscan.io',
          contracts: {
            usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
        },
      },
      testnet: {
        bsc: {
          chainId: 97,
          name: 'BSC Testnet',
          rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
          explorerUrl: 'https://testnet.bscscan.com',
          contracts: {
            usdt: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
          },
        },
        tron: {
          chainId: 2494104990,
          name: 'TRON Shasta Testnet',
          rpcUrl: 'https://api.shasta.trongrid.io',
          explorerUrl: 'https://shasta.tronscan.org',
          contracts: {
            usdt: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
          },
        },
        ethereum: {
          chainId: 11155111,
          name: 'Sepolia Testnet',
          rpcUrl: 'https://rpc.sepolia.org',
          explorerUrl: 'https://sepolia.etherscan.io',
          contracts: {
            usdt: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
          },
        },
      },
    };
  }
}
