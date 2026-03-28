import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

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
  setWordProgress: (wordId: number, status: WordProgress['status']) => void;
  completeMode: (unitId: number, mode: string) => void;
  toggleBookmark: (wordId: number) => void;
}

const REVIEW_INTERVALS: Record<WordProgress['status'], number> = {
  unknown: 1,
  learning: 3,
  known: 7,
};

export const useProgressStore = create<ProgressState>((set) => ({
  wordProgress: JSON.parse(storage.getString('wordProgress') ?? '{}'),
  unitProgress: JSON.parse(storage.getString('unitProgress') ?? '{}'),
  bookmarkedWords: JSON.parse(storage.getString('bookmarks') ?? '[]'),

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
      return { unitProgress: updated };
    });
  },

  toggleBookmark: (wordId) => {
    set(s => {
      const bookmarkedWords = s.bookmarkedWords.includes(wordId)
        ? s.bookmarkedWords.filter(id => id !== wordId)
        : [...s.bookmarkedWords, wordId];
      storage.set('bookmarks', JSON.stringify(bookmarkedWords));
      return { bookmarkedWords };
    });
  },
}));
