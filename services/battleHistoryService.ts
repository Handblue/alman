import { createStorage } from '@/utils/storage';

const storage = createStorage('battle-history');

export interface BattleHistoryEntry {
  id: string;
  battleId: string;
  opponentName: string;
  opponentIsBot: boolean;
  didWin: boolean;
  isDraw: boolean;
  myScore: number;
  opponentScore: number;
  eloChange: number;
  xpEarned: number;
  playedAt: string;
  questionCount: number;
}

class BattleHistoryService {
  private key = 'entries';

  getHistory(): BattleHistoryEntry[] {
    const raw = storage.getString(this.key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as BattleHistoryEntry[];
    } catch {
      return [];
    }
  }

  addEntry(entry: BattleHistoryEntry): void {
    const history = this.getHistory();
    const updated = [entry, ...history.filter(item => item.id !== entry.id)].slice(0, 50);
    storage.set(this.key, JSON.stringify(updated));
  }

  clear(): void {
    storage.set(this.key, JSON.stringify([]));
  }
}

export const battleHistoryService = new BattleHistoryService();
