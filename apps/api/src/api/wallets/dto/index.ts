/**
 * Wallet DTOs - Input Validation for Enterprise-grade Security
 */

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min, Max, IsIn, Matches, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// 💰 WALLET DTOs
// ============================================

export class GetWalletsQueryDto {
  @ApiPropertyOptional({ enum: ['SPOT', 'FUNDING'], default: 'SPOT' })
  @IsOptional()
  @IsIn(['SPOT', 'FUNDING'])
  type?: 'SPOT' | 'FUNDING';
}

export class DepositAddressQueryDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  @IsNotEmpty()
  network: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ example: 'TRx1234567890abcdef...' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 100, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(1000000)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ example: 'Memo or tag' })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class TransferDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 100, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(1000000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ enum: ['SPOT', 'FUNDING'] })
  @IsIn(['SPOT', 'FUNDING'])
  from: 'SPOT' | 'FUNDING';

  @ApiProperty({ enum: ['SPOT', 'FUNDING'] })
  @IsIn(['SPOT', 'FUNDING'])
  to: 'SPOT' | 'FUNDING';
}

export class SendToUserDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 100, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Max(1000000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: '+218912345678 or user@email.com or user-uuid' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ example: 'TRC20' })
  @IsOptional()
  @IsString()
  network?: string;
}

export class ValidateAddressDto {
  @ApiProperty({ example: 'TRx1234567890abcdef...' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  @IsNotEmpty()
  network: string;
}

export class WithdrawalFeeQueryDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 'TRC20' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class TransactionFiltersDto {
  @ApiPropertyOptional({ example: 'DEPOSIT' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'USDT' })
  @IsOptional()
  @IsString()
  asset?: string;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class AddTestBalanceDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;
}

// ============================================
// 📤 RESPONSE DTOs
// ============================================

export class WalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  asset: string;

  @ApiProperty()
  network: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  lockedBalance: number;

  @ApiProperty()
  accountType: string;
}

export class DepositAddressResponseDto {
  @ApiProperty()
  address: string;

  @ApiProperty()
  network: string;

  @ApiProperty()
  asset: string;

  @ApiProperty()
  qrCode: string;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  asset: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}
