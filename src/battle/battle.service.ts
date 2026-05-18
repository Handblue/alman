import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or, MoreThan } from 'typeorm';
import { Battle, BattleQuestion, PlayerAnswers, BattleStatus } from './battle.entity';
import { UsersService } from '../users/users.service';

// Sabit kelime havuzu — gerçek uygulamada DB'den gelir
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

@Injectable()
export class BattleService {
  constructor(
    @InjectRepository(Battle)
    private battleRepo: Repository<Battle>,
    private usersService: UsersService,
  ) {}

  // ─── Yeni battle meydan okuması gönder ────────────────────────────────────
  async challenge(challengerId: string, challengedId: string | null) {
    if (challengedId && challengerId === challengedId) {
      throw new BadRequestException('Kendinize meydan okuması gönderemezsiniz');
    }

    if (challengedId) {
      await this.usersService.findById(challengedId); // var mı kontrol
    }

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 72); // 72 saat süresi

    const battle = this.battleRepo.create({
      challengerId,
      challengedId: challengedId ?? null,
      status: 'pending',
      type: challengedId ? 'async' : 'async',
      questions: pickRandomQuestions(10),
      expiresAt: expiry,
    });

    const saved = await this.battleRepo.save(battle);

    // Send push notification to challenged user
    if (challengedId) {
      const [challenger, pushToken] = await Promise.all([
        this.usersService.findById(challengerId),
        this.usersService.getPushToken(challengedId),
      ]);
      if (pushToken) {
        await this.usersService.sendPushNotification(
          pushToken,
          '⚔️ Yeni Meydan Okuma!',
          `${challenger.displayName} seni battle'a çağırıyor!`,
          { type: 'battle_challenge', battleId: saved.id },
        );
      }
    }

