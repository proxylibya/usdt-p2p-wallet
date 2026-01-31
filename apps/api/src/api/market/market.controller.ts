import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetPricesQueryDto, CreatePriceAlertDto, MarketCoinDto, PriceAlertDto } from './dto';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get('coins')
  @ApiOperation({ summary: 'Get all market coins' })
  @ApiResponse({ status: 200, type: [MarketCoinDto] })
  async getCoins() {
    return this.marketService.getMarketCoins();
  }

  @Get('coins/:id')
  @ApiOperation({ summary: 'Get coin by ID' })
  @ApiResponse({ status: 200, type: MarketCoinDto })
  async getCoin(@Param('id') id: string) {
    return this.marketService.getCoinById(id);
  }

  @Get('prices')
  @ApiOperation({ summary: 'Get live prices' })
  async getPrices(@Query() query: GetPricesQueryDto) {
    return this.marketService.getLivePrices(query.symbols?.split(',') || []);
  }

  // ========== PRICE ALERTS (Protected) ==========

  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user price alerts' })
  @ApiResponse({ status: 200, type: [PriceAlertDto] })
  async getAlerts(@Req() req: any) {
    return this.marketService.getPriceAlerts(req.user.id);
  }

  @Post('alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create price alert' })
  @ApiResponse({ status: 201, type: PriceAlertDto })
  async createAlert(@Req() req: any, @Body() body: CreatePriceAlertDto) {
    return this.marketService.createPriceAlert(req.user.id, body);
  }

  @Delete('alerts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete price alert' })
  async deleteAlert(@Req() req: any, @Param('id') id: string) {
    return this.marketService.deletePriceAlert(id, req.user.id);
  }
}
