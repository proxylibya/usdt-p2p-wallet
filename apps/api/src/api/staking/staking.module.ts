import { Module } from '@nestjs/common';
import { StakingService } from './staking.service';
import { StakingController } from './staking.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [StakingController],
  providers: [StakingService, PrismaService],
  exports: [StakingService],
})
export class StakingModule {}
