import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { WORDS } from '@/data/words';
import { db } from '@/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { NotificationService } from '@/services/notificationService';
import { OfflineQueueService } from '@/services/offlineQueueService';

const storage = new MMKV({ id: 'daily-challenge-store' });

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
  todayChallenge: JSON.parse(storage.getString('dailyChallenge') ?? 'null'),
  history: JSON.parse(storage.getString('challengeHistory') ?? '[]'),
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
    ].slice(0, 90); // son 90 gün

    storage.set('dailyChallenge', JSON.stringify(completed));
    storage.set('challengeHistory', JSON.stringify(updatedHistory));
    set({ todayChallenge: completed, history: updatedHistory });

    // Push notification
    NotificationService.getInstance().sendChallengeComplete?.(
      xpEarned,
      completed.correctCount,
      completed.questionIds.length
    )?.catch(() => {});
  },

  syncToCloud: async (userId: string) => {
    set({ syncing: true });
    try {
      const { todayChallenge, history } = get();

      if (todayChallenge) {
        await setDoc(
          doc(db, 'daily_challenges', userId, 'sessions', todayChallenge.date),
          { ...todayChallenge, syncedAt: Timestamp.now() },
          { merge: true }
        );
      }

      // Son 7 günün geçmişini bulut ile eşitle
      for (const entry of history.slice(0, 7)) {
        await setDoc(
          doc(db, 'daily_challenges', userId, 'sessions', entry.date),
          { ...entry, syncedAt: Timestamp.now() },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('[DailyChallenge] Cloud sync failed:', error);

      // Çevrimdışıysa kuyruğa ekle
      const { todayChallenge } = get();
      if (todayChallenge?.completed) {
        OfflineQueueService.getInstance().enqueue({
          type: 'CHALLENGE_COMPLETE',
          date: todayChallenge.date,
          correctCount: todayChallenge.correctCount,
          totalCount: todayChallenge.questionIds.length,
          xpEarned: todayChallenge.xpEarned,
        });
      }
    } finally {
      set({ syncing: false });
    }
  },

  loadFromCloud: async (userId: string) => {
    try {
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

      const q = query(
        collection(db, 'daily_challenges', userId, 'sessions'),
        orderBy('date', 'desc'),
        limit(30)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      const cloudHistory: DailyChallenge[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          date: data.date,
          questionIds: data.questionIds,
          answeredCount: data.answeredCount,
          correctCount: data.correctCount,
          completed: data.completed,
          xpEarned: data.xpEarned,
        };
      });

      const today = getToday();
      const cloudToday = cloudHistory.find((c) => c.date === today) ?? null;
      const cloudHistoryWithoutToday = cloudHistory.filter((c) => c.date !== today);

      // Yerel ile birleştir — daha yeni olanı al
      const localToday = get().todayChallenge;
      const mergedToday =
        cloudToday && localToday
          ? cloudToday.answeredCount >= localToday.answeredCount
            ? cloudToday
            : localToday
          : cloudToday ?? localToday;

      if (mergedToday) {
        storage.set('dailyChallenge', JSON.stringify(mergedToday));
      }
      storage.set('challengeHistory', JSON.stringify(cloudHistoryWithoutToday));
      set({ todayChallenge: mergedToday, history: cloudHistoryWithoutToday });
    } catch (error) {
      console.error('[DailyChallenge] Cloud load failed:', error);
    }
  },
}));
