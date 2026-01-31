import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy' | 'disabled';
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
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
      version: '1.0.0',
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
  @ApiOperation({ summary: 'Detailed health check with memory info' })
  async detailedCheck(): Promise<HealthStatus> {
    const basicHealth = await this.check();
    
    // Add memory info
    const memUsage = process.memoryUsage();
    basicHealth.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

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
