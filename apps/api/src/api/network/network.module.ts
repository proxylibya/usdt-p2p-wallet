import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuditModule } from '../../infrastructure/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [NetworkController],
  providers: [NetworkService],
  exports: [NetworkService],
})
export class NetworkModule {}
