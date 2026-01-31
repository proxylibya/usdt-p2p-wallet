import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+218912345678', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ example: 'Ahmed Ali', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase, one lowercase and one number',
  })
  password: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'LY', description: 'Country code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  countryCode?: string;
}

export class RegisterResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  otpSent: boolean;
}
