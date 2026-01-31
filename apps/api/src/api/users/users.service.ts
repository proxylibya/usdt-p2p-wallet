import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
      include: { wallets: true }
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.sanitize(user);
  }

  async updateProfile(id: string, data: { name?: string; email?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
      },
    });
    return this.sanitize(user);
  }

  // ========== KYC ==========

  async submitKyc(id: string, kycData: { 
    documentType: string; 
    documentNumber: string; 
    frontImage: string; 
    backImage?: string;
    selfieImage: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.kycStatus === 'VERIFIED') {
      throw new BadRequestException('KYC already verified');
    }

    return this.prisma.user.update({
      where: { id },
      data: { 
        kycStatus: 'PENDING',
        kycData: kycData as any,
      },
    });
  }

  async updateKycStatus(id: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { 
        kycStatus: status,
        ...(reason && { kycData: { reason } }),
      },
    });
  }

  async getKycStatus(id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
      select: { kycStatus: true, kycData: true }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ========== SECURITY ==========

  async enable2FA(id: string, secret: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: true, twoFactorSecret: secret },
    });
    return this.sanitize(user);
  }

  async disable2FA(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return this.sanitize(user);
  }

  async setup2FA(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, phone: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA already enabled');
    }

    const secret = user.twoFactorSecret || this.generateBase32Secret();

    if (!user.twoFactorSecret) {
      await this.prisma.user.update({
        where: { id },
        data: { twoFactorSecret: secret },
      });
    }

    const account = user.email || user.phone || user.id;
    const issuer = 'USDT Wallet';

    return {
      secret,
      otpauthUrl: this.buildOtpAuthUrl(secret, account, issuer),
    };
  }

  async verify2FA(id: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { twoFactorSecret: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA not initialized');
    }

    const normalizedCode = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException('Invalid code');
    }

    if (!this.verifyTotp(user.twoFactorSecret, normalizedCode)) {
      throw new BadRequestException('Invalid code');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: true },
    });

    return this.sanitize(updatedUser);
  }

  async setSecurityQuestions(id: string, questions: { question: string; answer: string }[]) {
    if (!Array.isArray(questions) || questions.length < 2) {
      throw new BadRequestException('At least two security questions are required');
    }

    const normalizedQuestions = questions.map(({ question, answer }) => ({
      question: question?.trim(),
      answer: this.normalizeSecurityAnswer(answer || ''),
    }));

    if (normalizedQuestions.some(item => !item.question || !item.answer)) {
      throw new BadRequestException('All security questions and answers are required');
    }

    const uniqueQuestions = new Set(normalizedQuestions.map(item => item.question.toLowerCase()));
    if (uniqueQuestions.size !== normalizedQuestions.length) {
      throw new BadRequestException('Security questions must be unique');
    }

    const hashedQuestions = await Promise.all(
      normalizedQuestions.map(async item => ({
        question: item.question,
        answerHash: await bcrypt.hash(item.answer, 12),
      }))
    );

    await this.prisma.user.update({
      where: { id },
      data: {
        securityQuestions: {
          questions: hashedQuestions,
          updatedAt: new Date().toISOString(),
        } as any,
      },
    });

    return { message: 'Security questions updated', hasSecurityQuestions: true };
  }

  async getSecuritySettings(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { 
        twoFactorEnabled: true, 
        biometricKey: true,
        lastLoginAt: true,
        securityQuestions: true,
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      twoFactorEnabled: user.twoFactorEnabled,
      biometricEnabled: !!user.biometricKey,
      lastLoginAt: user.lastLoginAt,
      hasSecurityQuestions: this.hasSecurityQuestions(user.securityQuestions),
    };
  }

  // ========== STATS ==========

  async getUserStats(id: string) {
    const [wallets, transactions, p2pTrades] = await Promise.all([
      this.prisma.wallet.findMany({ where: { userId: id } }),
      this.prisma.transaction.count({ where: { userId: id } }),
      this.prisma.p2PTrade.count({ 
        where: { OR: [{ buyerId: id }, { sellerId: id }] }
      }),
    ]);

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    return {
      totalBalance,
      walletsCount: wallets.length,
      transactionsCount: transactions,
      p2pTradesCount: p2pTrades,
    };
  }

  private generateBase32Secret(length: number = 20) {
    const buffer = crypto.randomBytes(length);
    return this.base32Encode(buffer);
  }

  private buildOtpAuthUrl(secret: string, account: string, issuer: string) {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(account);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&digits=6&period=30`;
  }

  private verifyTotp(secret: string, token: string, window: number = 1): boolean {
    const timeStep = 30;
    const time = Math.floor(Date.now() / 1000 / timeStep);

    for (let offset = -window; offset <= window; offset += 1) {
      const candidate = this.generateTotp(secret, time + offset, timeStep, 6);
      if (candidate === token) return true;
    }

    return false;
  }

  private generateTotp(secret: string, counter: number, timeStep: number, digits: number) {
    const key = this.base32Decode(secret);
    const counterBuffer = Buffer.alloc(8);
    const high = Math.floor(counter / 0x100000000);
    const low = counter % 0x100000000;
    counterBuffer.writeUInt32BE(high, 0);
    counterBuffer.writeUInt32BE(low, 4);

    const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
    return code.toString().padStart(digits, '0');
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.replace(/=+$/, '').toUpperCase();
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (const char of cleaned) {
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new BadRequestException('Invalid 2FA secret');
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }

  private normalizeSecurityAnswer(answer: string) {
    return answer.trim().toLowerCase();
  }

  private hasSecurityQuestions(securityQuestions: any): boolean {
    if (!securityQuestions) return false;
    const questions = (securityQuestions as any).questions;
    if (Array.isArray(questions)) return questions.length > 0;
    return true;
  }

  private sanitize(user: any) {
    const { passwordHash, twoFactorSecret, biometricKey, securityQuestions, ...safe } = user;
    return { ...safe, hasSecurityQuestions: this.hasSecurityQuestions(securityQuestions) };
  }
}
