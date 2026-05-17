import { authService } from './authService';

const WS_BASE = 'ws://45.143.11.97';

export interface BattleQuestion {
  word: string;
  options: string[];
  correctAnswer: string;
}

export interface BattleChallenge {
  id: string;
  challenger: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    level: number;
  };
  questionCount: number;
  opponentScore: number;
  expiresAt: string;
  createdAt: string;
}

export interface BattleResult {
  score: number;
  opponentScore: number;
  total: number;
  winnerId: string | null;
  isWinner: boolean;
  isDraw: boolean;
  xpGain: number;
  myElo: number;
  eloDelta: number;
  correctAnswers: number;
  message: string;
}

export interface BattleAnswer {
  questionIndex: number;
  answer: string;
  timeMs: number;
}

class BattleApiService {
  // ─── Arkadaşa meydan oku ─────────────────────────────────────────────────
  async challengeFriend(friendId: string): Promise<{ battleId: string; message: string }> {
    const res = await authService.authFetch(`/battle/challenge/${friendId}`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Meydan okuma gönderilemedi');
    return json;
  }

  // ─── Açık meydan okuma (herkes cevaplayabilir) ───────────────────────────
  async challengeOpen(): Promise<{ battleId: string; message: string }> {
    const res = await authService.authFetch('/battle/challenge-open', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Meydan okuma oluşturulamadı');
    return json;
  }

  // ─── Soruları getir ───────────────────────────────────────────────────────
  async getQuestions(battleId: string): Promise<{
    battleId: string;
    questionCount: number;
    questions: BattleQuestion[];
    timePerQuestion: number;
  }> {
    const res = await authService.authFetch(`/battle/questions/${battleId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Sorular yüklenemedi');
    return json;
  }

  // ─── Player 1 cevaplarını gönder ─────────────────────────────────────────
  async submitAsChallenger(battleId: string, answers: BattleAnswer[]) {
    const res = await authService.authFetch(`/battle/${battleId}/answer-p1`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Cevaplar gönderilemedi');
    return json;
  }

  // ─── Player 2 cevaplarını gönder + sonuç al ──────────────────────────────
  async submitAsChallengee(battleId: string, answers: BattleAnswer[]): Promise<BattleResult> {
    const res = await authService.authFetch(`/battle/${battleId}/answer-p2`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Cevaplar gönderilemedi');
    return json;
  }

  // ─── Bekleyen battle'lar (cevaplamam gereken) ────────────────────────────
  async getPending(): Promise<BattleChallenge[]> {
    const res = await authService.authFetch('/battle/pending');
    if (!res.ok) return [];
    return res.json();
  }

  // ─── Gönderdiğim ve beklediğim battle'lar ────────────────────────────────
  async getSent(): Promise<any[]> {
    const res = await authService.authFetch('/battle/sent');
    if (!res.ok) return [];
    return res.json();
  }

  // ─── Battle geçmişi ───────────────────────────────────────────────────────
  async getHistory(): Promise<any[]> {
    const res = await authService.authFetch('/battle/history');
    if (!res.ok) return [];
    return res.json();
  }

  // ─── Sonuç detayı ─────────────────────────────────────────────────────────
  async getResult(battleId: string) {
    const res = await authService.authFetch(`/battle/result/${battleId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Sonuç yüklenemedi');
    return json;
  }
}

export const battleApiService = new BattleApiService();