    return { battleId: saved.id, message: 'Meydan okuma gönderildi!' };
  }

  // ─── Player 1 cevaplarını kaydet ──────────────────────────────────────────
  async submitPlayer1Answers(
    battleId: string,
    userId: string,
    answers: { questionIndex: number; answer: string; timeMs: number }[],
  ) {
    const battle = await this.battleRepo.findOne({ where: { id: battleId } });
    if (!battle) throw new NotFoundException('Battle bulunamadı');
    if (battle.challengerId !== userId) throw new ForbiddenException('Bu battle size ait değil');
    if (battle.status !== 'pending') throw new BadRequestException('Bu battle zaten başlandı veya bitti');

    const scored = this.scoreAnswers(answers, battle.questions);
    battle.player1Answers = scored;
    battle.player1Score = scored.score;
    battle.status = 'p1_done';
    await this.battleRepo.save(battle);

    return {
      score: scored.score,
      total: battle.questions.length,
      message: 'Cevaplarınız kaydedildi! Rakibinizin oynaması bekleniyor.',
    };
  }

  // ─── Player 2 cevaplarını kaydet + sonuç belirle ──────────────────────────
  async submitPlayer2Answers(
    battleId: string,
    userId: string,
    answers: { questionIndex: number; answer: string; timeMs: number }[],
  ) {
    const battle = await this.battleRepo.findOne({
      where: { id: battleId },
      relations: ['challenger', 'challenged'],
    });
    if (!battle) throw new NotFoundException('Battle bulunamadı');

    // Player 2 ya davet edilen kişi ya da herhangi bir kullanıcı (ranked modunda)
    if (battle.challengedId && battle.challengedId !== userId) {
      throw new ForbiddenException('Bu battle size ait değil');
    }
    if (battle.challengedId === null) {
      // Ranked: herkes cevaplayabilir ama challenger olamaz
      if (battle.challengerId === userId) {
        throw new ForbiddenException('Kendi meydan okumanızı cevaplayamazsınız');
      }
      battle.challengedId = userId;
    }
    if (battle.status !== 'p1_done') {
      throw new BadRequestException('Bu battle için henüz Player 1 cevaplamamış');
    }

    const scored = this.scoreAnswers(answers, battle.questions);
    battle.player2Answers = scored;
    battle.player2Score = scored.score;
    battle.status = 'completed';

    // Kazananı belirle
    if (battle.player1Score > battle.player2Score) {
      battle.winnerId = battle.challengerId;
    } else if (battle.player2Score > battle.player1Score) {
      battle.winnerId = userId;
    } else {
      battle.winnerId = null; // berabere
    }

    await this.battleRepo.save(battle);

    // ELO + XP hesapla (sunucu-otoritatif)
    const isWinner = battle.winnerId === userId;
    const isDraw = battle.winnerId === null;
    const xpGain = isWinner ? 200 : 50;

    const p1 = await this.usersService.findById(battle.challengerId);
    const p2 = await this.usersService.findById(userId);
    const oldP2Elo = p2.elo;
    // scoreA = 1 means p1 (challenger) won; scoreA = 0 means p2 won
    const scoreA = isDraw ? 0.5 : (isWinner ? 0 : 1);
    const { newEloA, newEloB } = this.calculateElo(p1.elo, p2.elo, scoreA);

    p1.elo = newEloA;
    p2.elo = newEloB;
    p1.xp += isDraw ? 50 : (isWinner ? 50 : 200);
    p2.xp += xpGain;
    if (isDraw) { p1.battleDraws++; p2.battleDraws++; }
    else if (isWinner) { p2.battleWins++; p1.battleLosses++; }
    else { p1.battleWins++; p2.battleLosses++; }

    await Promise.all([this.usersService.save(p1), this.usersService.save(p2)]);

    return {
      score: scored.score,
      opponentScore: battle.player1Score,
      total: battle.questions.length,
      winnerId: battle.winnerId,
      isWinner,
      isDraw,
      xpGain,
      myElo: newEloB,
      eloDelta: newEloB - oldP2Elo,
      correctAnswers: scored.answers.filter((a) => a.correct).length,
      message: isDraw
        ? 'Berabere! İyi mücadele.'
        : isWinner
          ? `Kazandınız! +${xpGain} XP`
          : `Kaybettiniz. +${xpGain} XP (katılım)`,
    };
  }

  // ─── Bekleyen battle'ları getir (oynanmamış, p1_done, süresi dolmamış) ────
  async getPendingBattles(userId: string) {
    const now = new Date();
    const pending = await this.battleRepo.find({
      where: [
        { challengedId: userId, status: 'p1_done', expiresAt: MoreThan(now) },
      ],
      relations: ['challenger'],
      order: { createdAt: 'DESC' },
    });

    return pending.map((b) => ({
      id: b.id,
      challenger: {
        id: b.challenger.id,
        displayName: b.challenger.displayName,
        username: b.challenger.username,
        avatar: b.challenger.avatar,
        level: b.challenger.level,
      },
      questionCount: b.questions.length,
      opponentScore: b.player1Score,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    }));
  }

  // ─── Kendi gönderdiğim ve rakibin cevabını beklediğim battle'lar ──────────
  async getSentBattles(userId: string) {
    const now = new Date();
    const sent = await this.battleRepo.find({
      where: { challengerId: userId, status: 'p1_done', expiresAt: MoreThan(now) },
      relations: ['challenged'],
      order: { createdAt: 'DESC' },
    });

    return sent.map((b) => ({
      id: b.id,
      challenged: b.challenged ? {
        id: b.challenged.id,
        displayName: b.challenged.displayName,
        username: b.challenged.username,
      } : null,
      myScore: b.player1Score,
      status: b.status,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    }));
  }

  // ─── Tüm battle geçmişi ───────────────────────────────────────────────────
  async getHistory(userId: string) {
    const battles = await this.battleRepo.find({
      where: [
        { challengerId: userId, status: 'completed' },
        { challengedId: userId, status: 'completed' },
      ],
      relations: ['challenger', 'challenged'],
      order: { updatedAt: 'DESC' },
      take: 50,
    });

    return battles.map((b) => {
      const isChallenger = b.challengerId === userId;
      const myScore = isChallenger ? b.player1Score : b.player2Score;
      const theirScore = isChallenger ? b.player2Score : b.player1Score;
      const opponent = isChallenger ? b.challenged : b.challenger;

      return {
        id: b.id,
        opponent: opponent ? {
          id: opponent.id,
          displayName: opponent.displayName,
          username: opponent.username,
        } : null,
        myScore,
        theirScore,
        isWinner: b.winnerId === userId,
        isDraw: b.winnerId === null,
        completedAt: b.updatedAt,
      };
    });
  }

  // ─── Battle sorularını getir (oynamadan önce) ─────────────────────────────
  async getQuestions(battleId: string, userId: string) {
    const battle = await this.battleRepo.findOne({ where: { id: battleId } });
    if (!battle) throw new NotFoundException('Battle bulunamadı');

    const isChallenger = battle.challengerId === userId;
    const isChallenged = battle.challengedId === userId || battle.challengedId === null;

    if (!isChallenger && !isChallenged) {
      throw new ForbiddenException('Bu battle size ait değil');
    }

    // Zaten oynadıysa soruları gösterme
    if (isChallenger && battle.player1Answers) {
      throw new BadRequestException('Bu battle\'ı zaten oynadınız');
    }
    if (!isChallenger && battle.player2Answers) {
      throw new BadRequestException('Bu battle\'ı zaten oynadınız');
    }

    // Şıkları shuffle et (her seferinde farklı sıra)
    const questions = battle.questions.map((q) => ({
      word: q.word,
      options: [...q.options].sort(() => Math.random() - 0.5),
      correctAnswer: q.correctAnswer,
    }));

    return {
      battleId: battle.id,
      questionCount: questions.length,
      questions,
      timePerQuestion: 10000, // 10 saniye
    };
  }

  // ─── Sonuç detayı ─────────────────────────────────────────────────────────
  async getResult(battleId: string, userId: string) {
    const battle = await this.battleRepo.findOne({
      where: { id: battleId },
      relations: ['challenger', 'challenged'],
    });
    if (!battle) throw new NotFoundException('Battle bulunamadı');
    if (battle.status !== 'completed') throw new BadRequestException('Battle henüz tamamlanmadı');

    const isChallenger = battle.challengerId === userId;
    const myAnswers = isChallenger ? battle.player1Answers : battle.player2Answers;
    const theirAnswers = isChallenger ? battle.player2Answers : battle.player1Answers;
    const myScore = isChallenger ? battle.player1Score : battle.player2Score;
    const theirScore = isChallenger ? battle.player2Score : battle.player1Score;
    const opponent = isChallenger ? battle.challenged : battle.challenger;

    return {
      battleId: battle.id,
      myScore,
      theirScore,
      isWinner: battle.winnerId === userId,
      isDraw: battle.winnerId === null,
      opponent: { id: opponent?.id, displayName: opponent?.displayName },
      questions: battle.questions.map((q, i) => ({
        word: q.word,
        correctAnswer: q.correctAnswer,
        myAnswer: myAnswers?.answers[i]?.answer ?? null,
        myCorrect: myAnswers?.answers[i]?.correct ?? false,
        theirAnswer: theirAnswers?.answers[i]?.answer ?? null,
        theirCorrect: theirAnswers?.answers[i]?.correct ?? false,
      })),
    };
  }

  // ─── Skor hesapla ─────────────────────────────────────────────────────────
  // scoreA: 1 = A kazandı, 0 = B kazandı, 0.5 = berabere
  private calculateElo(eloA: number, eloB: number, scoreA: number) {
    const K = 32;
    const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const expectedB = 1 - expectedA;
    return {
      newEloA: Math.round(eloA + K * (scoreA - expectedA)),
      newEloB: Math.round(eloB + K * ((1 - scoreA) - expectedB)),
    };
  }

  private scoreAnswers(
    answers: { questionIndex: number; answer: string; timeMs: number }[],
    questions: BattleQuestion[],
  ): PlayerAnswers {
    let score = 0;
    const scored = answers.map((a) => {
      const q = questions[a.questionIndex];
      const correct = q && a.answer === q.correctAnswer;
      if (correct) score++;
      return { questionIndex: a.questionIndex, answer: a.answer, correct: !!correct, timeMs: a.timeMs };
    });

    return { answers: scored, score, completedAt: new Date().toISOString() };
  }
}
