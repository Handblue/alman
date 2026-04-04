import { collection, doc, setDoc, updateDoc, getDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

export interface LearningSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  wordsStudied: string[];
  correctAnswers: number;
  totalAnswers: number;
  studyMode: 'flashcard' | 'multiple-choice' | 'sentence' | 'synonym' | 'writing';
  unitId?: string;
  folderId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  engagement: number; // 0-100 score
  interruptions: number;
}

export interface PerformanceMetrics {
  userId: string;
  date: Date;
  retentionRate: number; // percentage of words remembered
  studyStreak: number; // consecutive days studied
  averageSessionLength: number; // in minutes
  wordsLearnedToday: number;
  accuracyRate: number; // overall accuracy percentage
  studyVelocity: number; // words per hour
  consistencyScore: number; // 0-100 based on regularity
  weakCategories: string[]; // categories needing improvement
  strongCategories: string[]; // mastered categories
}

export interface LearningInsight {
  id: string;
  userId: string;
  type: 'retention' | 'consistency' | 'difficulty' | 'progress' | 'recommendation';
  title: string;
  description: string;
  data: any;
  confidence: number; // 0-100
  createdAt: Date;
  actionable: boolean;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Learning Session Management
  async startLearningSession(
    studyMode: LearningSession['studyMode'],
    unitId?: string,
    folderId?: string
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: Omit<LearningSession, 'endTime' | 'duration' | 'wordsStudied' | 'correctAnswers' | 'totalAnswers' | 'engagement' | 'interruptions'> = {
      id: sessionId,
      userId,
      startTime: new Date(),
      studyMode,
      unitId,
      folderId,
      difficulty: 'medium', // default, will be updated
    };

    try {
      await setDoc(doc(db, 'analytics', userId, 'learning_sessions', sessionId), {
        ...session,
        startTime: Timestamp.fromDate(session.startTime),
      });
      return sessionId;
    } catch (error) {
      console.error('Error starting learning session:', error);
      throw error;
    }
  }

  async endLearningSession(
    sessionId: string,
    wordsStudied: string[],
    correctAnswers: number,
    totalAnswers: number,
    engagement: number,
    interruptions: number
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const sessionRef = doc(db, 'analytics', userId, 'learning_sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Learning session not found');
    }

    const sessionData = sessionDoc.data();
    const startTime = sessionData.startTime.toDate();
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

    const difficulty = this.calculateDifficulty(correctAnswers, totalAnswers);

