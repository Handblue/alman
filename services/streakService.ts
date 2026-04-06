import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export interface StreakInsight {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  optimalStudyHour: number; // 0-23
  recoveryPlan: string[];
  nextMilestone: number; // hedef gün sayısı
  nextMilestoneGap: number; // hedefe kaç gün kaldı
  weeklyConsistency: number; // 0-100
}

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];

export class StreakService {
  private static instance: StreakService;

  static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  async getStreakInsights(userId: string): Promise<StreakInsight> {
    try {
      const [metrics, sessions] = await Promise.all([
        this.fetchMetrics(userId),
        this.fetchSessionHours(userId),
      ]);
      return this.computeInsights(metrics, sessions);
    } catch (error) {
      console.error('StreakService error:', error);
      return this.defaultInsights();
    }
  }

  private async fetchMetrics(userId: string) {
    const q = query(
      collection(db, 'analytics', userId, 'performance_metrics'),
      orderBy('date', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      date: d.data().date.toDate() as Date,
      wordsLearnedToday: (d.data().wordsLearnedToday as number) || 0,
      studyStreak: (d.data().studyStreak as number) || 0,
    }));
  }

  private async fetchSessionHours(userId: string): Promise<number[]> {
    const q = query(
      collection(db, 'analytics', userId, 'learning_sessions'),
      orderBy('startTime', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => (d.data().startTime.toDate() as Date).getHours());
  }

  private computeInsights(
    metrics: { date: Date; wordsLearnedToday: number; studyStreak: number }[],
    sessionHours: number[]
  ): StreakInsight {
    const currentStreak = metrics[0]?.studyStreak ?? 0;
    const longestStreak = metrics.reduce((max, m) => Math.max(max, m.studyStreak), 0);

    // Bugün çalışıldı mı?
    const todayStr = new Date().toDateString();
    const studiedToday = metrics.some(
      m => m.date.toDateString() === todayStr && m.wordsLearnedToday > 0
    );
    const isAtRisk = !studiedToday;

    // Risk seviyesi (günün saatine göre)
    const currentHour = new Date().getHours();
    let riskLevel: StreakInsight['riskLevel'] = 'none';
    if (isAtRisk) {
      if (currentHour >= 22) riskLevel = 'high';
      else if (currentHour >= 18) riskLevel = 'medium';
      else riskLevel = 'low';
    }

    // En verimli saat
    const hourCount: Record<number, number> = {};
    sessionHours.forEach(h => {
      hourCount[h] = (hourCount[h] || 0) + 1;
    });
    const optimalStudyHour = sessionHours.length > 0
      ? parseInt(
          Object.entries(hourCount).sort(([, a], [, b]) => b - a)[0][0],
          10
        )
      : 9;

    // Kurtarma planı
    const recoveryPlan = this.buildRecoveryPlan(
      isAtRisk, riskLevel, currentStreak, optimalStudyHour
    );

    // Sonraki milestone
    const nextMilestone =
      STREAK_MILESTONES.find(m => m > currentStreak) ??
      currentStreak + 100;
    const nextMilestoneGap = nextMilestone - currentStreak;

    // Haftalık tutarlılık
    const last7 = metrics.slice(0, 7);
    const activeDays = last7.filter(m => m.wordsLearnedToday > 0).length;
    const weeklyConsistency = Math.round((activeDays / 7) * 100);

    return {
      currentStreak,
      longestStreak,
      isAtRisk,
      riskLevel,
      optimalStudyHour,
      recoveryPlan,
      nextMilestone,
      nextMilestoneGap,
      weeklyConsistency,
    };
  }

  private buildRecoveryPlan(
    isAtRisk: boolean,
    riskLevel: StreakInsight['riskLevel'],
    streak: number,
    optimalHour: number
  ): string[] {
    const hourStr = `${String(optimalHour).padStart(2, '0')}:00`;

    if (!isAtRisk) {
      if (streak >= 30) return [`Muhteşem! ${streak} günlük serin var. Devam et!`];
      if (streak >= 7) return [`${streak} günlük seri devam ediyor. Harika gidiyorsun!`];
      return ['Bugünkü çalışmanı tamamladın!'];
    }

    const plans: string[] = [];

    if (riskLevel === 'high') {
      plans.push('Serin tehlikede! 5 dakika bile yeterli.');
      plans.push('Flashcard modunda 10 hızlı kelime seriyi kurtarır.');
    } else if (riskLevel === 'medium') {
      plans.push(`Henüz bugün çalışmadın. ${hourStr} saati en verimli saatin.`);
      plans.push('15 dakikalık kısa bir oturum aç.');
    } else {
      plans.push('Bugünkü hedefe ulaşmak için zamanın var.');
      plans.push(`Önerilen çalışma saati: ${hourStr}.`);
    }

    if (streak > 0) {
      plans.push(`${streak} günlük serini kaybetme!`);
    } else {
      plans.push('Yeni bir seri başlatmak için bugün çalış.');
    }

    return plans;
  }

  private defaultInsights(): StreakInsight {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isAtRisk: false,
      riskLevel: 'none',
      optimalStudyHour: 9,
      recoveryPlan: ['Öğrenmeye başlamak için bir oturum aç.'],
      nextMilestone: 7,
      nextMilestoneGap: 7,
      weeklyConsistency: 0,
    };
  }
}
