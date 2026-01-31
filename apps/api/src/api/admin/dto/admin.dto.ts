import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserStatus {
  ALL = 'all',
  ACTIVE = 'active',
  BANNED = 'banned',
  PENDING = 'pending',
}

export enum KycStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class GetUsersQueryDto {
  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ALL })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

export class BanUserDto {
  @ApiProperty({ example: 'Violation of terms' })
  @IsString()
  reason: string;
}

export class UpdateKycStatusDto {
  @ApiProperty({ enum: KycStatus })
  @IsEnum(KycStatus)
  status: KycStatus;

  @ApiPropertyOptional({ example: 'Documents verified successfully' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ example: 'seller', enum: ['buyer', 'seller'] })
  @IsString()
  winner: 'buyer' | 'seller';

  @ApiProperty({ example: 'Buyer provided valid payment proof' })
  @IsString()
  resolution: string;
}

export class DashboardStatsResponse {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  pendingKyc: number;

  @ApiProperty()
  openDisputes: number;

  @ApiProperty()
  totalVolume: number;
}

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isBanned: boolean;

  @ApiProperty({ enum: KycStatus })
  kycStatus: KycStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastLoginAt: Date;
}

export class PaginatedResponse<T> {
  @ApiProperty()
  items: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class AuditLogResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  adminId: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  targetType: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  details: any;

  @ApiProperty()
  createdAt: Date;
}

export class SystemSettingsDto {
  @ApiProperty()
  @IsString()
  platformName: string;

  @ApiProperty()
  @IsString()
  supportEmail: string;

  @ApiProperty()
  @IsBoolean()
  maintenanceMode: boolean;

  @ApiProperty()
  @IsBoolean()
  registrationEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  kycRequired: boolean;

  @ApiProperty()
  @IsNumber()
  tradingFee: number;

  @ApiProperty()
  @IsNumber()
  withdrawalFee: number;

  @ApiProperty()
  @IsNumber()
  p2pFee: number;

  @ApiProperty()
  @IsNumber()
  minWithdrawal: number;

  @ApiProperty()
  @IsNumber()
  maxWithdrawal: number;

  @ApiProperty()
  @IsNumber()
  dailyWithdrawalLimit: number;

  @ApiProperty()
  @IsNumber()
  minP2PTrade: number;

  @ApiProperty()
  @IsNumber()
  maxP2PTrade: number;

  @ApiProperty()
  @IsBoolean()
  twoFactorRequired: boolean;

  @ApiProperty()
  @IsNumber()
  passwordMinLength: number;

  @ApiProperty()
  @IsNumber()
  sessionTimeout: number;

  @ApiProperty()
  @IsNumber()
  maxLoginAttempts: number;

  @ApiProperty()
  @IsBoolean()
  emailNotifications: boolean;

  @ApiProperty()
  @IsBoolean()
  pushNotifications: boolean;

  @ApiProperty()
  @IsBoolean()
  smsNotifications: boolean;
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: ['info', 'warning', 'success', 'error'] })
  @IsString()
  type: string;

  @ApiProperty({ enum: ['all', 'users', 'merchants'] })
  @IsString()
  target: string;
}
