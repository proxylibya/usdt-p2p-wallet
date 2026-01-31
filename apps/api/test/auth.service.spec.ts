import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../src/api/auth/auth.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { RedisService } from '../src/infrastructure/cache/redis.service';
import { SmsService } from '../src/infrastructure/sms/sms.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let jwtService: JwtService;
  let smsService: SmsService;

  const mockUser = {
    id: 'test-user-id',
    phone: '+218912345678',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$test',
    isActive: true,
    isBanned: false,
    kycStatus: 'NOT_VERIFIED',
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'AUTH_DIRECT_LOGIN': 'true',
        'OTP_LENGTH': 6,
        'OTP_EXPIRATION_MINUTES': 5,
        'JWT_SECRET': 'test-secret',
        'JWT_ACCESS_EXPIRATION': '15m',
        'JWT_REFRESH_EXPIRATION': '7d',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockSmsService = {
    sendOtp: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    jwtService = module.get<JwtService>(JwtService);
    smsService = module.get<SmsService>(SmsService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens for valid credentials with direct login enabled', async () => {
      const hashedPassword = await bcrypt.hash('ValidPassword123!', 12);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithHash);
      mockPrismaService.user.update.mockResolvedValue(userWithHash);
      mockPrismaService.session.create.mockResolvedValue({ id: 'session-id' });

      const result = await authService.login('+218912345678', 'ValidPassword123!');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('+218912345678', 'WrongPassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for banned user', async () => {
      const bannedUser = { ...mockUser, isBanned: true };
      mockPrismaService.user.findUnique.mockResolvedValue(bannedUser);

      await expect(authService.login('+218912345678', 'ValidPassword123!'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(authService.login('+218912345678', 'ValidPassword123!'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await authService.register({
        name: 'Test User',
        phone: '+218912345678',
        password: 'ValidPassword123!',
      });

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockSmsService.sendOtp).toHaveBeenCalled();
    });

    it('should throw ConflictException for existing user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(authService.register({
        name: 'Test User',
        phone: '+218912345678',
        password: 'ValidPassword123!',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyLoginOtp', () => {
    it('should verify OTP and return tokens', async () => {
      const storedOtp = JSON.stringify({ otp: '123456', userId: mockUser.id });
      mockRedisService.get.mockResolvedValue(storedOtp);
      mockRedisService.del.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.session.create.mockResolvedValue({ id: 'session-id' });

      const result = await authService.verifyLoginOtp('+218912345678', '123456');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      const storedOtp = JSON.stringify({ otp: '123456', userId: mockUser.id });
      mockRedisService.get.mockResolvedValue(storedOtp);

      await expect(authService.verifyLoginOtp('+218912345678', '000000'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired OTP', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(authService.verifyLoginOtp('+218912345678', '123456'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should delete user session', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout(mockUser.id, 'session-id');

      expect(mockPrismaService.session.deleteMany).toHaveBeenCalled();
    });
  });
});
