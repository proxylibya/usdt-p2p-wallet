import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy' | 'disabled';
    sms?: 'configured' | 'not_configured';
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  metrics?: {
    activeConnections?: number;
    pendingTransactions?: number;
    last24hTransactions?: number;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check(): Promise<HealthStatus> {
    const checks: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: 'unhealthy',
        cache: 'disabled',
      },
    };

    // Check Database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.services.database = 'healthy';
    } catch {
      checks.services.database = 'unhealthy';
      checks.status = 'degraded';
    }

    // Check Redis/Cache
    try {
      const isHealthy = await this.redis.isHealthy();
      checks.services.cache = isHealthy ? 'healthy' : 'disabled';
    } catch {
      checks.services.cache = 'unhealthy';
    }

    return checks;
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with memory and metrics' })
  async detailedCheck(): Promise<HealthStatus> {
    const basicHealth = await this.check();
    
    // Add memory info
    const memUsage = process.memoryUsage();
    basicHealth.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // Add business metrics
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [pendingTx, last24hTx, activeSessions] = await Promise.all([
        this.prisma.transaction.count({ where: { status: 'PENDING' } }),
        this.prisma.transaction.count({ where: { createdAt: { gte: oneDayAgo } } }),
        this.prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      ]);

      basicHealth.metrics = {
        pendingTransactions: pendingTx,
        last24hTransactions: last24hTx,
        activeConnections: activeSessions,
      };
    } catch {
      // Metrics are optional, don't fail health check
    }

    // Check SMS configuration
    try {
      const smsProviders = await this.prisma.smsProvider.count({ where: { isActive: true } });
      basicHealth.services.sms = smsProviders > 0 ? 'configured' : 'not_configured';
    } catch {
      basicHealth.services.sms = 'not_configured';
    }

    return basicHealth;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  liveness() {
    return { live: true, uptime: Math.floor((Date.now() - this.startTime) / 1000) };
  }
}
