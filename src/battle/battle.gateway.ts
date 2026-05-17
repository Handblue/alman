import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface RoomState {
  battleId: string;
  players: Map<string, { socketId: string; displayName: string; score: number; answered: number }>;
  questionCount: number;
  startTime: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/battle',
})
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, RoomState>();
  private socketToUser = new Map<string, { userId: string; displayName: string }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) { socket.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET', 'wortkrieg_jwt_very_secret_key_2026_change_this'),
      });

      this.socketToUser.set(socket.id, {
        userId: payload.sub,
        displayName: payload.email?.split('@')[0] ?? 'Savaşçı',
      });
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const user = this.socketToUser.get(socket.id);
    if (user) {
      // Aktif room'lardan çıkar
      for (const [battleId, room] of this.rooms.entries()) {
        if (room.players.has(user.userId)) {
          room.players.delete(user.userId);
          this.server.to(battleId).emit('player_disconnected', { userId: user.userId });
          if (room.players.size === 0) this.rooms.delete(battleId);
        }
      }
    }
    this.socketToUser.delete(socket.id);
  }

  // ─── Odaya katıl ──────────────────────────────────────────────────────────
  @SubscribeMessage('join_battle')
  handleJoin(@ConnectedSocket() socket: Socket, @MessageBody() data: { battleId: string; displayName: string; questionCount: number }) {
    const user = this.socketToUser.get(socket.id);
    if (!user) return;

    socket.join(data.battleId);

    if (!this.rooms.has(data.battleId)) {
      this.rooms.set(data.battleId, {
        battleId: data.battleId,
        players: new Map(),
        questionCount: data.questionCount,
        startTime: Date.now(),
      });
    }

    const room = this.rooms.get(data.battleId)!;
    const displayName = data.displayName || user.displayName;

    room.players.set(user.userId, {
      socketId: socket.id,
      displayName,
      score: 0,
      answered: 0,
    });

    // Odadaki herkese bildir
    this.server.to(data.battleId).emit('player_joined', {
      userId: user.userId,
      displayName,
      playerCount: room.players.size,
    });

    // İki oyuncu varsa başlat
    if (room.players.size === 2) {
      this.server.to(data.battleId).emit('battle_start', {
        message: 'Her iki oyuncu bağlandı! Başlıyor...',
      });
    }
  }

  // ─── Cevap gönder (gerçek zamanlı) ───────────────────────────────────────
  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { battleId: string; questionIndex: number; correct: boolean },
  ) {
    const user = this.socketToUser.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(data.battleId);
    if (!room) return;

    const player = room.players.get(user.userId);
    if (!player) return;

    if (data.correct) player.score++;
    player.answered++;

    // Rakibe skor güncellemesi gönder
    socket.to(data.battleId).emit('opponent_score', {
      userId: user.userId,
      score: player.score,
      answered: player.answered,
    });

    // İkisi de bitirdiyse
    const allDone = [...room.players.values()].every(
      (p) => p.answered >= room.questionCount,
    );

    if (allDone) {
      const scores = [...room.players.entries()].map(([uid, p]) => ({
        userId: uid,
        displayName: p.displayName,
        score: p.score,
      }));
      const maxScore = Math.max(...scores.map((s) => s.score));
      const winners = scores.filter((s) => s.score === maxScore);
      const isDraw = winners.length > 1;

      this.server.to(data.battleId).emit('battle_realtime_done', {
        scores,
        isDraw,
        winnerId: isDraw ? null : winners[0].userId,
      });

      this.rooms.delete(data.battleId);
    }
  }

  // ─── Bir oyuncunun hazır olduğunu bildir ─────────────────────────────────
  @SubscribeMessage('player_ready')
  handleReady(@ConnectedSocket() socket: Socket, @MessageBody() data: { battleId: string }) {
    const user = this.socketToUser.get(socket.id);
    if (!user) return;
    socket.to(data.battleId).emit('opponent_ready', { userId: user.userId });
  }
}
