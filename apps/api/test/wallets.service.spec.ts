import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletsService } from '../src/api/wallets/wallets.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('WalletsService', () => {
  let walletsService: WalletsService;
  let prismaService: PrismaService;

  const mockWallet = {
    id: 'wallet-id',
    userId: 'user-id',
    asset: 'USDT',
    network: 'TRC20',
    balance: 1000,
    lockedBalance: 0,
    accountType: 'SPOT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    wallet: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    walletsService = module.get<WalletsService>(WalletsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getWallets', () => {
    it('should return user wallets', async () => {
      const wallets = [mockWallet];
      mockPrismaService.wallet.findMany.mockResolvedValue(wallets);

      const result = await walletsService.getWallets('user-id');

      expect(result).toEqual(wallets);
      expect(mockPrismaService.wallet.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        orderBy: { asset: 'asc' },
      });
    });
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      mockPrismaService.wallet.findFirst.mockResolvedValue(mockWallet);

      const result = await walletsService.getBalance('user-id', 'USDT', 'SPOT');

      expect(result).toHaveProperty('balance', 1000);
      expect(result).toHaveProperty('lockedBalance', 0);
    });

    it('should throw NotFoundException for non-existent wallet', async () => {
      mockPrismaService.wallet.findFirst.mockResolvedValue(null);

      await expect(walletsService.getBalance('user-id', 'BTC', 'SPOT'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('transfer', () => {
    it('should transfer between accounts', async () => {
      const spotWallet = { ...mockWallet, accountType: 'SPOT', balance: 500 };
      const fundingWallet = { ...mockWallet, id: 'funding-id', accountType: 'FUNDING', balance: 200 };

      mockPrismaService.wallet.findFirst
        .mockResolvedValueOnce(spotWallet)
        .mockResolvedValueOnce(fundingWallet);
      mockPrismaService.wallet.update.mockResolvedValue(spotWallet);
      mockPrismaService.transaction.create.mockResolvedValue({ id: 'tx-id' });

      const result = await walletsService.transfer('user-id', {
        asset: 'USDT',
        amount: 100,
        from: 'SPOT',
        to: 'FUNDING',
      });

      expect(result).toHaveProperty('message', 'Transfer successful');
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const spotWallet = { ...mockWallet, accountType: 'SPOT', balance: 50 };

      mockPrismaService.wallet.findFirst.mockResolvedValueOnce(spotWallet);

      await expect(walletsService.transfer('user-id', {
        asset: 'USDT',
        amount: 100,
        from: 'SPOT',
        to: 'FUNDING',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative amount', async () => {
      await expect(walletsService.transfer('user-id', {
        asset: 'USDT',
        amount: -100,
        from: 'SPOT',
        to: 'FUNDING',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const transactions = [{ id: 'tx-1' }, { id: 'tx-2' }];
      mockPrismaService.transaction.findMany.mockResolvedValue(transactions);
      mockPrismaService.transaction.count.mockResolvedValue(2);

      const result = await walletsService.getTransactionHistory('user-id', 1, 20);

      expect(result).toHaveProperty('items', transactions);
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 1);
    });
  });

  describe('validateAddress', () => {
    it('should validate TRC20 address', async () => {
      const result = await walletsService.validateAddress(
        'TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW',
        'TRC20'
      );

      expect(result).toHaveProperty('valid', true);
    });

    it('should reject invalid address', async () => {
      const result = await walletsService.validateAddress(
        'invalid-address',
        'TRC20'
      );

      expect(result).toHaveProperty('valid', false);
    });
  });
});
