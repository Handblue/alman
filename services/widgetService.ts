import { WORDS } from '@/data/words';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';

export interface WidgetSnapshot {
  streak: number;
  xp: number;
  goalProgress: number;
  wordOfTheDay: {
    german: string;
    turkish: string;
  };
  dailyChallenge: {
    completed: boolean;
    correctCount: number;
    totalCount: number;
  };
}

class WidgetService {
  getSnapshot(): WidgetSnapshot {
    const userState = useUserStore.getState();
    const challengeState = useDailyChallengeStore.getState();
    const progressState = useProgressStore.getState();
    const wordOfTheDay = WORDS[new Date().getDate() % WORDS.length];
    const learnedToday = Object.values(progressState.wordProgress).filter(
      word => word.status === 'known'
    ).length;

    return {
      streak: userState.streak,
      xp: userState.xp,
      goalProgress: Math.min(1, learnedToday / 10),
      wordOfTheDay: {
        german: wordOfTheDay?.german ?? 'lernen',
        turkish: wordOfTheDay?.turkish ?? 'öğrenmek',
      },
      dailyChallenge: {
        completed: challengeState.todayChallenge?.completed ?? false,
        correctCount: challengeState.todayChallenge?.correctCount ?? 0,
        totalCount: challengeState.todayChallenge?.questionIds.length ?? 5,
      },
    };
  }
}

export const widgetService = new WidgetService();
