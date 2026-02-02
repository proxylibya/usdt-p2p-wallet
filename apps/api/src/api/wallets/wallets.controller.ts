import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GetWalletsQueryDto,
  DepositAddressQueryDto,
  WithdrawDto,
  WithdrawRequestDto,
  WithdrawConfirmDto,
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
  async getWallets(@Req() req: Request, @Query() query: GetWalletsQueryDto) {
    return this.walletsService.getUserWallets(req.user!.id, query.type || 'SPOT');
  }

  @Get('funding')
  @ApiOperation({ summary: 'Get funding wallets' })
  @ApiResponse({ status: 200, type: [WalletResponseDto] })
  async getFundingWallets(@Req() req: Request) {
    return this.walletsService.getUserWallets(req.user!.id, 'FUNDING');
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get portfolio value' })
  async getPortfolio(@Req() req: Request) {
    return this.walletsService.getPortfolioValue(req.user!.id);
  }

  @Get('deposit-address')
  @ApiOperation({ summary: 'Get deposit address for asset' })
  @ApiResponse({ status: 200, type: DepositAddressResponseDto })
  async getDepositAddress(@Req() req: Request, @Query() query: DepositAddressQueryDto) {
    return this.walletsService.getDepositAddress(req.user!.id, query.asset, query.network);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal (legacy - use /withdraw/request for secure 2-step)' })
  async withdraw(@Req() req: Request, @Body() body: WithdrawDto) {
    return this.walletsService.requestWithdrawal(req.user!.id, body);
  }

  // 🔒 SECURE 2-STEP WITHDRAWAL
  @Post('withdraw/request')
  @ApiOperation({ summary: '[SECURE] Step 1: Request withdrawal - sends OTP to phone' })
  async withdrawRequest(@Req() req: Request, @Body() body: WithdrawRequestDto) {
    return this.walletsService.initiateSecureWithdrawal(req.user!.id, body);
  }

  @Post('withdraw/confirm')
  @ApiOperation({ summary: '[SECURE] Step 2: Confirm withdrawal with OTP' })
  async withdrawConfirm(@Req() req: Request, @Body() body: WithdrawConfirmDto) {
    // Check if user is blocked from withdrawals
    const isBlocked = await this.walletsService.isWithdrawalBlocked(req.user!.id);
    if (isBlocked) {
      throw new Error('Your account is temporarily blocked from withdrawals due to security reasons.');
    }
    return this.walletsService.confirmSecureWithdrawal(req.user!.id, body.requestId, body.otp);
  }

  @Get('withdraw/:id/status')
  @ApiOperation({ summary: 'Get withdrawal status' })
  async getWithdrawalStatus(@Req() req: Request, @Param('id') id: string) {
    return this.walletsService.getWithdrawalStatus(req.user!.id, id);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Internal transfer between accounts' })
  async transfer(@Req() req: Request, @Body() body: TransferDto) {
    return this.walletsService.transfer(req.user!.id, body.asset, body.amount, body.from, body.to);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send assets to another user' })
  async sendToUser(@Req() req: Request, @Body() body: SendToUserDto) {
    return this.walletsService.sendToUser(req.user!.id, body);
  }

  @Get('recipient-lookup')
  @ApiOperation({ summary: 'Lookup recipient for internal transfer' })
  async lookupRecipient(@Req() req: Request, @Query('recipient') recipient: string) {
    return this.walletsService.lookupRecipient(req.user!.id, recipient);
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
  async getTransactions(@Req() req: Request, @Query() filters: TransactionFiltersDto) {
    return this.walletsService.getTransactions(req.user!.id, filters);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransaction(@Req() req: Request, @Param('id') id: string) {
    return this.walletsService.getTransactionById(req.user!.id, id);
  }

  @Get(':asset')
  @ApiOperation({ summary: 'Get wallet by asset' })
  async getWalletByAsset(@Req() req: Request, @Param('asset') asset: string) {
    return this.walletsService.getWalletByAsset(req.user!.id, asset, 'TRC20');
  }

  @Post('test-balance')
  @ApiOperation({ summary: '[DEV ONLY] Add test balance - Disabled in production' })
  async addTestBalance(@Req() req: Request, @Body() body: AddTestBalanceDto) {
    // 🔒 SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This endpoint is disabled in production');
    }
    return this.walletsService.addTestBalance(req.user!.id, body.asset, body.amount);
  }
}
