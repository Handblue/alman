import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { BattleGateway } from './battle.gateway';
import { Battle } from './battle.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Battle]),
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'wortkrieg_jwt_very_secret_key_2026_change_this'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers: [BattleService, BattleGateway],
  controllers: [BattleController],
  exports: [BattleService],
})
export class BattleModule {}
