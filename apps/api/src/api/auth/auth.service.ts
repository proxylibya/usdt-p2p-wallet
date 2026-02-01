import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { SmsService } from '../sms/sms.service';
import { normalizePhoneNumber } from '../../shared/utils/phone.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}

  // 🎯 تطبيع رقم الهاتف - يقبل أي صيغة
  private normalizePhone(phone: string): string {
    const normalized = normalizePhoneNumber(phone, 'LY');
    return normalized.full;
  }

  // Generate OTP
  private generateOtp(): string {
    const length = this.configService.get('OTP_LENGTH', 6);
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private isDirectLoginEnabled(): boolean {
    const raw = this.configService.get('AUTH_DIRECT_LOGIN', 'false');
    return String(raw).toLowerCase() === 'true';
  }

  async login(phone: string, password: string) {
    if (this.isDirectLoginEnabled()) {
      return this.loginWithPassword(phone, password);
    }
    return this.requestLoginOtp(phone, password);
  }

  private async loginWithPassword(phone: string, password: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.prisma.user.findUnique({ where: { phone: normalizedPhone } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.isBanned) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // Generate tokens
  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    const refreshToken = uuidv4();
    const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');
    
    // Store refresh token in database
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + this.parseExpiration(refreshExpiration)),
      },
    });

    return { accessToken, refreshToken };
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  // Request login OTP
  async requestLoginOtp(phone: string, password: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.prisma.user.findUnique({ where: { phone: normalizedPhone } });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.isBanned) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate and store OTP
    const otp = this.generateOtp();
    const otpExpiration = this.configService.get('OTP_EXPIRATION_MINUTES', 5);
    
    await this.redis.set(
      `otp:login:${normalizedPhone}`,
      JSON.stringify({ otp, userId: user.id }),
      otpExpiration * 60
    );

    // Send OTP via SMS
    await this.smsService.sendOtp(normalizedPhone, otp);

    return { message: 'OTP sent successfully' };
  }

  // Verify login OTP
  async verifyLoginOtp(phone: string, otp: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const storedData = await this.redis.get(`otp:login:${normalizedPhone}`);
    
    if (!storedData) {
      throw new BadRequestException('OTP expired or not found');
    }

    const { otp: storedOtp, userId } = JSON.parse(storedData);
    
    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Delete OTP
    await this.redis.del(`otp:login:${normalizedPhone}`);

    // Get user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(userId);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // Register
  async register(data: { name: string; email?: string; phone: string; password: string }) {
    const normalizedPhone = this.normalizePhone(data.phone);
    
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user with default wallets (addresses generated on first deposit request)
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        passwordHash,
        // Create default wallets for new user - addresses will be generated when user requests deposit
        wallets: {
          create: [
            { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
            { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'FUNDING' },
            { asset: 'USDC', network: 'ERC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
            { asset: 'USDC', network: 'ERC20', balance: 0, lockedBalance: 0, accountType: 'FUNDING' },
            { asset: 'BTC', network: 'Bitcoin', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
            { asset: 'ETH', network: 'ERC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
          ]
        }
      },
    });

    // Generate OTP for verification
    const otp = this.generateOtp();
    const otpExpiration = this.configService.get('OTP_EXPIRATION_MINUTES', 5);
    
    await this.redis.set(
      `otp:register:${normalizedPhone}`,
      JSON.stringify({ otp, userId: user.id }),
      otpExpiration * 60
    );

    // Send OTP via SMS
    await this.smsService.sendOtp(normalizedPhone, otp);

    return { message: 'Registration successful. Please verify your phone.' };
  }

  // Verify registration OTP
  async verifyRegistrationOtp(phone: string, otp: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const storedData = await this.redis.get(`otp:register:${normalizedPhone}`);
    
    if (!storedData) {
      throw new BadRequestException('OTP expired or not found');
    }

    const { otp: storedOtp, userId } = JSON.parse(storedData);
    
    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Delete OTP
    await this.redis.del(`otp:register:${normalizedPhone}`);

    // Get user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate tokens
    const tokens = await this.generateTokens(userId);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old session
    await this.prisma.session.delete({ where: { id: session.id } });

    // Generate new tokens
    return this.generateTokens(session.userId);
  }

  // Logout
  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({ where: { refreshToken } });
    return { message: 'Logged out successfully' };
  }

  // Get profile
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  // Update profile
  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  // Resend OTP
  async resendOtp(phone: string, type: 'login' | 'register') {
    const normalizedPhone = this.normalizePhone(phone);
    const otp = this.generateOtp();
    const otpExpiration = this.configService.get('OTP_EXPIRATION_MINUTES', 5);
    
    await this.redis.set(
      `otp:${type}:${normalizedPhone}`,
      JSON.stringify({ otp, phone: normalizedPhone }),
      otpExpiration * 60
    );

    await this.smsService.sendOtp(normalizedPhone, otp);
    return { message: 'OTP sent successfully', expiresIn: otpExpiration * 60 };
  }

  // Forgot password
  async forgotPassword(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      return { message: 'If the phone exists, OTP will be sent' };
    }

    const otp = this.generateOtp();
    const otpExpiration = this.configService.get('OTP_EXPIRATION_MINUTES', 5);
    
    await this.redis.set(
      `otp:reset:${normalizedPhone}`,
      JSON.stringify({ otp, userId: user.id }),
      otpExpiration * 60
    );

    await this.smsService.sendOtp(normalizedPhone, otp);
    return { message: 'If the phone exists, OTP will be sent' };
  }

  // Reset password
  async resetPassword(phone: string, otp: string, newPassword: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const storedData = await this.redis.get(`otp:reset:${normalizedPhone}`);
    
    if (!storedData) {
      throw new BadRequestException('OTP expired or not found');
    }

    const { otp: storedOtp, userId } = JSON.parse(storedData);
    
    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.redis.del(`otp:reset:${normalizedPhone}`);

    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  // Sanitize user (remove sensitive data)
  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, biometricKey, securityQuestions, ...sanitized } = user;
    return { ...sanitized, hasSecurityQuestions: this.hasSecurityQuestions(securityQuestions) };
  }

  private hasSecurityQuestions(securityQuestions: any): boolean {
    if (!securityQuestions) return false;
    const questions = (securityQuestions as any).questions;
    if (Array.isArray(questions)) return questions.length > 0;
    return true;
  }
}
