import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SmsService } from './sms.service';
import { CreateSmsProviderDto } from './dto/create-provider.dto';
import { UpdateSmsProviderDto } from './dto/update-provider.dto';

@ApiTags('SMS')
@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin', 'superadmin')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('providers')
  createProvider(@Body() dto: CreateSmsProviderDto) {
    return this.smsService.createProvider(dto);
  }

  @Get('providers')
  findAllProviders() {
    return this.smsService.findAllProviders();
  }

  @Get('providers/:id')
  findProvider(@Param('id') id: string) {
    return this.smsService.findProvider(id);
  }

  @Put('providers/:id')
  updateProvider(@Param('id') id: string, @Body() dto: UpdateSmsProviderDto) {
    return this.smsService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  deleteProvider(@Param('id') id: string) {
    return this.smsService.deleteProvider(id);
  }

  @Get('logs')
  getLogs(@Query('page') page: number, @Query('limit') limit: number) {
    return this.smsService.getLogs(Number(page) || 1, Number(limit) || 50);
  }

  @Post('test')
  async testSms(@Body() body: { phone: string; message: string }) {
    const result = await this.smsService.sendSms(body.phone, body.message);
    return { success: result };
  }
}
