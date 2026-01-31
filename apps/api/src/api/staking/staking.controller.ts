import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
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
  subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    return this.stakingService.subscribe(req.user.sub, dto);
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my subscriptions' })
  getMySubscriptions(@Request() req: any) {
    return this.stakingService.getMySubscriptions(req.user.sub);
  }

  @Post('redeem/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Redeem a subscription' })
  redeem(@Request() req: any, @Param('id') id: string) {
    return this.stakingService.redeem(req.user.sub, id);
  }
}
