// Battle system constants and legacy type stubs.
// Real battle logic lives in battleApiService + useBattleStore.

export const QUESTION_COUNT = 10;
export const QUESTION_TIME_MS = 10_000;
export const DEFAULT_ELO = 1200;
export const BETWEEN_DURATION_MS = 1_500;

// ─── Legacy type stubs (used by vs.tsx) ──────────────────────────────────────

export interface BattlePlayer {
  uid: string;
  displayName: string;
  xp: number;
  elo: number;
  ready: boolean;
  isBot?: boolean;
}

export interface BattleAnswer {
  optionIndex: number;
  correct: boolean;
  answeredAt: number;
}

export type BattleStatus =
  | 'waiting'
  | 'countdown'
  | 'question'
  | 'between'
  | 'finished';

export interface Battle {
  id: string;
  status: BattleStatus;
  player1: BattlePlayer;
  player2: BattlePlayer | null;
  questions: any[];
  currentQuestion: number;
  scores: Record<string, number>;
  answers: Record<string, Record<number, BattleAnswer>>;
  createdAt: number;
  startedAt: number | null;
  questionStartedAt: number | null;
  finishedAt: number | null;
  winnerId: string | null;
  eloChanges: Record<string, number>;
  isBot: boolean;
}

export function buildOptions(_word: any): { options: string[]; correctIndex: number } {
  return { options: [], correctIndex: 0 };
}

// Stub service — Firebase removed, real battles go through battleApiService
class BattleService {
  cleanup() {}
  subscribe(_id: string, _cb: (b: Battle) => void): () => void { return () => {}; }
  async getBattle(_id: string): Promise<Battle | null> { return null; }
  scheduleBot(_id: string, _cb: () => void) {}
  async findMatch(_: any): Promise<string> { return ''; }
  async startQuestion(_: string, __: number) {}
  async submitAnswer(_: string, __: number, ___: number, ____: boolean) {}
  clearBotTimer() {}
  clearQuestionTimer() {}
}

export const battleService = new BattleService();
