import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// Conditionally import Firebase services only in non-test environments
let progressService: any = null;
let authService: any = null;

if (typeof jest === 'undefined') {
  // Only import in production/runtime
  const { progressService: ps, authService: as } = require('@/services/progressService');
  progressService = ps;
  authService = as;
}

const storage = new MMKV({ id: 'progress-store' });

type WordProgress = {
  wordId: number;
  status: 'unknown' | 'learning' | 'known';
  nextReview: string;
  reviewCount: number;
};

type UnitProgress = {
  unitId: number;
  completedModes: string[];
  isCompleted: boolean;
};

interface ProgressState {
  wordProgress: Record<number, WordProgress>;
  unitProgress: Record<number, UnitProgress>;
  bookmarkedWords: number[];
  isOnline: boolean;
  setWordProgress: (wordId: number, status: WordProgress['status']) => void;
  completeMode: (unitId: number, mode: string) => void;
  toggleBookmark: (wordId: number) => void;
  syncWithCloud: () => Promise<void>;
  initializeProgressSync: () => Promise<void>;
}

const REVIEW_INTERVALS: Record<WordProgress['status'], number> = {
  unknown: 1,
  learning: 3,
  known: 7,
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  wordProgress: JSON.parse(storage.getString('wordProgress') ?? '{}'),
  unitProgress: JSON.parse(storage.getString('unitProgress') ?? '{}'),
  bookmarkedWords: JSON.parse(storage.getString('bookmarks') ?? '[]'),
  isOnline: false,

  setWordProgress: (wordId, status) => {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[status]);
    set(s => {
      const updated: Record<number, WordProgress> = {
        ...s.wordProgress,
        [wordId]: {
          wordId,
          status,
          nextReview: nextReview.toISOString(),
          reviewCount: (s.wordProgress[wordId]?.reviewCount ?? 0) + 1,
        },
      };
      storage.set('wordProgress', JSON.stringify(updated));
      get().syncWithCloud();
      return { wordProgress: updated };
    });
  },

  completeMode: (unitId, mode) => {
    set(s => {
      const prev = s.unitProgress[unitId] ?? { unitId, completedModes: [], isCompleted: false };
      const completedModes = [...new Set([...prev.completedModes, mode])];
      const isCompleted = completedModes.length >= 5;
      const updated = {
        ...s.unitProgress,
        [unitId]: { ...prev, completedModes, isCompleted },
      };
      storage.set('unitProgress', JSON.stringify(updated));
      get().syncWithCloud();
      return { unitProgress: updated };
    });
  },

  toggleBookmark: (wordId) => {
    set(s => {
      const bookmarkedWords = s.bookmarkedWords.includes(wordId)
        ? s.bookmarkedWords.filter(id => id !== wordId)
        : [...s.bookmarkedWords, wordId];
      storage.set('bookmarks', JSON.stringify(bookmarkedWords));
      get().syncWithCloud();
      return { bookmarkedWords };
    });
  },

  syncWithCloud: async () => {
    if (!progressService || !authService) return; // Skip in test environment

    const user = authService.getCurrentUser();
    if (!user) return;

    const state = get();
    try {
      await progressService.updateProgressData(user.uid, {
        wordProgress: state.wordProgress,
        unitProgress: state.unitProgress,
        bookmarkedWords: state.bookmarkedWords,
      });
    } catch (error) {
      console.error('Failed to sync progress with cloud:', error);
    }
  },

  initializeProgressSync: async () => {
    if (!progressService || !authService) return; // Skip in test environment

    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      // Sync local data to cloud
      const state = get();
      await progressService.syncLocalDataToCloud({
        wordProgress: state.wordProgress,
        unitProgress: state.unitProgress,
        bookmarkedWords: state.bookmarkedWords,
      });

      // Subscribe to cloud changes
      progressService.subscribeToProgressData(user.uid, (progress) => {
        if (progress) {
          // Update local state with cloud data
          storage.set('wordProgress', JSON.stringify(progress.wordProgress));
          storage.set('unitProgress', JSON.stringify(progress.unitProgress));
          storage.set('bookmarks', JSON.stringify(progress.bookmarkedWords));

          set({
            wordProgress: progress.wordProgress,
            unitProgress: progress.unitProgress,
            bookmarkedWords: progress.bookmarkedWords,
            isOnline: true,
          });
        }
      });
    } catch (error) {
      console.error('Failed to initialize progress sync:', error);
      set({ isOnline: false });
    }
  },
}));
