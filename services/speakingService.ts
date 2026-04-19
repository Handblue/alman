import { createStorage } from '@/utils/storage';

const storage = createStorage('speaking-service');

export interface SpeakingMatch {
  sessionId: string;
  partnerName: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  startedAt: string;
  durationMinutes: number;
}

export interface SpeakingSessionReview {
  selfRating: number;
  partnerRating: number;
  notes?: string;
}

export interface SpeakingSessionRecord extends SpeakingMatch {
  review?: SpeakingSessionReview;
  completedAt?: string;
  xpEarned?: number;
}

const TOPICS = [
  'Almanya’da ilk günün nasıl geçti?',
  'Bugün öğrendiğin üç kelimeyi örnekle açıkla.',
  'Bir market alışverişi diyalogu canlandır.',
  'Telc sınavında kendini tanıtma pratiği yap.',
  'Goethe konuşma bölümünde şehir hayatını tartış.',
];

const PARTNERS = ['Anna', 'Lukas', 'Mira', 'Felix', 'Sophie', 'Tobias'];

class SpeakingService {
  private creditsKey = 'credits';
  private sessionsKey = 'sessions';
  private activeSessionKey = 'active-session';

  getCredits(): number {
    return storage.getNumber(this.creditsKey) ?? 0;
  }

  addCredits(minutes: number, reason: string): number {
    const nextValue = this.getCredits() + minutes;
    storage.set(this.creditsKey, nextValue);
    storage.set(`reason:${Date.now()}`, JSON.stringify({ minutes, reason }));
    return nextValue;
  }

  ensurePremiumDailyBonus(isPremium: boolean): number {
    if (!isPremium) return this.getCredits();

    const today = new Date().toISOString().split('T')[0];
    const bonusKey = `premium-bonus:${today}`;
    if (storage.getBoolean(bonusKey)) {
      return this.getCredits();
    }

    storage.set(bonusKey, true);
    return this.addCredits(3, 'Premium günlük bonus');
  }

  awardBattleWinCredits(battleId: string, didWin: boolean): number {
    if (!didWin || storage.getBoolean(`battle-credit:${battleId}`)) {
      return this.getCredits();
    }

    storage.set(`battle-credit:${battleId}`, true);
    return this.addCredits(3, 'Ranked battle galibiyeti');
  }

  awardDailyChallengeBonus(date: string, correctCount: number, totalCount: number): number {
    const key = `daily-challenge-credit:${date}`;
    if (correctCount !== totalCount || storage.getBoolean(key)) {
      return this.getCredits();
    }

    storage.set(key, true);
    return this.addCredits(1, 'Günlük challenge 5/5 bonusu');
  }

  canStartSession(requiredMinutes: number = 7): boolean {
    return this.getCredits() >= requiredMinutes;
  }

  startMatch(level: SpeakingMatch['level'] = 'A2'): SpeakingMatch {
    if (!this.canStartSession()) {
      throw new Error('Konuşma başlatmak için en az 7 dakika gerekiyor');
    }

    const session: SpeakingMatch = {
      sessionId: `speaking_${Date.now()}`,
      partnerName: PARTNERS[Math.floor(Math.random() * PARTNERS.length)],
      topic: TOPICS[Math.floor(Math.random() * TOPICS.length)],
      level,
      startedAt: new Date().toISOString(),
      durationMinutes: 7,
    };

    storage.set(this.creditsKey, this.getCredits() - 7);
    storage.set(this.activeSessionKey, JSON.stringify(session));
    return session;
  }

  getActiveSession(): SpeakingMatch | null {
    const raw = storage.getString(this.activeSessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SpeakingMatch;
    } catch {
      return null;
    }
  }

  completeSession(review: SpeakingSessionReview): SpeakingSessionRecord {
    const activeSession = this.getActiveSession();
    if (!activeSession) {
      throw new Error('Aktif konuşma bulunamadı');
    }

    const record: SpeakingSessionRecord = {
      ...activeSession,
      review,
      completedAt: new Date().toISOString(),
      xpEarned: 300,
    };

    const sessions = this.getRecentSessions();
    storage.set(this.sessionsKey, JSON.stringify([record, ...sessions].slice(0, 20)));
    storage.remove(this.activeSessionKey);

    return record;
  }

  cancelActiveSession(): void {
    storage.remove(this.activeSessionKey);
  }

  getRecentSessions(): SpeakingSessionRecord[] {
    const raw = storage.getString(this.sessionsKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SpeakingSessionRecord[];
    } catch {
      return [];
    }
  }
}

export const speakingService = new SpeakingService();
