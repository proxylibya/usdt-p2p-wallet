/**
 * Users DTOs - Input Validation for User Management
 */

import { IsString, IsNotEmpty, IsOptional, IsEmail, IsUrl, IsArray, ValidateNested, MinLength, MaxLength, Matches, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// 👤 PROFILE DTOs
// ============================================

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ahmed Ali' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

// ============================================
// 📋 KYC DTOs
// ============================================

export class SubmitKycDto {
  @ApiProperty({ example: 'passport', description: 'Document type: passport, national_id, driving_license' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'A12345678' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  documentNumber: string;

  @ApiProperty({ example: 'https://storage.com/front.jpg', description: 'Front image URL' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  frontImage: string;

  @ApiPropertyOptional({ example: 'https://storage.com/back.jpg', description: 'Back image URL (optional for passport)' })
  @IsOptional()
  @IsUrl()
  backImage?: string;

  @ApiProperty({ example: 'https://storage.com/selfie.jpg', description: 'Selfie with document' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  selfieImage: string;
}

// ============================================
// 🔒 SECURITY DTOs
// ============================================

export class Enable2FADto {
  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP' })
  @IsString()
  @IsNotEmpty()
  secret: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}

export class SecurityQuestionDto {
  @ApiProperty({ example: 'What is your pet name?' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  question: string;

  @ApiProperty({ example: 'Fluffy' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  answer: string;
}

export class SetSecurityQuestionsDto {
  @ApiProperty({ type: [SecurityQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  questions: SecurityQuestionDto[];
}

// ============================================
// 📤 RESPONSE DTOs
// ============================================

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  kycStatus: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class UserStatsDto {
  @ApiProperty()
  totalTrades: number;

  @ApiProperty()
  completedTrades: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  totalVolume: number;

  @ApiProperty()
  averageRating: number;
}

export class KycStatusDto {
  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  documentType?: string;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;
}

export class SecuritySettingsDto {
  @ApiProperty()
  twoFactorEnabled: boolean;

  @ApiProperty()
  hasSecurityQuestions: boolean;

  @ApiProperty()
  lastPasswordChange: Date;

  @ApiProperty()
  activeSessions: number;
}

export class Setup2FAResponseDto {
  @ApiProperty()
  secret: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  backupCodes: string[];
}
