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
import { v4 as uuidv4 } from 'uuid';

interface BattleQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
}

interface RoomState {
  battleId: string;
  players: Map<string, { socketId: string; displayName: string; score: number; answered: number }>;
  questions: BattleQuestion[];
  startTime: number;
}

interface WaitingPlayer {
  socketId: string;
  userId: string;
  displayName: string;
}

const WORD_POOL: BattleQuestion[] = [
  { word: 'der Hund', correctAnswer: 'köpek', options: ['köpek', 'kedi', 'kuş', 'balık'] },
  { word: 'die Katze', correctAnswer: 'kedi', options: ['kedi', 'köpek', 'fare', 'tavuk'] },
  { word: 'das Haus', correctAnswer: 'ev', options: ['ev', 'okul', 'hastane', 'market'] },
  { word: 'die Schule', correctAnswer: 'okul', options: ['okul', 'ev', 'park', 'hastane'] },
  { word: 'das Wasser', correctAnswer: 'su', options: ['su', 'çay', 'kahve', 'süt'] },
  { word: 'das Brot', correctAnswer: 'ekmek', options: ['ekmek', 'peynir', 'et', 'sebze'] },
  { word: 'die Arbeit', correctAnswer: 'iş', options: ['iş', 'oyun', 'tatil', 'ders'] },
  { word: 'die Zeit', correctAnswer: 'zaman', options: ['zaman', 'para', 'güç', 'hız'] },
  { word: 'der Freund', correctAnswer: 'arkadaş', options: ['arkadaş', 'düşman', 'komşu', 'aile'] },
  { word: 'die Familie', correctAnswer: 'aile', options: ['aile', 'arkadaş', 'komşu', 'sınıf'] },
  { word: 'groß', correctAnswer: 'büyük', options: ['büyük', 'küçük', 'uzun', 'kısa'] },
  { word: 'klein', correctAnswer: 'küçük', options: ['küçük', 'büyük', 'geniş', 'dar'] },
  { word: 'schön', correctAnswer: 'güzel', options: ['güzel', 'çirkin', 'garip', 'normal'] },
  { word: 'schnell', correctAnswer: 'hızlı', options: ['hızlı', 'yavaş', 'gürültülü', 'sessiz'] },
  { word: 'langsam', correctAnswer: 'yavaş', options: ['yavaş', 'hızlı', 'ağır', 'hafif'] },
  { word: 'essen', correctAnswer: 'yemek yemek', options: ['yemek yemek', 'içmek', 'uyumak', 'koşmak'] },
  { word: 'trinken', correctAnswer: 'içmek', options: ['içmek', 'yemek', 'bakmak', 'duymak'] },
  { word: 'schlafen', correctAnswer: 'uyumak', options: ['uyumak', 'oynamak', 'çalışmak', 'gülmek'] },
  { word: 'lernen', correctAnswer: 'öğrenmek', options: ['öğrenmek', 'öğretmek', 'unutmak', 'anlamak'] },
  { word: 'sprechen', correctAnswer: 'konuşmak', options: ['konuşmak', 'yazmak', 'okumak', 'dinlemek'] },
  { word: 'der Bahnhof', correctAnswer: 'tren istasyonu', options: ['tren istasyonu', 'havalimanı', 'otogar', 'liman'] },
  { word: 'das Krankenhaus', correctAnswer: 'hastane', options: ['hastane', 'okul', 'eczane', 'klinik'] },
  { word: 'die Straße', correctAnswer: 'sokak / cadde', options: ['sokak / cadde', 'park', 'köprü', 'tünel'] },
  { word: 'das Auto', correctAnswer: 'araba', options: ['araba', 'bisiklet', 'uçak', 'gemi'] },
  { word: 'der Zug', correctAnswer: 'tren', options: ['tren', 'otobüs', 'taksi', 'metro'] },
];

