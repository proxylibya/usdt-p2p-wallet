import { IsString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetQuoteDto {
  @ApiProperty({ example: 'USDT', description: 'Source asset' })
  @IsString()
  fromAsset: string;

  @ApiProperty({ example: 'USDC', description: 'Target asset' })
  @IsString()
  toAsset: string;

  @ApiProperty({ example: 100, description: 'Amount to swap' })
  @IsNumber()
  @IsPositive()
  @Min(0.00000001)
  fromAmount: number;
}

export class ExecuteSwapDto {
  @ApiProperty({ example: 'swap_123456_abc123', description: 'Quote ID from getQuote' })
  @IsString()
  quoteId: string;
}

export class SwapQuoteResponse {
  @ApiProperty()
  fromAsset: string;

  @ApiProperty()
  toAsset: string;

  @ApiProperty()
  fromAmount: number;

  @ApiProperty()
  toAmount: number;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  feePercentage: number;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  quoteId: string;
}

export class SwapExecuteResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  fromAsset: string;

  @ApiProperty()
  toAsset: string;

  @ApiProperty()
  fromAmount: number;

  @ApiProperty()
  toAmount: number;

  @ApiProperty()
  fee: number;
}

export class SwapPairResponse {
  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  minAmount: number;

  @ApiProperty()
  maxAmount: number;
}
