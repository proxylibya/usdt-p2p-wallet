import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { P2PService } from '../src/api/p2p/p2p.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('P2PService', () => {
  let p2pService: P2PService;
  let prismaService: PrismaService;

  const mockOffer = {
    id: 'offer-id',
    userId: 'seller-id',
    type: 'SELL',
    asset: 'USDT',
    fiatCurrency: 'LYD',
    price: 8.5,
    available: 1000,
    minLimit: 100,
    maxLimit: 500,
    paymentMethods: ['bank_transfer'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTrade = {
    id: 'trade-id',
    offerId: 'offer-id',
    buyerId: 'buyer-id',
    sellerId: 'seller-id',
    amount: 200,
    fiatAmount: 1700,
    price: 8.5,
    status: 'WAITING_PAYMENT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWallet = {
    id: 'wallet-id',
    userId: 'seller-id',
    asset: 'USDT',
    balance: 1000,
    lockedBalance: 0,
    accountType: 'FUNDING',
  };

  const mockPrismaService = {
    p2POffer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    p2PTrade: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    p2PMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
    transaction: {
      createMany: jest.fn(),
    },
    paymentMethod: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        P2PService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    p2pService = module.get<P2PService>(P2PService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getOffers', () => {
    it('should return active offers', async () => {
      mockPrismaService.p2POffer.findMany.mockResolvedValue([mockOffer]);

      const result = await p2pService.getOffers({ type: 'SELL' });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('SELL');
    });
  });

  describe('createOffer', () => {
    it('should create a new offer', async () => {
      mockPrismaService.p2POffer.create.mockResolvedValue(mockOffer);

      const result = await p2pService.createOffer('seller-id', {
        type: 'SELL',
        asset: 'USDT',
        fiatCurrency: 'LYD',
        price: 8.5,
        available: 1000,
        minLimit: 100,
        maxLimit: 500,
      });

      expect(result).toHaveProperty('id', 'offer-id');
    });
  });

  describe('startTrade', () => {
    it('should start a trade with escrow locking', async () => {
      mockPrismaService.p2POffer.findUnique.mockResolvedValue(mockOffer);
      mockPrismaService.wallet.findFirst.mockResolvedValue(mockWallet);
      mockPrismaService.wallet.update.mockResolvedValue(mockWallet);
      mockPrismaService.p2PTrade.create.mockResolvedValue(mockTrade);
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await p2pService.startTrade('buyer-id', 'offer-id', 200);

      expect(result).toHaveProperty('id', 'trade-id');
      expect(mockPrismaService.wallet.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for inactive offer', async () => {
      mockPrismaService.p2POffer.findUnique.mockResolvedValue({ ...mockOffer, isActive: false });

      await expect(p2pService.startTrade('buyer-id', 'offer-id', 200))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for amount out of range', async () => {
      mockPrismaService.p2POffer.findUnique.mockResolvedValue(mockOffer);

      await expect(p2pService.startTrade('buyer-id', 'offer-id', 50))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for insufficient seller balance', async () => {
      mockPrismaService.p2POffer.findUnique.mockResolvedValue(mockOffer);
      mockPrismaService.wallet.findFirst.mockResolvedValue({ ...mockWallet, balance: 100 });

      await expect(p2pService.startTrade('buyer-id', 'offer-id', 200))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment by buyer', async () => {
      mockPrismaService.p2PTrade.findUnique.mockResolvedValue(mockTrade);
      mockPrismaService.p2PTrade.update.mockResolvedValue({ ...mockTrade, status: 'PAID' });

      const result = await p2pService.confirmPayment('trade-id', 'buyer-id');

      expect(result.status).toBe('PAID');
    });

    it('should throw BadRequestException if not buyer', async () => {
      mockPrismaService.p2PTrade.findUnique.mockResolvedValue(mockTrade);

      await expect(p2pService.confirmPayment('trade-id', 'wrong-user'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('releaseCrypto', () => {
    it('should release crypto to buyer after payment', async () => {
      const paidTrade = { ...mockTrade, status: 'PAID', offer: mockOffer };
      const buyerWallet = { ...mockWallet, userId: 'buyer-id', accountType: 'SPOT' };

      mockPrismaService.p2PTrade.findUnique.mockResolvedValue(paidTrade);
      mockPrismaService.wallet.findFirst.mockResolvedValue(buyerWallet);
      mockPrismaService.wallet.update.mockResolvedValue(buyerWallet);
      mockPrismaService.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.p2PTrade.update.mockResolvedValue({ ...paidTrade, status: 'COMPLETED' });
      mockPrismaService.transaction.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await p2pService.releaseCrypto('trade-id', 'seller-id');

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw BadRequestException if payment not confirmed', async () => {
      mockPrismaService.p2PTrade.findUnique.mockResolvedValue({ ...mockTrade, offer: mockOffer });

      await expect(p2pService.releaseCrypto('trade-id', 'seller-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTrade', () => {
    it('should cancel trade and refund seller', async () => {
      const tradeWithOffer = { ...mockTrade, offer: mockOffer };
      mockPrismaService.p2PTrade.findUnique.mockResolvedValue(tradeWithOffer);
      mockPrismaService.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.p2PTrade.update.mockResolvedValue({ ...mockTrade, status: 'CANCELLED' });
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await p2pService.cancelTrade('trade-id', 'buyer-id', 'Changed mind');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('openDispute', () => {
    it('should open a dispute on trade', async () => {
      mockPrismaService.p2PTrade.findUnique.mockResolvedValue(mockTrade);
      mockPrismaService.p2PTrade.update.mockResolvedValue({ ...mockTrade, status: 'DISPUTED' });

      const result = await p2pService.openDispute('trade-id', 'buyer-id', 'Payment not received');

      expect(result.status).toBe('DISPUTED');
    });
  });
});
