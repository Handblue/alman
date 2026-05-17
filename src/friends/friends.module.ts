import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendRequest } from './friend-request.entity';
import { Friendship } from './friendship.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequest, Friendship]), UsersModule],
  providers: [FriendsService],
  controllers: [FriendsController],
})
export class FriendsModule {}
