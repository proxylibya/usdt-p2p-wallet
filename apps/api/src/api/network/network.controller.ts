import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { AdminGuard } from '../admin/admin.guard';
import {
  UpdateNetworkModeDto,
  UpdateNetworkConfigDto,
  SetConfirmationCodeDto,
} from './dto/network.dto';

@ApiTags('Network')
@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get public network status (no auth required)' })
  async getPublicStatus() {
    return this.networkService.getPublicNetworkStatus();
  }

  @Get('config')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full network configuration (admin only)' })
  async getNetworkConfig() {
    return this.networkService.getNetworkConfig();
  }

  @Put('config')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update network configuration (admin only)' })
  async updateNetworkConfig(@Body() dto: UpdateNetworkConfigDto, @Req() req: any) {
    const adminId = req.admin?.id || 'system';
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.networkService.updateNetworkConfig(dto, adminId, ipAddress);
  }

  @Post('mode')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch network mode (mainnet/testnet) - requires confirmation' })
  async updateNetworkMode(@Body() dto: UpdateNetworkModeDto, @Req() req: any) {
    const adminId = req.admin?.id || 'system';
    const adminName = req.admin?.name || 'System';
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.networkService.updateNetworkMode(dto, adminId, adminName, ipAddress);
  }

  @Post('confirmation-code')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set confirmation code for mainnet switch (admin only)' })
  async setConfirmationCode(@Body() dto: SetConfirmationCodeDto, @Req() req: any) {
    const adminId = req.admin?.id || 'system';
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.networkService.setConfirmationCode(dto, adminId, ipAddress);
  }

  @Get('history')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get network mode change history (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getModeHistory(@Query('limit') limit?: number) {
    return this.networkService.getModeHistory(limit || 50);
  }

  @Get('blockchain-config')
  @ApiOperation({ summary: 'Get blockchain configuration for current network mode' })
  async getBlockchainConfig() {
    return this.networkService.getBlockchainConfig();
  }
}
