import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSmsProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'generic_http' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  config: any;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @IsOptional()
  priority: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @IsOptional()
  costPerMsg: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency: string;
}
