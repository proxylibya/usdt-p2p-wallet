import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class AuthConfigDto {
  // ========== Registration Methods ==========
  @ApiProperty({ description: 'Enable phone registration', default: true })
  @IsBoolean()
  @IsOptional()
  enablePhoneRegistration?: boolean;

  @ApiProperty({ description: 'Phone is required for registration', default: true })
  @IsBoolean()
  @IsOptional()
  phoneRequired?: boolean;

  @ApiProperty({ description: 'Require phone verification via OTP', default: false })
  @IsBoolean()
  @IsOptional()
  phoneVerificationRequired?: boolean;

  @ApiProperty({ description: 'Enable email registration', default: false })
  @IsBoolean()
  @IsOptional()
  enableEmailRegistration?: boolean;

  @ApiProperty({ description: 'Email is required for registration', default: false })
  @IsBoolean()
  @IsOptional()
  emailRequired?: boolean;

  @ApiProperty({ description: 'Require email verification', default: false })
  @IsBoolean()
  @IsOptional()
  emailVerificationRequired?: boolean;

  // ========== Social Login ==========
  @ApiProperty({ description: 'Enable Google login', default: false })
  @IsBoolean()
  @IsOptional()
  enableGoogleLogin?: boolean;

  @ApiPropertyOptional({ description: 'Google Web Client ID' })
  @IsString()
  @IsOptional()
  googleClientId?: string;

  @ApiPropertyOptional({ description: 'Google Client Secret' })
  @IsString()
  @IsOptional()
  googleClientSecret?: string;

  @ApiPropertyOptional({ description: 'Google Android Client ID' })
  @IsString()
  @IsOptional()
  googleAndroidClientId?: string;

  @ApiPropertyOptional({ description: 'Google iOS Client ID' })
  @IsString()
  @IsOptional()
  googleIosClientId?: string;

  @ApiProperty({ description: 'Enable Apple login', default: false })
  @IsBoolean()
  @IsOptional()
  enableAppleLogin?: boolean;

  @ApiPropertyOptional({ description: 'Apple Client ID (Service ID)' })
  @IsString()
  @IsOptional()
  appleClientId?: string;

  @ApiPropertyOptional({ description: 'Apple Team ID' })
  @IsString()
  @IsOptional()
  appleTeamId?: string;

  @ApiPropertyOptional({ description: 'Apple Key ID' })
  @IsString()
  @IsOptional()
  appleKeyId?: string;

  @ApiPropertyOptional({ description: 'Apple Private Key (encrypted)' })
  @IsString()
  @IsOptional()
  applePrivateKey?: string;

  @ApiProperty({ description: 'Enable Facebook login', default: false })
  @IsBoolean()
  @IsOptional()
  enableFacebookLogin?: boolean;

  @ApiPropertyOptional({ description: 'Facebook App ID' })
  @IsString()
  @IsOptional()
  facebookAppId?: string;

  @ApiPropertyOptional({ description: 'Facebook App Secret' })
  @IsString()
  @IsOptional()
  facebookAppSecret?: string;

  // ========== Login Settings ==========
  @ApiProperty({ description: 'Enable direct password login', default: true })
  @IsBoolean()
  @IsOptional()
  enableDirectLogin?: boolean;

  @ApiProperty({ description: 'Enable OTP login', default: false })
  @IsBoolean()
  @IsOptional()
  enableOtpLogin?: boolean;

  @ApiProperty({ description: 'OTP expiration in minutes', default: 5 })
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  otpExpirationMinutes?: number;

  @ApiProperty({ description: 'OTP length', default: 6 })
  @IsInt()
  @Min(4)
  @Max(8)
  @IsOptional()
  otpLength?: number;

  @ApiProperty({ description: 'Max OTP attempts before lockout', default: 5 })
  @IsInt()
  @Min(3)
  @Max(10)
  @IsOptional()
  maxOtpAttempts?: number;

  @ApiProperty({ description: 'OTP lockout duration in minutes', default: 30 })
  @IsInt()
  @Min(5)
  @Max(60)
  @IsOptional()
  otpLockoutMinutes?: number;

  // ========== Password Policy ==========
  @ApiProperty({ description: 'Minimum password length', default: 8 })
  @IsInt()
  @Min(6)
  @Max(32)
  @IsOptional()
  minPasswordLength?: number;

  @ApiProperty({ description: 'Require uppercase letters', default: true })
  @IsBoolean()
  @IsOptional()
  requireUppercase?: boolean;

  @ApiProperty({ description: 'Require lowercase letters', default: true })
  @IsBoolean()
  @IsOptional()
  requireLowercase?: boolean;

  @ApiProperty({ description: 'Require numbers', default: true })
  @IsBoolean()
  @IsOptional()
  requireNumbers?: boolean;

  @ApiProperty({ description: 'Require special characters', default: false })
  @IsBoolean()
  @IsOptional()
  requireSpecialChars?: boolean;

  // ========== Session Settings ==========
  @ApiProperty({ description: 'Access token expiration in minutes', default: 15 })
  @IsInt()
  @Min(5)
  @Max(1440)
  @IsOptional()
  accessTokenExpirationMins?: number;

  @ApiProperty({ description: 'Refresh token expiration in days', default: 7 })
  @IsInt()
  @Min(1)
  @Max(90)
  @IsOptional()
  refreshTokenExpirationDays?: number;

  @ApiProperty({ description: 'Max active sessions per user', default: 5 })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  maxActiveSessions?: number;

  // ========== Security ==========
  @ApiProperty({ description: 'Enable two-factor authentication', default: false })
  @IsBoolean()
  @IsOptional()
  enableTwoFactor?: boolean;

  @ApiProperty({ description: 'Enable biometric authentication', default: true })
  @IsBoolean()
  @IsOptional()
  enableBiometric?: boolean;

  @ApiProperty({ description: 'Enable device tracking', default: true })
  @IsBoolean()
  @IsOptional()
  enableDeviceTracking?: boolean;

  // ========== Registration Fields ==========
  @ApiProperty({ description: 'Require name on registration', default: true })
  @IsBoolean()
  @IsOptional()
  requireName?: boolean;

  @ApiProperty({ description: 'Require avatar on registration', default: false })
  @IsBoolean()
  @IsOptional()
  requireAvatar?: boolean;

  @ApiProperty({ description: 'Default country code', default: 'GLOBAL' })
  @IsString()
  @IsOptional()
  defaultCountryCode?: string;

  @ApiProperty({ description: 'Default currency', default: 'USD' })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiProperty({ description: 'Default language', default: 'en' })
  @IsString()
  @IsOptional()
  defaultLanguage?: string;

  // ========== Terms & Privacy ==========
  @ApiPropertyOptional({ description: 'Terms of service URL' })
  @IsString()
  @IsOptional()
  termsUrl?: string;

  @ApiPropertyOptional({ description: 'Terms of service URL (Arabic)' })
  @IsString()
  @IsOptional()
  termsUrlAr?: string;

  @ApiPropertyOptional({ description: 'Privacy policy URL' })
  @IsString()
  @IsOptional()
  privacyUrl?: string;

  @ApiPropertyOptional({ description: 'Privacy policy URL (Arabic)' })
  @IsString()
  @IsOptional()
  privacyUrlAr?: string;

  @ApiProperty({ description: 'Require terms acceptance', default: true })
  @IsBoolean()
  @IsOptional()
  requireTermsAcceptance?: boolean;

  // ========== UI Customization ==========
  @ApiProperty({ description: 'Login screen title', default: 'Welcome Back' })
  @IsString()
  @IsOptional()
  loginScreenTitle?: string;

  @ApiProperty({ description: 'Login screen title (Arabic)', default: 'مرحباً بعودتك' })
  @IsString()
  @IsOptional()
  loginScreenTitleAr?: string;

  @ApiProperty({ description: 'Register screen title', default: 'Create Account' })
  @IsString()
  @IsOptional()
  registerScreenTitle?: string;

  @ApiProperty({ description: 'Register screen title (Arabic)', default: 'إنشاء حساب' })
  @IsString()
  @IsOptional()
  registerScreenTitleAr?: string;

  @ApiPropertyOptional({ description: 'Login screen background image URL' })
  @IsString()
  @IsOptional()
  loginBackgroundUrl?: string;

  @ApiPropertyOptional({ description: 'Register screen background image URL' })
  @IsString()
  @IsOptional()
  registerBackgroundUrl?: string;
}

