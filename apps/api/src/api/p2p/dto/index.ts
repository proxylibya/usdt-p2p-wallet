/**
 * P2P DTOs - Input Validation for Enterprise-grade P2P Trading
 */

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min, Max, IsIn, IsArray, IsBoolean, IsUUID, ArrayMinSize, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// 🤝 P2P OFFER DTOs
// ============================================

export class CreateOfferDto {
  @ApiProperty({ enum: ['BUY', 'SELL'] })
  @IsIn(['BUY', 'SELL'])
  type: 'BUY' | 'SELL';

  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 'LYD' })
  @IsString()
  @IsNotEmpty()
  fiatCurrency: string;

  @ApiPropertyOptional({ example: 'LY' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ example: 5.25 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  available: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  minLimit: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  maxLimit: number;

  @ApiProperty({ example: ['bank_transfer', 'sadad'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  paymentMethods: string[];

  @ApiPropertyOptional()
  @IsOptional()
  paymentDetails?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Fast and reliable trader' })
  @IsOptional()
  @IsString()
  terms?: string;
}

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 5.30 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  available?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  minLimit?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  maxLimit?: number;

  @ApiPropertyOptional({ example: ['bank_transfer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Updated terms' })
  @IsOptional()
  @IsString()
  terms?: string;
}

export class OfferFiltersDto {
  @ApiPropertyOptional({ enum: ['BUY', 'SELL'] })
  @IsOptional()
  @IsIn(['BUY', 'SELL'])
  type?: 'BUY' | 'SELL';

  @ApiPropertyOptional({ example: 'USDT' })
  @IsOptional()
  @IsString()
  asset?: string;

  @ApiPropertyOptional({ example: 'LYD' })
  @IsOptional()
  @IsString()
  fiatCurrency?: string;

  @ApiPropertyOptional({ example: 'LY' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================
// 🔄 P2P TRADE DTOs
// ============================================

export class StartTradeDto {
  @ApiProperty({ example: 'uuid-of-offer' })
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;
}

export class CancelTradeDto {
  @ApiPropertyOptional({ example: 'Buyer did not respond' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class OpenDisputeDto {
  @ApiProperty({ example: 'Payment not received' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: ['https://evidence-url.com/image.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['buyer_wins', 'seller_wins'] })
  @IsIn(['buyer_wins', 'seller_wins'])
  resolution: 'buyer_wins' | 'seller_wins';
}

export class TradeHistoryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================
// 💬 P2P CHAT DTOs
// ============================================

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, I sent the payment' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ example: 'https://proof.com/screenshot.jpg' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

// ============================================
// 💳 PAYMENT METHOD DTOs
// ============================================

export class AddPaymentMethodDto {
  @ApiProperty({ example: 'bank_transfer' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({ example: { bankName: 'Sahara Bank', accountNumber: '123456789' } })
  @IsNotEmpty()
  details: Record<string, string>;
}

// ============================================
// 📤 RESPONSE DTOs
// ============================================

export class OfferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  asset: string;

  @ApiProperty()
  fiatCurrency: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  available: number;

  @ApiProperty()
  minLimit: number;

  @ApiProperty()
  maxLimit: number;

  @ApiProperty()
  paymentMethods: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export class TradeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  fiatAmount: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  buyerId: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  createdAt: Date;
}