function pickRandomQuestions(count = 10): BattleQuestion[] {
  const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  private waitingPlayer: WaitingPlayer | null = null;

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
        displayName: payload.displayName ?? payload.email?.split('@')[0] ?? 'Savaşçı',
      });
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const user = this.socketToUser.get(socket.id);
    if (user) {
      // Cancel matchmaking if waiting
      if (this.waitingPlayer?.socketId === socket.id) {
        this.waitingPlayer = null;
      }

      // Remove from active rooms
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

  // ─── Eşleşme bul (gerçek zamanlı matchmaking) ────────────────────────────
  @SubscribeMessage('find_match')
  handleFindMatch(@ConnectedSocket() socket: Socket) {
    const user = this.socketToUser.get(socket.id);
    if (!user) return;

    // Already waiting — ignore duplicate
    if (this.waitingPlayer?.socketId === socket.id) return;

    if (!this.waitingPlayer) {
      // First player — go into queue
      this.waitingPlayer = { socketId: socket.id, userId: user.userId, displayName: user.displayName };
      socket.emit('searching', { message: 'Rakip aranıyor...' });
      return;
    }

    // Second player — pair and start
    const p1 = this.waitingPlayer;
    this.waitingPlayer = null;

    const battleId = uuidv4();
    const questions = pickRandomQuestions(10);

    this.rooms.set(battleId, {
      battleId,
      players: new Map([
        [p1.userId, { socketId: p1.socketId, displayName: p1.displayName, score: 0, answered: 0 }],
        [user.userId, { socketId: socket.id, displayName: user.displayName, score: 0, answered: 0 }],
      ]),
      questions,
      startTime: Date.now(),
    });

    const p1Socket = this.server.sockets.sockets.get(p1.socketId);
    if (p1Socket) p1Socket.join(battleId);
    socket.join(battleId);

    const questionPayload = questions.map(q => ({
      word: q.word,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    // Emit match_found to both with opponent name and questions
    this.server.sockets.sockets.get(p1.socketId)?.emit('match_found', {
      battleId,
      questions: questionPayload,
      opponentName: user.displayName,
    });

    socket.emit('match_found', {
      battleId,
      questions: questionPayload,
      opponentName: p1.displayName,
    });
  }

  // ─── Eşleşme arama iptal ─────────────────────────────────────────────────
  @SubscribeMessage('cancel_search')
  handleCancelSearch(@ConnectedSocket() socket: Socket) {
    if (this.waitingPlayer?.socketId === socket.id) {
      this.waitingPlayer = null;
    }
    socket.emit('search_cancelled');
  }

  // ─── Cevap gönder (gerçek zamanlı, server-side doğrulama) ────────────────
  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { battleId: string; questionIndex: number; answer: string },
  ) {
    const user = this.socketToUser.get(socket.id);
    if (!user) return;

    const room = this.rooms.get(data.battleId);
    if (!room) return;

    const player = room.players.get(user.userId);
    if (!player) return;

    // Server-side answer verification
    const question = room.questions[data.questionIndex];
    const isCorrect = question && data.answer === question.correctAnswer;

    if (isCorrect) player.score++;
    player.answered++;

    // Notify opponent of score update
    socket.to(data.battleId).emit('opponent_score', {
      userId: user.userId,
      score: player.score,
      answered: player.answered,
    });

    // Check if all players finished
    const allDone = [...room.players.values()].every(
      (p) => p.answered >= room.questions.length,
    );

    if (allDone) {
      const scores: Record<string, number> = {};
      for (const [uid, p] of room.players.entries()) {
        scores[uid] = p.score;
      }

      const maxScore = Math.max(...Object.values(scores));
      const winners = Object.entries(scores).filter(([, s]) => s === maxScore);
      const isDraw = winners.length > 1;

      this.server.to(data.battleId).emit('battle_realtime_done', {
        scores,
        isDraw,
        winnerId: isDraw ? null : winners[0][0],
      });

      this.rooms.delete(data.battleId);
    }
  }

  // ─── Hazır bildir ─────────────────────────────────────────────────────────
  @SubscribeMessage('player_ready')
  handleReady(@ConnectedSocket() socket: Socket, @MessageBody() data: { battleId: string }) {
    const user = this.socketToUser.get(socket.id);
    if (!user) return;
    socket.to(data.battleId).emit('opponent_ready', { userId: user.userId });
  }
}
