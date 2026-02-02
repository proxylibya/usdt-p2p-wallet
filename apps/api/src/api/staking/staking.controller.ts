import { Controller, Post, Get, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StakingService } from './staking.service';
import { SubscribeDto } from './dto/staking.dto';

@ApiTags('Earn')
@Controller('earn')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @Get('products')
  @ApiOperation({ summary: 'Get available staking products' })
  getProducts(@Query('asset') asset?: string) {
    return this.stakingService.getProducts(asset);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe to a staking product' })
  subscribe(@Req() req: Request, @Body() dto: SubscribeDto) {
    return this.stakingService.subscribe(req.user!.id, dto);
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my subscriptions' })
  getMySubscriptions(@Req() req: Request) {
    return this.stakingService.getMySubscriptions(req.user!.id);
  }

  @Post('redeem/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Redeem a subscription' })
  redeem(@Req() req: Request, @Param('id') id: string) {
    return this.stakingService.redeem(req.user!.id, id);
  }
}
