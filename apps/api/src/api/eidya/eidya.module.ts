import { Module } from '@nestjs/common';
import { EidyaService } from './eidya.service';
import { EidyaController } from './eidya.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [EidyaController],
  providers: [EidyaService, PrismaService],
  exports: [EidyaService],
})
export class EidyaModule {}
