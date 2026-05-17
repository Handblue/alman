import { create } from 'zustand';
import { WORDS } from '@/data/words';
import { NotificationService } from '@/services/notificationService';
import { createStorage, readStoredJson } from '@/utils/storage';

const storage = createStorage('daily-challenge-store');

export type DailyChallenge = {
  date: string;
  questionIds: number[];
  answeredCount: number;
  correctCount: number;
  completed: boolean;
  xpEarned: number;
};

interface DailyChallengeState {
  todayChallenge: DailyChallenge | null;
  history: DailyChallenge[];
  syncing: boolean;
  initToday: () => void;
  recordAnswer: (correct: boolean) => void;
  completeChallenge: () => void;
  syncToCloud: (userId: string) => Promise<void>;
  loadFromCloud: (userId: string) => Promise<void>;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function dateStringToSeed(date: string): number {
  return date.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function pickQuestionIds(seed: number, totalWords: number, count: number): number[] {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 2147483648;
    return state;
  };
  const ids: number[] = [];
  const used = new Set<number>();
  while (ids.length < count) {
    const idx = (next() % totalWords) + 1;
    if (!used.has(idx)) {
      used.add(idx);
      ids.push(idx);
    }
  }
  return ids;
}

export const useDailyChallengeStore = create<DailyChallengeState>((set, get) => ({
  todayChallenge: readStoredJson<DailyChallenge | null>(storage, 'dailyChallenge', null),
  history: readStoredJson<DailyChallenge[]>(storage, 'challengeHistory', []),
  syncing: false,

  initToday: () => {
    const today = getToday();
    const { todayChallenge } = get();
    if (todayChallenge?.date === today) return;

    const seed = dateStringToSeed(today);
    const questionIds = pickQuestionIds(seed, WORDS.length, 5);
    const challenge: DailyChallenge = {
      date: today,
      questionIds,
      answeredCount: 0,
      correctCount: 0,
      completed: false,
      xpEarned: 0,
    };
    storage.set('dailyChallenge', JSON.stringify(challenge));
    set({ todayChallenge: challenge });
  },

  recordAnswer: (correct) => {
    const { todayChallenge, completeChallenge } = get();
    if (!todayChallenge || todayChallenge.completed) return;

    const answeredCount = todayChallenge.answeredCount + 1;
    const correctCount = correct
      ? todayChallenge.correctCount + 1
      : todayChallenge.correctCount;
    const updated: DailyChallenge = { ...todayChallenge, answeredCount, correctCount };

    storage.set('dailyChallenge', JSON.stringify(updated));
    set({ todayChallenge: updated });

    if (answeredCount === 5) {
      completeChallenge();
    }
  },

  completeChallenge: () => {
    const { todayChallenge, history } = get();
    if (!todayChallenge) return;

    const xpEarned = todayChallenge.correctCount * 10 + 25;
    const completed: DailyChallenge = { ...todayChallenge, completed: true, xpEarned };
    const updatedHistory = [
      completed,
      ...history.filter((h) => h.date !== completed.date),
    ].slice(0, 90);

    storage.set('dailyChallenge', JSON.stringify(completed));
    storage.set('challengeHistory', JSON.stringify(updatedHistory));
    set({ todayChallenge: completed, history: updatedHistory });

    NotificationService.getInstance().sendChallengeComplete?.(
      xpEarned,
      completed.correctCount,
      completed.questionIds.length
    )?.catch(() => {});
  },

  // Stub — Firebase kaldırıldı, yerel veri yeterli
  syncToCloud: async (_userId: string) => {},
  loadFromCloud: async (_userId: string) => {},
}));
