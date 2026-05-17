import { authService } from './authService';

const BASE_URL = 'http://45.143.11.97/api';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  xp: number;
  level: number;
  avatar?: string;
  rank?: number;
  isMe?: boolean;
}

async function authFetch(path: string): Promise<Response> {
  const token = await authService.getToken();
  return fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

class LeaderboardService {
  async getTopUsers(): Promise<LeaderboardEntry[]> {
    try {
      const res = await authFetch('/users/leaderboard?type=allTime');
      if (!res.ok) return [];
      const data = await res.json();
      return data.entries ?? [];
    } catch {
      return [];
    }
  }

  async getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await authFetch('/users/leaderboard?type=weekly');
      if (!res.ok) return [];
      const data = await res.json();
      return data.entries ?? [];
    } catch {
      return [];
    }
  }

  async getUserRank(userId: string): Promise<{ rank: number; total: number } | null> {
    if (!userId) return null;
    try {
      const res = await authFetch('/users/leaderboard?type=allTime');
      if (!res.ok) return null;
      const data = await res.json();
      return { rank: data.myRank ?? 0, total: data.total ?? 0 };
    } catch {
      return null;
    }
  }
}

export const leaderboardService = new LeaderboardService();
