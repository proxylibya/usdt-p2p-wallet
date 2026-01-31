import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EidyaService } from './eidya.service';
import { CreateEidyaDto, ClaimEidyaDto } from './dto/eidya.dto';

@ApiTags('Eidya')
@Controller('eidya')
export class EidyaController {
  constructor(private readonly eidyaService: EidyaService) {}

  @Post('create')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new Eidya (Gift) link' })
  createEidya(@Request() req: any, @Body() dto: CreateEidyaDto) {
    return this.eidyaService.createEidya(req.user.sub, dto);
  }

  @Post('claim')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Claim an Eidya using a code' })
  claimEidya(@Request() req: any, @Body() dto: ClaimEidyaDto) {
    return this.eidyaService.claimEidya(req.user.sub, dto.code);
  }

  @Get('info/:code')
  @ApiOperation({ summary: 'Get Eidya info by code (Public)' })
  getEidyaInfo(@Param('code') code: string) {
    return this.eidyaService.getEidyaByCode(code);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user Eidya history (created & claimed)' })
  getHistory(@Request() req: any) {
    return this.eidyaService.getUserHistory(req.user.sub);
  }
}
