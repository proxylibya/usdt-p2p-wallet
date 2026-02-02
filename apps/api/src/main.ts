import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { PerformanceInterceptor, RequestIdInterceptor } from './shared/interceptors';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Serve uploaded files statically
  const uploadsPath = configService.get('LOCAL_STORAGE_PATH', './uploads');
  app.useStaticAssets(join(process.cwd(), uploadsPath), {
    prefix: '/uploads/',
  });

  const expressApp = app.getHttpAdapter().getInstance();
  
  // Root endpoint
  expressApp.get('/', (_req: any, res: any) => {
    if (configService.get('NODE_ENV') !== 'production') {
      return res.redirect('/docs');
    }
    return res.json({
      status: 'ok',
      version: '1.0.0',
      docs: null,
    });
  });

  // Railway healthcheck endpoint - responds on /api/v1 directly
  expressApp.get('/api/v1', (_req: any, res: any) => {
    return res.json({
      status: 'ok',
      service: 'usdt-p2p-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Security - Enhanced Helmet Configuration
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS - Configurable Origins
  const corsOrigins = configService.get('CORS_ORIGINS')?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://192.168.1.103:3000',
    'http://192.168.1.103:5173',
    'capacitor://localhost',
    'http://localhost',
  ];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Prefix & Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe - Enterprise Configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new PerformanceInterceptor(),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('USDT Wallet API')
      .setDescription('Enterprise-grade USDT P2P Wallet Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('wallets', 'Wallet operations')
      .addTag('p2p', 'P2P Trading')
      .addTag('market', 'Market data')
      .addTag('notifications', 'Notifications')
      .addTag('admin', 'Admin operations')
      .addTag('ai', 'AI features')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3002;
  await app.listen(port, '0.0.0.0');

  logger.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║     🚀 USDT Wallet API Server Running                 ║
  ╠═══════════════════════════════════════════════════════╣
  ║  Environment: ${(configService.get('NODE_ENV') || 'development').padEnd(40)}║
  ║  Port: ${String(port).padEnd(47)}║
  ║  API Docs: http://localhost:${port}/docs${' '.repeat(22)}║
  ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
