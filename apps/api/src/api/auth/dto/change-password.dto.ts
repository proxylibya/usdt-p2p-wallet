import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase, one lowercase and one number',
  })
  newPassword: string;
}

export class VerifyOtpRequestDto {
  @ApiProperty({ example: '+218912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'login', enum: ['login', 'register'] })
  @IsString()
  @IsNotEmpty()
  type: 'login' | 'register';
}

export class ResendOtpDto {
  @ApiProperty({ example: '+218912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'login', enum: ['login', 'register'] })
  @IsString()
  @IsNotEmpty()
  type: 'login' | 'register';
}
