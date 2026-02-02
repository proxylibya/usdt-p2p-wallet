import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateProfileDto,
  SubmitKycDto,
  Enable2FADto,
  Verify2FADto,
  SetSecurityQuestionsDto,
  UserProfileDto,
  UserStatsDto,
  KycStatusDto,
  SecuritySettingsDto,
  Setup2FAResponseDto,
} from './dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async getProfile(@Req() req: Request) {
    return this.usersService.findById(req.user!.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user!.id, body);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, type: UserStatsDto })
  async getStats(@Req() req: Request) {
    return this.usersService.getUserStats(req.user!.id);
  }

  // ========== KYC ==========

  @Get('kyc/status')
  @ApiOperation({ summary: 'Get KYC status' })
  @ApiResponse({ status: 200, type: KycStatusDto })
  async getKycStatus(@Req() req: Request) {
    return this.usersService.getKycStatus(req.user!.id);
  }

  @Post('kyc/submit')
  @ApiOperation({ summary: 'Submit KYC documents' })
  async submitKyc(@Req() req: Request, @Body() body: SubmitKycDto) {
    return this.usersService.submitKyc(req.user!.id, body);
  }

  // ========== SECURITY ==========

  @Get('security')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({ status: 200, type: SecuritySettingsDto })
  async getSecuritySettings(@Req() req: Request) {
    return this.usersService.getSecuritySettings(req.user!.id);
  }

  @Post('security/2fa/setup')
  @ApiOperation({ summary: 'Setup 2FA - get secret and QR code' })
  @ApiResponse({ status: 200, type: Setup2FAResponseDto })
  async setup2FA(@Req() req: Request) {
    return this.usersService.setup2FA(req.user!.id);
  }

  @Post('security/2fa/enable')
  @ApiOperation({ summary: 'Enable 2FA with secret' })
  async enable2FA(@Req() req: Request, @Body() body: Enable2FADto) {
    return this.usersService.enable2FA(req.user!.id, body.secret);
  }

  @Post('security/2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA code' })
  async verify2FA(@Req() req: Request, @Body() body: Verify2FADto) {
    return this.usersService.verify2FA(req.user!.id, body.code);
  }

  @Post('security/2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable2FA(@Req() req: Request) {
    return this.usersService.disable2FA(req.user!.id);
  }

  @Post('security/questions')
  @ApiOperation({ summary: 'Set security questions' })
  async setSecurityQuestions(@Req() req: Request, @Body() body: SetSecurityQuestionsDto) {
    return this.usersService.setSecurityQuestions(req.user!.id, body.questions);
  }
}
