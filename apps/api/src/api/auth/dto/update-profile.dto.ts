import { IsString, IsOptional, IsEmail, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'User email address', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-2)', example: 'LY' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Preferred currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  preferredCurrency?: string;

  @ApiPropertyOptional({ description: 'Preferred language code', example: 'ar' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  preferredLanguage?: string;
}
