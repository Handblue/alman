import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Arkadaş listesini getir' })
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('requests/incoming')
  @ApiOperation({ summary: 'Gelen arkadaşlık istekleri' })
  async getPendingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Gönderilen arkadaşlık istekleri' })
  async getSentRequests(@Request() req) {
    return this.friendsService.getSentRequests(req.user.id);
  }

  @Post('request/:toUserId')
  @ApiOperation({ summary: 'Arkadaşlık isteği gönder' })
  async sendRequest(@Request() req, @Param('toUserId') toUserId: string) {
    return this.friendsService.sendRequest(req.user.id, toUserId);
  }

  @Post('accept/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arkadaşlık isteğini kabul et' })
  async acceptRequest(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.acceptRequest(requestId, req.user.id);
  }

  @Post('decline/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arkadaşlık isteğini reddet' })
  async declineRequest(@Request() req, @Param('requestId') requestId: string) {
    return this.friendsService.declineRequest(requestId, req.user.id);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Arkadaşlıktan çıkar' })
  async removeFriend(@Request() req, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }
}
