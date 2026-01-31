import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Infrastructure
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { SmsModule } from './infrastructure/sms/sms.module';
import { EmailModule } from './infrastructure/email/email.module';
import { StorageModule } from './infrastructure/storage/storage.module';

// Feature Modules
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { WalletsModule } from './api/wallets/wallets.module';
import { P2PModule } from './api/p2p/p2p.module';
import { MarketModule } from './api/market/market.module';
import { NotificationsModule } from './api/notifications/notifications.module';
import { HealthModule } from './api/health/health.module';
import { AiModule } from './api/ai/ai.module';
import { AdminModule } from './api/admin/admin.module';
import { SwapModule } from './api/swap/swap.module';
import { EidyaModule } from './api/eidya/eidya.module';
import { StakingModule } from './api/staking/staking.module';
import { UploadModule } from './api/upload/upload.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Infrastructure
    PrismaModule,
    RedisModule,
    SmsModule,
    EmailModule,
    StorageModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    P2PModule,
    MarketModule,
    NotificationsModule,
    AiModule,
    AdminModule,
    SwapModule,
    EidyaModule,
    StakingModule,
    UploadModule,
  ],
})
export class AppModule {}
