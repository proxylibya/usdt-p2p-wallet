import { Controller, Get, Post, Body, Query, UseGuards, Req, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SwapService, SwapQuote } from './swap.service';
import { ExecuteSwapDto, SwapQuoteResponse, SwapExecuteResponse, SwapPairResponse } from './dto';

@ApiTags('Swap')
@ApiBearerAuth()
@Controller('api/v1/swap')
@UseGuards(JwtAuthGuard)
export class SwapController {
  constructor(private swapService: SwapService) {}

  @Get('pairs')
  @ApiOperation({ summary: 'Get supported swap pairs' })
  @ApiResponse({ status: 200, type: [SwapPairResponse] })
  getSupportedPairs(): Promise<SwapPairResponse[]> {
    return this.swapService.getSupportedPairs();
  }

  @Get('quote')
  @ApiOperation({ summary: 'Get swap quote' })
  @ApiQuery({ name: 'fromAsset', required: true, example: 'USDT' })
  @ApiQuery({ name: 'toAsset', required: true, example: 'USDC' })
  @ApiQuery({ name: 'fromAmount', required: true, example: 100 })
  @ApiResponse({ status: 200, type: SwapQuoteResponse })
  getQuote(
    @Query('fromAsset') fromAsset: string,
    @Query('toAsset') toAsset: string,
    @Query('fromAmount') fromAmount: string,
  ): Promise<SwapQuote> {
    return this.swapService.getQuote(fromAsset, toAsset, parseFloat(fromAmount));
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute swap with quote' })
  @ApiResponse({ status: 200, type: SwapExecuteResponse })
  executeSwap(@Req() req: any, @Body() body: ExecuteSwapDto) {
    return this.swapService.executeSwap(req.user.id, body.quoteId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get swap history' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getSwapHistory(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.swapService.getSwapHistory(req.user.id, page, limit);
  }
}
