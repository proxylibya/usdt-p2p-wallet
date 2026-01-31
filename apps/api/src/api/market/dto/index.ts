/**
 * Market DTOs - Input Validation for Market Endpoints
 */

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// 📊 MARKET DTOs
// ============================================

export class GetPricesQueryDto {
  @ApiPropertyOptional({ example: 'BTC,ETH,USDT', description: 'Comma-separated symbols' })
  @IsOptional()
  @IsString()
  symbols?: string;
}

export class CreatePriceAlertDto {
  @ApiProperty({ example: 'BTC' })
  @IsString()
  @IsNotEmpty()
  assetSymbol: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  targetPrice: number;

  @ApiProperty({ enum: ['above', 'below'] })
  @IsIn(['above', 'below'])
  condition: 'above' | 'below';
}

// ============================================
// 📤 RESPONSE DTOs
// ============================================

export class MarketCoinDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  change24h: number;

  @ApiProperty()
  volume24h: number;

  @ApiProperty()
  marketCap: number;
}

export class PriceAlertDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assetSymbol: string;

  @ApiProperty()
  targetPrice: number;

  @ApiProperty()
  condition: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isTriggered: boolean;

  @ApiProperty()
  createdAt: Date;
}
