import { useState, useCallback } from 'react';
import { achievementService, AchievementContext } from '@/services/achievementService';
import { AchievementToastData } from '@/components/ui/AchievementToast';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSocialStore } from '@/store/useSocialStore';

/**
 * Drop this hook into any screen that can trigger achievement progress.
 * Call `check()` after an action (XP gained, battle finished, etc.).
 * Renders one toast at a time; queues up multiple new achievements.
 */
export function useAchievementCheck() {
  const [currentToast, setCurrentToast] = useState<AchievementToastData | null>(null);
  const [queue, setQueue] = useState<AchievementToastData[]>([]);

  const { xp, streak } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const { friends } = useSocialStore();

  const check = useCallback(() => {
    const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
    const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;
    const battleStats = achievementService.getBattleStats();
    const pronStats = achievementService.getPronunciationStats();

    const ctx: AchievementContext = {
      xp,
      streak,
      knownWords,
      completedUnits,
      battleWins: battleStats.wins,
      battleCount: battleStats.total,
      pronunciationFourPlus: pronStats.fourPlus,
      folders: 0,
      friends: friends.length,
    };

    const newlyEarned = achievementService.checkAll(ctx);
    if (newlyEarned.length === 0) return;

    const toasts: AchievementToastData[] = newlyEarned.map(a => ({
      id: a.id,
      emoji: a.emoji,
      name: a.name,
      xpReward: a.xpReward,
    }));

    // Show first immediately, queue the rest
    setCurrentToast(toasts[0]);
    if (toasts.length > 1) {
      setQueue(q => [...q, ...toasts.slice(1)]);
    }
  }, [xp, streak, wordProgress, unitProgress, friends]);

  const dismiss = useCallback(() => {
    setCurrentToast(null);
    setQueue(q => {
      if (q.length === 0) return q;
      const [next, ...rest] = q;
      // Show next toast after a brief gap
      setTimeout(() => setCurrentToast(next), 400);
      return rest;
    });
  }, []);

  return { currentToast, check, dismiss };
}
