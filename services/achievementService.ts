import { createStorage } from '@/utils/storage';

const storage = createStorage('achievements');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  xpReward: number;
  /** Returns true when the condition is met */
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  xp: number;
  streak: number;
  knownWords: number;
  completedUnits: number;
  battleWins: number;
  battleCount: number;
  pronunciationFourPlus: number; // words scored 4+ stars
  folders: number;
  friends: number;
}

export interface EarnedEvent {
  achievementId: string;
  earnedAt: number;
}

// ─── Definitions ──────────────────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_step',
    emoji: '👟',
    name: 'İlk Adım',
    desc: 'İlk üniteyi tamamla',
    xpReward: 50,
    check: (c) => c.completedUnits >= 1,
  },
  {
    id: 'word_hunter_100',
    emoji: '🎯',
    name: 'Kelime Avcısı',
    desc: '100 kelime öğren',
    xpReward: 200,
    check: (c) => c.knownWords >= 100,
  },
  {
    id: 'word_hunter_50',
    emoji: '📖',
    name: 'Kelime Toplayıcı',
    desc: '50 kelime öğren',
    xpReward: 100,
    check: (c) => c.knownWords >= 50,
  },
  {
    id: 'social_warrior',
    emoji: '🤝',
    name: 'Sosyal Savaşçı',
    desc: '5 arkadaş ekle',
    xpReward: 100,
    check: (c) => c.friends >= 5,
  },
  {
    id: 'week_warrior',
    emoji: '🔥',
    name: 'Hafta Savaşçısı',
    desc: '7 gün ard arda giriş',
    xpReward: 300,
    check: (c) => c.streak >= 7,
  },
  {
    id: 'month_warrior',
    emoji: '🔥🔥',
    name: 'Aylık Savaşçı',
    desc: '30 gün ard arda giriş',
    xpReward: 1000,
    check: (c) => c.streak >= 30,
  },
  {
    id: 'battle_first_win',
    emoji: '⚔️',
    name: 'İlk Zafer',
    desc: 'İlk battle\'ı kazan',
    xpReward: 150,
    check: (c) => c.battleWins >= 1,
  },
  {
    id: 'battle_master',
    emoji: '🏆',
    name: 'Battle Master',
    desc: '10 battle kazan',
    xpReward: 500,
    check: (c) => c.battleWins >= 10,
  },
  {
    id: 'battle_veteran',
    emoji: '⚔️⚔️',
    name: 'Battle Veteran',
    desc: '50 battle oyna',
    xpReward: 800,
    check: (c) => c.battleCount >= 50,
  },
  {
    id: 'pronunciation_master',
    emoji: '🎙️',
    name: 'Telaffuz Ustası',
    desc: '50 kelime 4+ yıldız telaffuz',
    xpReward: 350,
    check: (c) => c.pronunciationFourPlus >= 50,
  },
  {
    id: 'pronunciation_beginner',
    emoji: '🎤',
    name: 'Telaffuz Başlangıcı',
    desc: '10 kelime 4+ yıldız telaffuz',
    xpReward: 100,
    check: (c) => c.pronunciationFourPlus >= 10,
  },
  {
    id: 'xp_500',
    emoji: '⭐',
    name: 'Yükselen Yıldız',
    desc: '500 XP kazan',
    xpReward: 0,
    check: (c) => c.xp >= 500,
  },
  {
    id: 'xp_2000',
    emoji: '🌟',
    name: 'Süper Yıldız',
    desc: '2000 XP kazan',
    xpReward: 0,
    check: (c) => c.xp >= 2000,
  },
  {
    id: 'xp_5000',
    emoji: '💫',
    name: 'Efsane',
    desc: '5000 XP kazan',
    xpReward: 0,
    check: (c) => c.xp >= 5000,
  },
  {
    id: 'folder_master',
    emoji: '📁',
    name: 'Liste Ustası',
    desc: '3 klasör oluştur',
    xpReward: 150,
    check: (c) => c.folders >= 3,
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

class AchievementService {
  private earned: Set<string>;

  constructor() {
    const saved = storage.getString('earned');
    this.earned = new Set(saved ? JSON.parse(saved) : []);
  }

  getEarned(): string[] {
    return Array.from(this.earned);
  }

  isEarned(id: string): boolean {
    return this.earned.has(id);
  }

  /** Get stats for a single achievement */
  getDef(id: string): AchievementDef | undefined {
    return ACHIEVEMENT_DEFS.find(a => a.id === id);
  }

  /**
   * Check all achievements against context.
   * Returns newly earned definitions so the caller can show toasts / award XP.
   */
  checkAll(ctx: AchievementContext): AchievementDef[] {
    const newlyEarned: AchievementDef[] = [];

    for (const def of ACHIEVEMENT_DEFS) {
      if (this.earned.has(def.id)) continue;
      if (def.check(ctx)) {
        this.earned.add(def.id);
        newlyEarned.push(def);
      }
    }

    if (newlyEarned.length > 0) {
      storage.set('earned', JSON.stringify(Array.from(this.earned)));
    }

    return newlyEarned;
  }

  /** Manually award (e.g. from a challenge) */
  award(id: string): boolean {
    if (this.earned.has(id)) return false;
    this.earned.add(id);
    storage.set('earned', JSON.stringify(Array.from(this.earned)));
    return true;
  }

  /** Progress toward an achievement (0.0–1.0) */
  getProgress(id: string, ctx: AchievementContext): number {
    switch (id) {
      case 'word_hunter_50':    return Math.min(1, ctx.knownWords / 50);
      case 'word_hunter_100':   return Math.min(1, ctx.knownWords / 100);
      case 'week_warrior':      return Math.min(1, ctx.streak / 7);
      case 'month_warrior':     return Math.min(1, ctx.streak / 30);
      case 'battle_master':     return Math.min(1, ctx.battleWins / 10);
      case 'battle_veteran':    return Math.min(1, ctx.battleCount / 50);
      case 'pronunciation_beginner': return Math.min(1, ctx.pronunciationFourPlus / 10);
      case 'pronunciation_master':   return Math.min(1, ctx.pronunciationFourPlus / 50);
      case 'xp_500':   return Math.min(1, ctx.xp / 500);
      case 'xp_2000':  return Math.min(1, ctx.xp / 2000);
      case 'xp_5000':  return Math.min(1, ctx.xp / 5000);
      case 'social_warrior': return Math.min(1, ctx.friends / 5);
      case 'folder_master':  return Math.min(1, ctx.folders / 3);
      default: return this.earned.has(id) ? 1 : 0;
    }
  }

  // ─── Battle stats (persisted separately) ──────────────────────────────────

  getBattleStats(): { wins: number; total: number; elo: number } {
    return {
      wins:  storage.getNumber('battleWins')  ?? 0,
      total: storage.getNumber('battleTotal') ?? 0,
      elo:   storage.getNumber('battleElo')   ?? 1200,
    };
  }

  recordBattleResult(won: boolean, eloChange: number): void {
    const stats = this.getBattleStats();
    storage.set('battleWins',  stats.wins  + (won ? 1 : 0));
    storage.set('battleTotal', stats.total + 1);
    storage.set('battleElo',   Math.max(800, stats.elo + eloChange));
  }

  // ─── Pronunciation stats ──────────────────────────────────────────────────

  getPronunciationStats(): { fourPlus: number } {
    return { fourPlus: storage.getNumber('pronFourPlus') ?? 0 };
  }

  recordPronunciationScore(score: number): void {
    if (score >= 4) {
      const cur = storage.getNumber('pronFourPlus') ?? 0;
      storage.set('pronFourPlus', cur + 1);
    }
  }
}

export const achievementService = new AchievementService();