    try {
      await updateDoc(sessionRef, {
        endTime: Timestamp.fromDate(endTime),
        duration,
        wordsStudied,
        correctAnswers,
        totalAnswers,
        engagement,
        interruptions,
        difficulty,
      });

      // Update daily metrics
      await this.updateDailyMetrics(userId, wordsStudied.length, correctAnswers, totalAnswers, duration);
    } catch (error) {
      console.error('Error ending learning session:', error);
      throw error;
    }
  }

  // Performance Metrics
  private async updateDailyMetrics(
    userId: string,
    wordsLearned: number,
    correctAnswers: number,
    totalAnswers: number,
    sessionDuration: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metricsRef = doc(db, 'analytics', userId, 'performance_metrics', today.toISOString().split('T')[0]);

    try {
      const metricsDoc = await getDoc(metricsRef);
      const existingMetrics = metricsDoc.exists() ? metricsDoc.data() : null;

      const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

      const newMetrics: Omit<PerformanceMetrics, 'userId' | 'date'> = {
        retentionRate: existingMetrics?.retentionRate || 85, // placeholder
        studyStreak: await this.calculateStudyStreak(userId),
        averageSessionLength: existingMetrics ?
          ((existingMetrics.averageSessionLength * (existingMetrics.wordsLearnedToday || 0)) + sessionDuration) / (existingMetrics.wordsLearnedToday + wordsLearned) :
          sessionDuration,
        wordsLearnedToday: (existingMetrics?.wordsLearnedToday || 0) + wordsLearned,
        accuracyRate: existingMetrics ?
          ((existingMetrics.accuracyRate * (existingMetrics.wordsLearnedToday || 0)) + accuracyRate * wordsLearned) / (existingMetrics.wordsLearnedToday + wordsLearned) :
          accuracyRate,
        studyVelocity: existingMetrics ?
          ((existingMetrics.studyVelocity * (existingMetrics.wordsLearnedToday || 0)) + (wordsLearned / (sessionDuration / 60))) / (existingMetrics.wordsLearnedToday + wordsLearned) :
          wordsLearned / (sessionDuration / 60),
        consistencyScore: await this.calculateConsistencyScore(userId),
        weakCategories: [], // will be calculated by AI service
        strongCategories: [], // will be calculated by AI service
      };

      await setDoc(metricsRef, {
        ...newMetrics,
        date: Timestamp.fromDate(today),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating daily metrics:', error);
      throw error;
    }
  }

  // Analytics Calculations
  private calculateDifficulty(correctAnswers: number, totalAnswers: number): 'easy' | 'medium' | 'hard' {
    if (totalAnswers === 0) return 'medium';
    const accuracy = correctAnswers / totalAnswers;

    if (accuracy >= 0.8) return 'easy';
    if (accuracy >= 0.6) return 'medium';
    return 'hard';
  }

  private async calculateStudyStreak(userId: string): Promise<number> {
    try {
      const metricsQuery = query(
        collection(db, 'analytics', userId, 'performance_metrics'),
        orderBy('date', 'desc'),
        limit(30)
      );

      const metricsSnapshot = await getDocs(metricsQuery);
      const metrics = metricsSnapshot.docs.map(doc => ({
        date: doc.data().date.toDate(),
        wordsLearnedToday: doc.data().wordsLearnedToday || 0,
      }));

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < metrics.length; i++) {
        const metricDate = new Date(metrics[i].date);
        metricDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (metricDate.getTime() === expectedDate.getTime() && metrics[i].wordsLearnedToday > 0) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating study streak:', error);
      return 0;
    }
  }

  private async calculateConsistencyScore(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const metricsQuery = query(
        collection(db, 'analytics', userId, 'performance_metrics'),
        where('date', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('date', 'desc')
      );

      const metricsSnapshot = await getDocs(metricsQuery);
      const metrics = metricsSnapshot.docs.map(doc => doc.data().wordsLearnedToday || 0);

      if (metrics.length === 0) return 0;

      const activeDays = metrics.filter(words => words > 0).length;
      const totalPossibleDays = 30;

      return Math.round((activeDays / totalPossibleDays) * 100);
    } catch (error) {
      console.error('Error calculating consistency score:', error);
      return 0;
    }
  }

  // Data Retrieval
  async getPerformanceMetrics(userId: string, days: number = 30): Promise<PerformanceMetrics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metricsQuery = query(
        collection(db, 'analytics', userId, 'performance_metrics'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc')
      );

      const metricsSnapshot = await getDocs(metricsQuery);
      return metricsSnapshot.docs.map(doc => ({
        userId,
        date: doc.data().date.toDate(),
        ...doc.data(),
      })) as PerformanceMetrics[];
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }

  async getLearningSessions(userId: string, limitCount: number = 50): Promise<LearningSession[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'analytics', userId, 'learning_sessions'),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      return sessionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate(),
        } as LearningSession;
      });
    } catch (error) {
      console.error('Error getting learning sessions:', error);
      return [];
    }
  }

  async getLearningInsights(userId: string): Promise<LearningInsight[]> {
    try {
      const insightsQuery = query(
        collection(db, 'analytics', userId, 'insights'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const insightsSnapshot = await getDocs(insightsQuery);
      return insightsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as LearningInsight[];
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return [];
    }
  }

  // Analytics Calculations for AI
  async getUserLearningProfile(userId: string): Promise<any> {
    const metrics = await this.getPerformanceMetrics(userId, 90);
    const sessions = await this.getLearningSessions(userId, 100);

    return {
      averageAccuracy: metrics.reduce((sum, m) => sum + m.accuracyRate, 0) / metrics.length || 0,
      averageSessionLength: metrics.reduce((sum, m) => sum + m.averageSessionLength, 0) / metrics.length || 0,
      studyStreak: metrics[0]?.studyStreak || 0,
      consistencyScore: metrics[0]?.consistencyScore || 0,
      preferredStudyMode: this.getPreferredStudyMode(sessions),
      learningVelocity: metrics.reduce((sum, m) => sum + m.studyVelocity, 0) / metrics.length || 0,
      totalWordsLearned: metrics.reduce((sum, m) => sum + m.wordsLearnedToday, 0),
      totalStudyTime: sessions.reduce((sum, s) => sum + s.duration, 0),
    };
  }

  private getPreferredStudyMode(sessions: LearningSession[]): string {
    const modeCount: Record<string, number> = {};
    sessions.forEach(session => {
      modeCount[session.studyMode] = (modeCount[session.studyMode] || 0) + 1;
    });

    return Object.entries(modeCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'flashcard';
  }
}