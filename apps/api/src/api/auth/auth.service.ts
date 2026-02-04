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
  private readonly OTP_MAX_ATTEMPTS: number;
  private readonly OTP_LOCKOUT_MINUTES: number;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {
    this.OTP_MAX_ATTEMPTS = this.configService.get('OTP_MAX_ATTEMPTS', 5);
    this.OTP_LOCKOUT_MINUTES = this.configService.get('OTP_LOCKOUT_MINUTES', 30);
  }

  // 🎯 تطبيع رقم الهاتف - يقبل أي صيغة من أي دولة
  // 🌍 GLOBAL: Auto-detects country from dial code, defaults to GLOBAL if unknown
  private normalizePhone(phone: string): string {
    // Try to detect country from the phone number itself
    // If phone starts with + or 00, it will auto-detect the country
    // Otherwise, use GLOBAL as default (no country-specific normalization)
    const normalized = normalizePhoneNumber(phone, 'GLOBAL');
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

  // Social Login
  async socialLogin(provider: string, token: string) {
    // 1. Check if provider is enabled in AuthConfig
    const config = await this.prisma.authConfig.findFirst({ where: { isActive: true } });
    
    if (config) {
      if (provider === 'google' && !config.enableGoogleLogin) {
        throw new BadRequestException('Google login is disabled');
      }
      if (provider === 'apple' && !config.enableAppleLogin) {
        throw new BadRequestException('Apple login is disabled');
      }
      if (provider === 'facebook' && !config.enableFacebookLogin) {
        throw new BadRequestException('Facebook login is disabled');
      }
    }

    // 2. Verify Token (Mock implementation for now - normally you'd use Google/Apple libraries)
    // In production, you would use google-auth-library or similar to verify the token
    let email = '';
    let name = '';
    let externalId = '';

    // MOCK VERIFICATION
    if (provider === 'google') {
        // Mock decoding
        email = 'mock_google_user@example.com'; 
        name = 'Mock Google User';
        externalId = 'mock_google_id_123';
        // TODO: Implement actual verification using config.googleClientId
    } else if (provider === 'apple') {
        email = 'mock_apple_user@example.com';
        name = 'Mock Apple User';
        externalId = 'mock_apple_id_123';
        // TODO: Implement actual verification using config.appleClientId
    } else {
        throw new BadRequestException('Unsupported provider');
    }

    // 3. Find or Create User
    // Note: In a real app, you might want to link social accounts to existing users by email
    // or store social IDs in a separate table/column. 
    // Here we will use email to match.
    
    let user = await this.prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Auto-register if not found
        // Generate a random password for social users
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const passwordHash = await this.hashPassword(randomPassword);
        
        // Generate a placeholder phone number if required by schema, or handle it properly
        // For this schema, phone is unique and required. Social login users might not have phone.
        // We'll generate a placeholder phone or ask user to provide it later.
        // Using a social-specific prefix to avoid collision
        const placeholderPhone = `+000${Date.now().toString().slice(-9)}`;

        user = await this.prisma.user.create({
            data: {
                email,
                name,
                phone: placeholderPhone,
                passwordHash,
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
            }
        });
    }

    // 4. Login User
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

  // Update profile with field validation
  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    preferredCurrency?: string;
    preferredLanguage?: string;
  }) {
    // Only allow specific fields to be updated
    const allowedFields = ['name', 'email', 'avatarUrl', 'preferredCurrency', 'preferredLanguage'];
    const sanitizedData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (data[field as keyof typeof data] !== undefined) {
        sanitizedData[field] = data[field as keyof typeof data];
      }
    }
    
    // Validate email uniqueness if being changed
    if (sanitizedData.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: sanitizedData.email, NOT: { id: userId } },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }
    
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: sanitizedData,
    });
    return this.sanitizeUser(user);
  }

  // Resend OTP with rate limiting
  async resendOtp(phone: string, type: 'login' | 'register') {
    const normalizedPhone = this.normalizePhone(phone);
    
    // Check rate limit
    const rateLimitKey = `otp:ratelimit:${normalizedPhone}`;
    const attempts = await this.redis.get(rateLimitKey);
    const attemptCount = attempts ? parseInt(attempts) : 0;
    
    if (attemptCount >= this.OTP_MAX_ATTEMPTS) {
      const lockoutSeconds = this.OTP_LOCKOUT_MINUTES * 60;
      throw new BadRequestException(
        `Too many OTP requests. Please wait ${this.OTP_LOCKOUT_MINUTES} minutes before trying again.`
      );
    }
    
    // Increment rate limit counter
    await this.redis.set(
      rateLimitKey,
      String(attemptCount + 1),
      this.OTP_LOCKOUT_MINUTES * 60
    );
    
    const otp = this.generateOtp();
    const otpExpiration = this.configService.get('OTP_EXPIRATION_MINUTES', 5);
    
    await this.redis.set(
      `otp:${type}:${normalizedPhone}`,
      JSON.stringify({ otp, phone: normalizedPhone, attempts: 0 }),
      otpExpiration * 60
    );

    const sent = await this.smsService.sendOtp(normalizedPhone, otp);
    if (!sent) {
      this.logger.warn(`Failed to send OTP to ${normalizedPhone}`);
    }
    
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
