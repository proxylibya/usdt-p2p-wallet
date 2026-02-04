import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

export class SocialLoginDto {
  @ApiProperty({ enum: SocialProvider, description: 'Social provider type' })
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @ApiProperty({ description: 'Social token (ID token or access token)' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
