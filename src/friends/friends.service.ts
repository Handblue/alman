import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest } from './friend-request.entity';
import { Friendship } from './friendship.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private requestsRepo: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private friendshipsRepo: Repository<Friendship>,
    private usersService: UsersService,
  ) {}

  async sendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Kendinize arkadaşlık isteği gönderemezsiniz');
    }

    // Hedef kullanıcı var mı?
    await this.usersService.findById(toUserId);

    // Zaten arkadaş mı?
    const existing = await this.friendshipsRepo.findOne({
      where: [
        { userId: fromUserId, friendId: toUserId },
        { userId: toUserId, friendId: fromUserId },
      ],
    });
    if (existing) throw new BadRequestException('Bu kullanıcı zaten arkadaşınız');

    // Bekleyen istek var mı?
    const pendingRequest = await this.requestsRepo.findOne({
      where: { fromUserId, toUserId, status: 'pending' },
    });
    if (pendingRequest) throw new BadRequestException('Bu kullanıcıya zaten istek gönderildi');

    const request = this.requestsRepo.create({ fromUserId, toUserId });
    await this.requestsRepo.save(request);
    return { message: 'Arkadaşlık isteği gönderildi' };
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.requestsRepo.findOne({
      where: { id: requestId, toUserId: userId, status: 'pending' },
    });
    if (!request) throw new NotFoundException('İstek bulunamadı');

    request.status = 'accepted';
    await this.requestsRepo.save(request);

    // Çift yönlü arkadaşlık kaydı oluştur
    await this.friendshipsRepo.save([
      this.friendshipsRepo.create({ userId: request.fromUserId, friendId: request.toUserId }),
      this.friendshipsRepo.create({ userId: request.toUserId, friendId: request.fromUserId }),
    ]);

    return { message: 'Arkadaşlık isteği kabul edildi' };
  }

  async declineRequest(requestId: string, userId: string) {
    const request = await this.requestsRepo.findOne({
      where: { id: requestId, toUserId: userId, status: 'pending' },
    });
    if (!request) throw new NotFoundException('İstek bulunamadı');

    request.status = 'declined';
    await this.requestsRepo.save(request);
    return { message: 'Arkadaşlık isteği reddedildi' };
  }

  async removeFriend(userId: string, friendId: string) {
    await this.friendshipsRepo.delete({ userId, friendId });
    await this.friendshipsRepo.delete({ userId: friendId, friendId: userId });
    return { message: 'Arkadaşlıktan çıkarıldı' };
  }

  async getFriends(userId: string) {
    const friendships = await this.friendshipsRepo.find({
      where: { userId },
      relations: ['friend'],
    });

    return friendships.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      displayName: f.friend.displayName,
      avatar: f.friend.avatar,
      xp: f.friend.xp,
      level: f.friend.level,
      streak: f.friend.streak,
      since: f.createdAt,
    }));
  }

  async getPendingRequests(userId: string) {
    const requests = await this.requestsRepo.find({
      where: { toUserId: userId, status: 'pending' },
      relations: ['fromUser'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((r) => ({
      id: r.id,
      from: {
        id: r.fromUser.id,
        username: r.fromUser.username,
        displayName: r.fromUser.displayName,
        avatar: r.fromUser.avatar,
        level: r.fromUser.level,
      },
      createdAt: r.createdAt,
    }));
  }

  async getSentRequests(userId: string) {
    const requests = await this.requestsRepo.find({
      where: { fromUserId: userId, status: 'pending' },
      relations: ['toUser'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((r) => ({
      id: r.id,
      to: {
        id: r.toUser.id,
        username: r.toUser.username,
        displayName: r.toUser.displayName,
        avatar: r.toUser.avatar,
      },
      createdAt: r.createdAt,
    }));
  }
}
