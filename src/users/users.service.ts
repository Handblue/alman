import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async create(data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }): Promise<User> {
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) throw new ConflictException('Bu e-posta adresi zaten kullanımda');

    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) throw new ConflictException('Bu kullanıcı adı zaten kullanımda');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = this.usersRepo.create({
      email: data.email,
      username: data.username.toLowerCase(),
      displayName: data.displayName,
      passwordHash,
    });
    return this.usersRepo.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async save(user: User): Promise<User> {
    return this.usersRepo.save(user);
  }

  async getPublicProfile(id: string) {
    const user = await this.findById(id);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
    };
  }

  async getLeaderboard(type: 'weekly' | 'allTime', requesterId: string) {
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.displayName', 'user.avatar', 'user.xp', 'user.level'])
      .where('user.profileVisibility != :hidden', { hidden: 'private' });

    if (type === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      qb.andWhere('user.updatedAt >= :weekAgo', { weekAgo });
    }

    const users = await qb.orderBy('user.xp', 'DESC').limit(10).getMany();

    const entries = users.map((u, i) => ({
      uid: u.id,
      displayName: u.displayName,
      xp: u.xp,
      level: u.level,
      avatar: u.avatar,
      rank: i + 1,
      isMe: u.id === requesterId,
    }));

    // Get requester's rank
    const allCount = await this.usersRepo.createQueryBuilder('user').getCount();
    const aboveCount = await this.usersRepo
      .createQueryBuilder('user')
      .where('user.xp > (SELECT u2.xp FROM "user" u2 WHERE u2.id = :id)', { id: requesterId })
      .getCount();

    const myRank = aboveCount + 1;

    return { entries, myRank, total: allCount };
  }

  async searchUsers(query: string, excludeId: string) {
    const users = await this.usersRepo
      .createQueryBuilder('user')
      .where(
        '(user.username ILIKE :q OR user.displayName ILIKE :q) AND user.id != :excludeId AND user.profileVisibility != :hidden',
        { q: `%${query}%`, excludeId, hidden: 'private' },
      )
      .select(['user.id', 'user.username', 'user.displayName', 'user.avatar', 'user.level', 'user.xp'])
      .limit(20)
      .getMany();
    return users;
  }

  async updateProfile(id: string, data: Partial<Pick<User, 'displayName' | 'avatar' | 'profileVisibility'>>) {
    await this.usersRepo.update(id, data);
    return this.getPublicProfile(id);
  }
}
