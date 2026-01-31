import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Direct AdminUser authentication (via JwtStrategy with isAdmin: true)
    if (user.isAdmin) {
      request.adminUser = user;
      return true;
    }

    // Legacy/Alternative: Check if a regular User has an associated AdminUser record via email
    // This supports scenarios where a User token is used to access Admin routes (if allowed policy-wise)
    try {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true },
      });

      if (!userRecord?.email) {
        throw new ForbiddenException('Admin access required');
      }

      const adminUser = await this.prisma.adminUser.findUnique({
        where: { email: userRecord.email },
      });

      if (!adminUser || !adminUser.isActive) {
        throw new ForbiddenException('Admin access required');
      }

      request.adminUser = adminUser;
      return true;
    } catch (error) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
