import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'offline-queue' });

// ─── Action Types ─────────────────────────────────────────────────────────────

export type QueuedAction =
  | {
      type: 'PROGRESS_UPDATE';
      wordId: string;
      status: 'unknown' | 'learning' | 'known';
      correctCount: number;
      incorrectCount: number;
      timestamp: number;
    }
  | {
      type: 'XP_GAIN';
      amount: number;
      reason: string;
      timestamp: number;
    }
  | {
      type: 'CHALLENGE_COMPLETE';
      date: string;
      correctCount: number;
      totalCount: number;
      xpEarned: number;
      timestamp: number;
    }
  | {
      type: 'BADGE_EARN';
      badgeId: string;
      timestamp: number;
    }
  | {
      type: 'STREAK_UPDATE';
      streak: number;
      date: string;
      timestamp: number;
    }
  | {
      type: 'UNIT_COMPLETE';
      unitId: string;
      score: number;
      timestamp: number;
    };

// Distributive Omit: preserves discriminated union structure
type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

export type EnqueueAction = DistributiveOmit<QueuedAction, 'timestamp'>;

export type QueueHandlers = {
  onProgressUpdate?: (a: Extract<QueuedAction, { type: 'PROGRESS_UPDATE' }>) => Promise<void>;
  onXPGain?: (a: Extract<QueuedAction, { type: 'XP_GAIN' }>) => Promise<void>;
  onChallengeComplete?: (a: Extract<QueuedAction, { type: 'CHALLENGE_COMPLETE' }>) => Promise<void>;
  onBadgeEarn?: (a: Extract<QueuedAction, { type: 'BADGE_EARN' }>) => Promise<void>;
  onStreakUpdate?: (a: Extract<QueuedAction, { type: 'STREAK_UPDATE' }>) => Promise<void>;
  onUnitComplete?: (a: Extract<QueuedAction, { type: 'UNIT_COMPLETE' }>) => Promise<void>;
};

export interface QueueStats {
  total: number;
  byType: Partial<Record<QueuedAction['type'], number>>;
  oldestTimestamp: number | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class OfflineQueueService {
  private static instance: OfflineQueueService;
  private processing = false;

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  // ─── Queue Management ───────────────────────────────────────────────────

  enqueue(action: EnqueueAction): void {
    const queue = this.getQueue();
    queue.push({ ...action, timestamp: Date.now() } as QueuedAction);
    storage.set('queue', JSON.stringify(queue));
  }

  getQueue(): QueuedAction[] {
    const raw = storage.getString('queue');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedAction[];
    } catch {
      return [];
    }
  }

  getStats(): QueueStats {
    const queue = this.getQueue();
    const byType: Partial<Record<QueuedAction['type'], number>> = {};
    let oldestTimestamp: number | null = null;

    for (const action of queue) {
      byType[action.type] = (byType[action.type] ?? 0) + 1;
      if (oldestTimestamp === null || action.timestamp < oldestTimestamp) {
        oldestTimestamp = action.timestamp;
      }
    }

    return { total: queue.length, byType, oldestTimestamp };
  }

  clearQueue(): void {
    storage.set('queue', '[]');
  }

  // ─── Processing ──────────────────────────────────────────────────────────

  async processQueue(
    handlers: QueueHandlers
  ): Promise<{ processed: number; failed: number; remaining: number }> {
    if (this.processing) return { processed: 0, failed: 0, remaining: this.getQueue().length };
    this.processing = true;

    const queue = this.getQueue();
    if (queue.length === 0) {
      this.processing = false;
      return { processed: 0, failed: 0, remaining: 0 };
    }

    let processed = 0;
    let failed = 0;
    const remaining: QueuedAction[] = [];

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'PROGRESS_UPDATE':
            await handlers.onProgressUpdate?.(action);
            break;
          case 'XP_GAIN':
            await handlers.onXPGain?.(action);
            break;
          case 'CHALLENGE_COMPLETE':
            await handlers.onChallengeComplete?.(action);
            break;
          case 'BADGE_EARN':
            await handlers.onBadgeEarn?.(action);
            break;
          case 'STREAK_UPDATE':
            await handlers.onStreakUpdate?.(action);
            break;
          case 'UNIT_COMPLETE':
            await handlers.onUnitComplete?.(action);
            break;
        }
        processed++;
      } catch (error) {
        console.error(`[OfflineQueue] Failed to process ${action.type}:`, error);
        remaining.push(action);
        failed++;
      }
    }

    storage.set('queue', JSON.stringify(remaining));
    this.processing = false;
    return { processed, failed, remaining: remaining.length };
  }

  // ─── Deduplication ───────────────────────────────────────────────────────
  // For PROGRESS_UPDATE: only keep the latest entry per wordId

  deduplicateProgressUpdates(): void {
    const queue = this.getQueue();
    const seen = new Map<string, number>(); // wordId -> index

    queue.forEach((action, i) => {
      if (action.type === 'PROGRESS_UPDATE') {
        seen.set(action.wordId, i);
      }
    });

    const deduped = queue.filter((action, i) => {
      if (action.type !== 'PROGRESS_UPDATE') return true;
      return seen.get(action.wordId) === i; // keep only latest
    });

    storage.set('queue', JSON.stringify(deduped));
  }
}
