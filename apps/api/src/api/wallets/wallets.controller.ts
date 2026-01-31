import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GetWalletsQueryDto,
  DepositAddressQueryDto,
  WithdrawDto,
  TransferDto,
  SendToUserDto,
  ValidateAddressDto,
  WithdrawalFeeQueryDto,
  TransactionFiltersDto,
  AddTestBalanceDto,
  WalletResponseDto,
  DepositAddressResponseDto,
} from './dto';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallets' })
  @ApiResponse({ status: 200, type: [WalletResponseDto] })
  async getWallets(@Req() req: any, @Query() query: GetWalletsQueryDto) {
    return this.walletsService.getUserWallets(req.user.id, query.type || 'SPOT');
  }

  @Get('funding')
  @ApiOperation({ summary: 'Get funding wallets' })
  @ApiResponse({ status: 200, type: [WalletResponseDto] })
  async getFundingWallets(@Req() req: any) {
    return this.walletsService.getUserWallets(req.user.id, 'FUNDING');
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get portfolio value' })
  async getPortfolio(@Req() req: any) {
    return this.walletsService.getPortfolioValue(req.user.id);
  }

  @Get('deposit-address')
  @ApiOperation({ summary: 'Get deposit address for asset' })
  @ApiResponse({ status: 200, type: DepositAddressResponseDto })
  async getDepositAddress(@Req() req: any, @Query() query: DepositAddressQueryDto) {
    return this.walletsService.getDepositAddress(req.user.id, query.asset, query.network);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal' })
  async withdraw(@Req() req: any, @Body() body: WithdrawDto) {
    return this.walletsService.requestWithdrawal(req.user.id, body);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Internal transfer between accounts' })
  async transfer(@Req() req: any, @Body() body: TransferDto) {
    return this.walletsService.transfer(req.user.id, body.asset, body.amount, body.from, body.to);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send assets to another user' })
  async sendToUser(@Req() req: any, @Body() body: SendToUserDto) {
    return this.walletsService.sendToUser(req.user.id, body);
  }

  @Get('recipient-lookup')
  @ApiOperation({ summary: 'Lookup recipient for internal transfer' })
  async lookupRecipient(@Req() req: any, @Query('recipient') recipient: string) {
    return this.walletsService.lookupRecipient(req.user.id, recipient);
  }

  @Post('validate-address')
  @ApiOperation({ summary: 'Validate withdrawal address' })
  async validateAddress(@Body() body: ValidateAddressDto) {
    return this.walletsService.validateAddress(body.address, body.network);
  }

  @Get('withdrawal-fee')
  @ApiOperation({ summary: 'Get withdrawal fee estimate' })
  async getWithdrawalFee(@Query() query: WithdrawalFeeQueryDto) {
    return this.walletsService.getWithdrawalFee(query.asset, query.network, parseFloat(query.amount));
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(@Req() req: any, @Query() filters: TransactionFiltersDto) {
    return this.walletsService.getTransactions(req.user.id, filters);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransaction(@Req() req: any, @Param('id') id: string) {
    return this.walletsService.getTransactionById(req.user.id, id);
  }

  @Get(':asset')
  @ApiOperation({ summary: 'Get wallet by asset' })
  async getWalletByAsset(@Req() req: any, @Param('asset') asset: string) {
    return this.walletsService.getWalletByAsset(req.user.id, asset, 'TRC20');
  }

  @Post('test-balance')
  @ApiOperation({ summary: '[DEV] Add test balance' })
  async addTestBalance(@Req() req: any, @Body() body: AddTestBalanceDto) {
    return this.walletsService.addTestBalance(req.user.id, body.asset, body.amount);
  }
}
