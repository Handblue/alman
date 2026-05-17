import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../common/mail.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async register(data: {
    email: string;
    username?: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    const skipEmailVerification = process.env.SKIP_EMAIL_VERIFY === 'true';

    const user = await this.usersService.create({
      email: data.email.toLowerCase().trim(),
      username: data.username || data.email.split('@')[0],
      displayName,
      password: data.password,
    });

    if (skipEmailVerification) {
      // Domain hazır olmadığında: direkt doğrulanmış say, JWT döndür
      user.isEmailVerified = true;
      await this.usersService.save(user);
      const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
      return {
        message: 'Kayıt başarılı! Hoş geldin.',
        userId: user.id,
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          plan: user.plan,
        },
      };
    }

    // E-posta doğrulama token'ı oluştur
    const token = this.generateToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    user.emailVerificationToken = token;
    user.emailVerificationExpiry = expiry;
    await this.usersService.save(user);

    // Doğrulama e-postası gönder
    try {
      await this.mailService.sendVerificationEmail(user.email, displayName, token);
    } catch (err: any) {
      console.error('E-posta gönderilemedi:', err.message);
    }

    return {
      message: 'Kayıt başarılı! E-posta adresinize doğrulama linki gönderildi.',
      userId: user.id,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) throw new UnauthorizedException('E-posta veya şifre hatalı');

    const valid = await this.usersService.validatePassword(user, password);
    if (!valid) throw new UnauthorizedException('E-posta veya şifre hatalı');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Lütfen önce e-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        plan: user.plan,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.findUserByVerificationToken(token);
    if (!user) throw new BadRequestException('Geçersiz veya süresi dolmuş doğrulama linki');

    if (user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Doğrulama linkinin süresi dolmuş. Yeni link isteyin.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await this.usersService.save(user);

    // JWT token oluştur ve otomatik giriş yaptır
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      message: 'E-posta adresi başarıyla doğrulandı!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        xp: user.xp,
        level: user.level,
      },
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) throw new NotFoundException('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı');
    if (user.isEmailVerified) throw new BadRequestException('Bu hesap zaten doğrulanmış');

    const token = this.generateToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    user.emailVerificationToken = token;
    user.emailVerificationExpiry = expiry;
    await this.usersService.save(user);

    try {
      await this.mailService.sendVerificationEmail(user.email, user.displayName, token);
    } catch (err: any) {
      console.error('Doğrulama e-postası gönderilemedi:', err.message);
    }
    return { message: 'Doğrulama e-postası gönderildi (varsa gelen kutunuzu kontrol edin).' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    // Güvenlik: kullanıcı yoksa da başarı mesajı döndür
    if (!user) return { message: 'Eğer bu e-posta kayıtlıysa, sıfırlama linki gönderildi.' };

    const token = this.generateToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpiry = expiry;
    await this.usersService.save(user);

    try {
      await this.mailService.sendPasswordResetEmail(user.email, user.displayName, token);
    } catch (err: any) {
      console.error('Şifre sıfırlama e-postası gönderilemedi:', err.message);
    }

    return { message: 'Eğer bu e-posta kayıtlıysa, sıfırlama linki gönderildi.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.findUserByResetToken(token);
    if (!user) throw new BadRequestException('Geçersiz veya süresi dolmuş sıfırlama linki');

    if (user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Sıfırlama linkinin süresi dolmuş. Yeni link isteyin.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Şifre en az 6 karakter olmalıdır');
    }

    const bcrypt = await import('bcrypt');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await this.usersService.save(user);

    return { message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.' };
  }

  private async findUserByVerificationToken(token: string): Promise<User | null> {
    return (this.usersService as any).usersRepo.findOne({
      where: { emailVerificationToken: token },
    });
  }

  private async findUserByResetToken(token: string): Promise<User | null> {
    return (this.usersService as any).usersRepo.findOne({
      where: { passwordResetToken: token },
    });
  }
}
