import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';

export interface WordProgress {
  wordId: number;
  status: 'unknown' | 'learning' | 'known';
  nextReview: string;
  reviewCount: number;
}

export interface UnitProgress {
  unitId: number;
  completedModes: string[];
  isCompleted: boolean;
}

export interface ProgressData {
  wordProgress: Record<number, WordProgress>;
  unitProgress: Record<number, UnitProgress>;
  bookmarkedWords: number[];
  lastUpdated: string;
}

class ProgressService {
  private unsubscribeProgress: Unsubscribe | null = null;

  async createProgressDocument(uid: string, initialData: Partial<ProgressData>): Promise<void> {
    if (!db) return;
    const progressRef = doc(db, 'progress', uid);
    const progressData: ProgressData = {
      wordProgress: {},
      unitProgress: {},
      bookmarkedWords: [],
      lastUpdated: new Date().toISOString(),
      ...initialData,
    };

    await setDoc(progressRef, progressData);
  }

  async getProgressData(uid: string): Promise<ProgressData | null> {
    if (!db) return null;
    const progressRef = doc(db, 'progress', uid);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      return progressSnap.data() as ProgressData;
    }
    return null;
  }

  async updateProgressData(uid: string, updates: Partial<ProgressData>): Promise<void> {
    if (!db) return;
    const progressRef = doc(db, 'progress', uid);
    await updateDoc(progressRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  }

  subscribeToProgressData(uid: string, callback: (progress: ProgressData | null) => void): Unsubscribe {
    if (!db) {
      callback(null);
      return () => {};
    }
    const progressRef = doc(db, 'progress', uid);
    this.unsubscribeProgress = onSnapshot(progressRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as ProgressData);
      } else {
        callback(null);
      }
    });
    return this.unsubscribeProgress;
  }

  unsubscribeProgressData(): void {
    if (this.unsubscribeProgress) {
      this.unsubscribeProgress();
      this.unsubscribeProgress = null;
    }
  }

  async syncLocalDataToCloud(localData: {
    wordProgress: Record<number, WordProgress>;
    unitProgress: Record<number, UnitProgress>;
    bookmarkedWords: number[];
  }): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const cloudProgress = await this.getProgressData(user.uid);
    if (!cloudProgress) {
      // Create new progress document with local data
      await this.createProgressDocument(user.uid, localData);
    } else {
      // Merge local and cloud data (prefer more recent/complete data)
      const mergedData = {
        wordProgress: this.mergeWordProgress(localData.wordProgress, cloudProgress.wordProgress),
        unitProgress: this.mergeUnitProgress(localData.unitProgress, cloudProgress.unitProgress),
        bookmarkedWords: [...new Set([...localData.bookmarkedWords, ...cloudProgress.bookmarkedWords])],
      };
      await this.updateProgressData(user.uid, mergedData);
    }
  }

  private mergeWordProgress(local: Record<number, WordProgress>, cloud: Record<number, WordProgress>): Record<number, WordProgress> {
    const merged: Record<number, WordProgress> = { ...cloud };

    Object.entries(local).forEach(([wordId, localProgress]) => {
      const wordIdNum = parseInt(wordId);
      const cloudProgress = cloud[wordIdNum];

      if (!cloudProgress) {
        merged[wordIdNum] = localProgress;
      } else {
        // Prefer the progress with higher review count or more advanced status
        const localStatusWeight = this.getStatusWeight(localProgress.status);
        const cloudStatusWeight = this.getStatusWeight(cloudProgress.status);

        if (localProgress.reviewCount > cloudProgress.reviewCount ||
            localStatusWeight > cloudStatusWeight) {
          merged[wordIdNum] = localProgress;
        }
      }
    });

    return merged;
  }

  private mergeUnitProgress(local: Record<number, UnitProgress>, cloud: Record<number, UnitProgress>): Record<number, UnitProgress> {
    const merged: Record<number, UnitProgress> = { ...cloud };

    Object.entries(local).forEach(([unitId, localProgress]) => {
      const unitIdNum = parseInt(unitId);
      const cloudProgress = cloud[unitIdNum];

      if (!cloudProgress) {
        merged[unitIdNum] = localProgress;
      } else {
        // Merge completed modes and prefer more complete status
        const mergedModes = [...new Set([...localProgress.completedModes, ...cloudProgress.completedModes])];
        const isCompleted = mergedModes.length >= 5 || localProgress.isCompleted || cloudProgress.isCompleted;

        merged[unitIdNum] = {
          unitId: unitIdNum,
          completedModes: mergedModes,
          isCompleted,
        };
      }
    });

    return merged;
  }

  private getStatusWeight(status: WordProgress['status']): number {
    switch (status) {
      case 'unknown': return 0;
      case 'learning': return 1;
      case 'known': return 2;
      default: return 0;
    }
  }
}

export const progressService = new ProgressService();
