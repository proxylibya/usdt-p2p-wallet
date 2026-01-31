import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; isAdmin?: boolean }) {
    // Check if it's an admin token
    if (payload.isAdmin) {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException();
      }

      return {
        id: admin.id,
        sub: admin.id, // For compatibility
        email: admin.email,
        role: admin.role,
        isAdmin: true,
      };
    }

    // Regular user token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || user.isBanned) {
      throw new UnauthorizedException();
    }

    return { 
      id: user.id, 
      sub: user.id,
      phone: user.phone, 
      email: user.email 
    };
  }
}
