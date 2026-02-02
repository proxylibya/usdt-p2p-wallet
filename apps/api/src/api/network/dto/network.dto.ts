import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NetworkMode {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET',
}

export class UpdateNetworkModeDto {
  @ApiProperty({ enum: NetworkMode, description: 'Network mode to switch to' })
  @IsEnum(NetworkMode)
  networkMode: NetworkMode;

  @ApiProperty({ description: 'Confirmation code for mainnet switch' })
  @IsString()
  confirmationCode: string;

  @ApiPropertyOptional({ description: 'Reason for mode change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateNetworkConfigDto {
  @ApiPropertyOptional({ description: 'Display name in English' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Display name in Arabic' })
  @IsOptional()
  @IsString()
  displayNameAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Primary color hex' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Warning color hex' })
  @IsOptional()
  @IsString()
  warningColor?: string;

  @ApiPropertyOptional({ description: 'Badge color hex' })
  @IsOptional()
  @IsString()
  badgeColor?: string;

  @ApiPropertyOptional({ description: 'Border color hex' })
  @IsOptional()
  @IsString()
  borderColor?: string;

  @ApiPropertyOptional({ description: 'Show global banner' })
  @IsOptional()
  @IsBoolean()
  showGlobalBanner?: boolean;

  @ApiPropertyOptional({ description: 'Show watermark' })
  @IsOptional()
  @IsBoolean()
  showWatermark?: boolean;

  @ApiPropertyOptional({ description: 'Require confirmation for mode switch' })
  @IsOptional()
  @IsBoolean()
  requireConfirmation?: boolean;

  @ApiPropertyOptional({ description: 'Enable deposits' })
  @IsOptional()
  @IsBoolean()
  enableDeposits?: boolean;

  @ApiPropertyOptional({ description: 'Enable withdrawals' })
  @IsOptional()
  @IsBoolean()
  enableWithdrawals?: boolean;

  @ApiPropertyOptional({ description: 'Enable P2P trading' })
  @IsOptional()
  @IsBoolean()
  enableP2P?: boolean;

  @ApiPropertyOptional({ description: 'Enable swap' })
  @IsOptional()
  @IsBoolean()
  enableSwap?: boolean;

  @ApiPropertyOptional({ description: 'Enable staking' })
  @IsOptional()
  @IsBoolean()
  enableStaking?: boolean;

  @ApiPropertyOptional({ description: 'Maximum transaction amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTransactionAmount?: number;

  @ApiPropertyOptional({ description: 'Daily limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({ description: 'Blockchain configuration JSON' })
  @IsOptional()
  blockchainConfig?: Record<string, any>;
}

export class SetConfirmationCodeDto {
  @ApiProperty({ description: 'New confirmation code for mainnet switch' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Current code for verification' })
  @IsOptional()
  @IsString()
  currentCode?: string;
}

export class NetworkConfigResponseDto {
  id: string;
  networkMode: NetworkMode;
  displayName: string;
  displayNameAr: string;
  description: string | null;
  descriptionAr: string | null;
  primaryColor: string;
  warningColor: string;
  badgeColor: string;
  borderColor: string;
  showGlobalBanner: boolean;
  showWatermark: boolean;
  requireConfirmation: boolean;
  enableDeposits: boolean;
  enableWithdrawals: boolean;
  enableP2P: boolean;
  enableSwap: boolean;
  enableStaking: boolean;
  maxTransactionAmount: number;
  dailyLimit: number;
  blockchainConfig: Record<string, any>;
  lastModeChangeAt: Date | null;
  lastModeChangeBy: string | null;
  modeChangeReason: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NetworkModeHistoryResponseDto {
  id: string;
  previousMode: NetworkMode;
  newMode: NetworkMode;
  changedBy: string;
  changedByName: string | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: Date;
}
