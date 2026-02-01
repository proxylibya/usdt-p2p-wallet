import { Module, Global } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Global() // Global so AuthModule can use SmsService without importing the module
@Module({
  controllers: [SmsController],
  providers: [SmsService, PrismaService],
  exports: [SmsService],
})
export class SmsModule {}
