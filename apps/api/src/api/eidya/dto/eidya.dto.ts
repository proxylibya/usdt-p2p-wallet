import { IsNotEmpty, IsNumber, IsString, Min, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEidyaDto {
  @ApiProperty({ example: 'USDT' })
  @IsString()
  @IsNotEmpty()
  asset: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.1)
  totalAmount: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Eid Mubarak! 🌙' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class ClaimEidyaDto {
  @ApiProperty({ example: 'ABC123XYZ' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
