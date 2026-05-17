import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('battle')
@Controller('battle')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Post('challenge/:userId')
  @ApiOperation({ summary: 'Arkadaşa meydan oku (async battle başlat)' })
  async challenge(@Request() req, @Param('userId') userId: string) {
    return this.battleService.challenge(req.user.id, userId);
  }

  @Post('challenge-open')
  @ApiOperation({ summary: 'Açık meydan okuma (herhangi biri cevaplayabilir)' })
  async challengeOpen(@Request() req) {
    return this.battleService.challenge(req.user.id, null);
  }

  @Get('questions/:battleId')
  @ApiOperation({ summary: 'Battle sorularını getir' })
  async getQuestions(@Request() req, @Param('battleId') battleId: string) {
    return this.battleService.getQuestions(battleId, req.user.id);
  }

  @Post(':battleId/answer-p1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Player 1 cevaplarını kaydet' })
  async submitP1(
    @Request() req,
    @Param('battleId') battleId: string,
    @Body() body: { answers: { questionIndex: number; answer: string; timeMs: number }[] },
  ) {
    return this.battleService.submitPlayer1Answers(battleId, req.user.id, body.answers);
  }

  @Post(':battleId/answer-p2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Player 2 cevaplarını kaydet + sonuç' })
  async submitP2(
    @Request() req,
    @Param('battleId') battleId: string,
    @Body() body: { answers: { questionIndex: number; answer: string; timeMs: number }[] },
  ) {
    return this.battleService.submitPlayer2Answers(battleId, req.user.id, body.answers);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Beni bekleyen battle\'lar (cevaplanmamış)' })
  async getPending(@Request() req) {
    return this.battleService.getPendingBattles(req.user.id);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Gönderdiğim ve rakip cevabı beklenen battle\'lar' })
  async getSent(@Request() req) {
    return this.battleService.getSentBattles(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Battle geçmişi' })
  async getHistory(@Request() req) {
    return this.battleService.getHistory(req.user.id);
  }

  @Get('result/:battleId')
  @ApiOperation({ summary: 'Battle sonuç detayı' })
  async getResult(@Request() req, @Param('battleId') battleId: string) {
    return this.battleService.getResult(battleId, req.user.id);
  }
}
