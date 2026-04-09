import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  xp: number;
  level: number;
  avatar?: string;
  rank?: number;
}

class LeaderboardService {
  private leaderboardUnsubscribe: Unsubscribe | null = null;

  async getTopUsers(limitCount: number = 10): Promise<LeaderboardEntry[]> {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      orderBy('xp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];

    querySnapshot.docs.forEach((entryDoc, index) => {
      const data = entryDoc.data();
      entries.push({
        uid: entryDoc.id,
        displayName: data.displayName || `User${entryDoc.id.slice(0, 6)}`,
        xp: data.xp || 0,
        level: data.level || 1,
        avatar: data.avatar,
        rank: index + 1,
      });
    });

    return entries;
  }

  async getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('updatedAt', '>=', Timestamp.fromDate(weekAgo)),
      orderBy('updatedAt', 'desc'),
      orderBy('xp', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];

    querySnapshot.docs.forEach((entryDoc, index) => {
      const data = entryDoc.data();
      entries.push({
        uid: entryDoc.id,
        displayName: data.displayName || `User${entryDoc.id.slice(0, 6)}`,
        xp: data.xp || 0,
        level: data.level || 1,
        avatar: data.avatar,
        rank: index + 1,
      });
    });

    return entries;
  }

  subscribeToLeaderboard(callback: (entries: LeaderboardEntry[]) => void): Unsubscribe {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('xp', 'desc'), limit(10));

    this.leaderboardUnsubscribe = onSnapshot(q, (querySnapshot) => {
      const entries: LeaderboardEntry[] = [];
      querySnapshot.docs.forEach((entryDoc, index) => {
        const data = entryDoc.data();
        entries.push({
          uid: entryDoc.id,
          displayName: data.displayName || `User${entryDoc.id.slice(0, 6)}`,
          xp: data.xp || 0,
          level: data.level || 1,
          avatar: data.avatar,
          rank: index + 1,
        });
      });
      callback(entries);
    });

    return this.leaderboardUnsubscribe;
  }

  unsubscribeLeaderboard(): void {
    if (this.leaderboardUnsubscribe) {
      this.leaderboardUnsubscribe();
      this.leaderboardUnsubscribe = null;
    }
  }

  async getUserRank(uid: string): Promise<{ rank: number; total: number } | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('xp', 'desc'));

    const querySnapshot = await getDocs(q);
    const total = querySnapshot.size;

    let rank = -1;
    querySnapshot.docs.forEach((entryDoc, index) => {
      if (entryDoc.id === uid) {
        rank = index + 1;
      }
    });

    return rank > 0 ? { rank, total } : null;
  }
}

export const leaderboardService = new LeaderboardService();
