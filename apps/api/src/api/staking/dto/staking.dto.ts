import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStakingProductDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 5.5 })
  @IsNumber()
  apy: number;

  @ApiProperty({ example: 30, description: 'Duration in days (0 for flexible)' })
  @IsNumber()
  durationDays: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @IsOptional()
  maxAmount?: number;
}

export class SubscribeDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.1)
  amount: number;
}
