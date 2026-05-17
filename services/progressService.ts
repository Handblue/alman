// Firebase kaldırıldı — ilerleme verileri useProgressStore (MMKV) üzerinde yerel saklanıyor.

export interface WordProgress {
  wordId: number;
  status: 'unknown' | 'learning' | 'known';
  correctCount: number;
  incorrectCount: number;
  lastStudied: string;
  nextReview: string;
}

export interface UnitProgress {
  unitId: number;
  completedModes: string[];
  lastStudied: string;
}

export interface ProgressData {
  words: Record<number, WordProgress>;
  units: Record<number, UnitProgress>;
  totalXP: number;
  streak: number;
  lastActiveDate: string;
}

class ProgressService {
  async createProgressDocument(_uid: string, _initialData: Partial<ProgressData>): Promise<void> {}
  async getProgressData(_uid: string): Promise<ProgressData | null> { return null; }
  async updateProgressData(_uid: string, _updates: Partial<ProgressData>): Promise<void> {}
  async syncLocalDataToCloud(_localData: Partial<ProgressData>, _uid: string): Promise<void> {}
}

export const progressService = new ProgressService();
