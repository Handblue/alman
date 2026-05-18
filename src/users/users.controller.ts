import { Controller, Get, Patch, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(@Request() req) {
    return this.usersService.getPublicProfile(req.user.id);
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getLeaderboard(@Query('type') type: 'weekly' | 'allTime' = 'allTime', @Request() req) {
    return this.usersService.getLeaderboard(type, req.user.id);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async search(@Query('q') q: string, @Request() req) {
    if (!q || q.length < 2) return [];
    return this.usersService.searchUsers(q, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUser(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async savePushToken(@Request() req, @Body() body: { token: string }) {
    return this.usersService.savePushToken(req.user.id, body.token);
  }

  @Patch('me/plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updatePlan(@Request() req, @Body() body: { plan: string; expiresAt?: string }) {
    return this.usersService.updatePlan(req.user.id, body.plan, body.expiresAt);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMe(
    @Request() req,
    @Body() body: { displayName?: string; avatar?: string; profileVisibility?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }
}