export class UpdateAuthConfigDto extends PartialType(AuthConfigDto) {}

// Public config (safe to expose to clients - no secrets)
export class PublicAuthConfigDto {
  @ApiProperty()
  enablePhoneRegistration: boolean;

  @ApiProperty()
  phoneRequired: boolean;

  @ApiProperty()
  phoneVerificationRequired: boolean;

  @ApiProperty()
  enableEmailRegistration: boolean;

  @ApiProperty()
  emailRequired: boolean;

  @ApiProperty()
  emailVerificationRequired: boolean;

  @ApiProperty()
  enableGoogleLogin: boolean;

  @ApiProperty()
  enableAppleLogin: boolean;

  @ApiProperty()
  enableFacebookLogin: boolean;

  @ApiProperty()
  enableDirectLogin: boolean;

  @ApiProperty()
  enableOtpLogin: boolean;

  @ApiProperty()
  minPasswordLength: number;

  @ApiProperty()
  requireUppercase: boolean;

  @ApiProperty()
  requireLowercase: boolean;

  @ApiProperty()
  requireNumbers: boolean;

  @ApiProperty()
  requireSpecialChars: boolean;

  @ApiProperty()
  enableTwoFactor: boolean;

  @ApiProperty()
  enableBiometric: boolean;

  @ApiProperty()
  requireName: boolean;

  @ApiProperty()
  requireAvatar: boolean;

  @ApiProperty()
  defaultCountryCode: string;

  @ApiProperty()
  defaultCurrency: string;

  @ApiProperty()
  defaultLanguage: string;

  @ApiPropertyOptional()
  termsUrl?: string;

  @ApiPropertyOptional()
  termsUrlAr?: string;

  @ApiPropertyOptional()
  privacyUrl?: string;

  @ApiPropertyOptional()
  privacyUrlAr?: string;

  @ApiProperty()
  requireTermsAcceptance: boolean;

  @ApiProperty()
  loginScreenTitle: string;

  @ApiProperty()
  loginScreenTitleAr: string;

  @ApiProperty()
  registerScreenTitle: string;

  @ApiProperty()
  registerScreenTitleAr: string;

  @ApiPropertyOptional()
  loginBackgroundUrl?: string;

  @ApiPropertyOptional()
  registerBackgroundUrl?: string;
}
