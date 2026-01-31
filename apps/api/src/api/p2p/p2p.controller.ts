import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { P2PService } from './p2p.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateOfferDto,
  UpdateOfferDto,
  OfferFiltersDto,
  StartTradeDto,
  CancelTradeDto,
  OpenDisputeDto,
  ResolveDisputeDto,
  TradeHistoryQueryDto,
  SendMessageDto,
  AddPaymentMethodDto,
  OfferResponseDto,
  TradeResponseDto,
} from './dto';

@ApiTags('p2p')
@Controller('p2p')
export class P2PController {
  constructor(private p2pService: P2PService) {}

  @Get('offers')
  @ApiOperation({ summary: 'Get P2P offers' })
  @ApiResponse({ status: 200, type: [OfferResponseDto] })
  async getOffers(@Query() filters: OfferFiltersDto) {
    return this.p2pService.getOffers(filters);
  }

  @Get('offers/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my offers' })
  async getMyOffers(@Req() req: any) {
    return this.p2pService.getMyOffers(req.user.id);
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get offer by ID' })
  async getOffer(@Param('id') id: string) {
    return this.p2pService.getOfferById(id);
  }

  @Post('offers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new offer' })
  async createOffer(@Req() req: any, @Body() data: CreateOfferDto) {
    return this.p2pService.createOffer(req.user.id, data);
  }

  @Patch('offers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update offer' })
  async updateOffer(@Req() req: any, @Param('id') id: string, @Body() data: UpdateOfferDto) {
    return this.p2pService.updateOffer(id, req.user.id, data);
  }

  @Delete('offers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete offer' })
  async deleteOffer(@Req() req: any, @Param('id') id: string) {
    return this.p2pService.deleteOffer(id, req.user.id);
  }

  @Post('trades')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a trade' })
  @ApiResponse({ status: 201, type: TradeResponseDto })
  async startTrade(@Req() req: any, @Body() body: StartTradeDto) {
    return this.p2pService.startTrade(req.user.id, body.offerId, body.amount);
  }

  @Get('trades/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active trades' })
  async getActiveTrades(@Req() req: any) {
    return this.p2pService.getActiveTrades(req.user.id);
  }

  @Get('trades/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trade history' })
  async getTradeHistory(@Req() req: any, @Query() query: TradeHistoryQueryDto) {
    return this.p2pService.getTradeHistory(req.user.id, query.page || 1, query.limit || 20);
  }

  @Get('trades/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trade by ID' })
  async getTrade(@Param('id') id: string) {
    return this.p2pService.getTradeById(id);
  }

  @Post('trades/:id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment sent' })
  async confirmPayment(@Req() req: any, @Param('id') id: string) {
    return this.p2pService.confirmPayment(id, req.user.id);
  }

  @Post('trades/:id/release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release crypto to buyer' })
  async releaseCrypto(@Req() req: any, @Param('id') id: string) {
    return this.p2pService.releaseCrypto(id, req.user.id);
  }

  @Post('trades/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel trade' })
  async cancelTrade(@Req() req: any, @Param('id') id: string, @Body() body: CancelTradeDto) {
    return this.p2pService.cancelTrade(id, req.user.id, body.reason);
  }

  @Post('trades/:id/dispute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open dispute' })
  async openDispute(@Req() req: any, @Param('id') id: string, @Body() body: OpenDisputeDto) {
    return this.p2pService.openDispute(id, req.user.id, body.reason);
  }

  @Post('trades/:id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve dispute' })
  async resolveDispute(@Req() req: any, @Param('id') id: string, @Body() body: ResolveDisputeDto) {
    return this.p2pService.resolveDispute(id, req.user.id, body.resolution);
  }

  @Get('trades/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trade chat messages' })
  async getMessages(@Param('id') id: string) {
    return this.p2pService.getMessages(id);
  }

  @Post('trades/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message in trade chat' })
  async sendMessage(@Req() req: any, @Param('id') id: string, @Body() body: SendMessageDto) {
    return this.p2pService.sendMessage(id, req.user.id, body.text);
  }

  @Get('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment methods' })
  async getPaymentMethods(@Req() req: any) {
    return this.p2pService.getPaymentMethods(req.user.id);
  }

  @Post('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add payment method' })
  async addPaymentMethod(@Req() req: any, @Body() body: AddPaymentMethodDto) {
    return this.p2pService.addPaymentMethod(req.user.id, body.method, body.details);
  }

  @Delete('payment-methods/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete payment method' })
  async deletePaymentMethod(@Req() req: any, @Param('id') id: string) {
    return this.p2pService.deletePaymentMethod(req.user.id, id);
  }
}
