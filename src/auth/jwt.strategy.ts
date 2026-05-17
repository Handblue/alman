import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'wortkrieg_jwt_secret_change_in_prod'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    try {
      const user = await this.usersService.findById(payload.sub);
      return { id: user.id, email: user.email, username: user.username };
    } catch {
      throw new UnauthorizedException('Geçersiz token');
    }
  }
}
