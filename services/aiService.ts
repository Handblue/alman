import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AnalyticsService, LearningSession, PerformanceMetrics } from './analyticsService';
import { UNITS } from '../data/units';
import { WORDS } from '../data/words';

export interface Recommendation {
  id: string;
  userId: string;
  type: 'word' | 'unit' | 'category' | 'study_mode' | 'schedule';
  title: string;
  description: string;
  content: Record<string, unknown>;
  confidence: number; // 0-100
  reason: string;
  createdAt: Date;
  expiresAt?: Date;
  accepted?: boolean;
  acceptedAt?: Date;
}

export interface Prediction {
  id: string;
  userId: string;
  type: 'progress' | 'retention' | 'completion' | 'difficulty';
  title: string;
  description: string;
  predictedValue: Record<string, unknown>;
  confidence: number;
  timeFrame: 'day' | 'week' | 'month' | 'quarter';
  basedOn: string[];
  createdAt: Date;
  actualValue?: Record<string, unknown>;
  accuracy?: number;
}

export interface LearningPath {
  id: string;
  userId: string;
  name: string;
  description: string;
  units: string[];
  estimatedDuration: number; // in days
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focus: string[];
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
}

interface LearningProfile {
  userId: string;
  averageAccuracy: number;
  averageSessionLength: number;
  studyStreak: number;
  consistencyScore: number;
  preferredStudyMode: string;
  learningVelocity: number;
  totalWordsLearned: number;
  totalStudyTime: number;
}

interface WordProgressEntry {
  status: 'unknown' | 'learning' | 'known';
  correctCount?: number;
  incorrectCount?: number;
  lastReviewed?: number;
  easeFactor?: number;
  repetitions?: number;
}

interface LearningPatterns {
  consistencyBonus: number;
  masteryBonus: number;
  modePerformance: Record<string, { score: number; recency: number; count: number }>;
  recentAccuracy: number;
  learningVelocity: number;
  weakHours: number[];
}

export class AIService {
  private static instance: AIService;
  private analyticsService: AnalyticsService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  // ─── Recommendation Engine ───────────────────────────────────────────────

  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    const profile = await this.analyticsService.getUserLearningProfile(userId);
    const recentSessions = await this.analyticsService.getLearningSessions(userId, 20);
    const recentMetrics = await this.analyticsService.getPerformanceMetrics(userId, 7);

    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    const studyModeRec = this.recommendStudyMode(profile, recentSessions);
    if (studyModeRec) recommendations.push(studyModeRec);

    const contentRecs = await this.recommendContent(userId, recentSessions);
    recommendations.push(...contentRecs);

    const scheduleRec = this.recommendSchedule(profile, recentMetrics);
    if (scheduleRec) recommendations.push(scheduleRec);

    const difficultyRec = this.recommendDifficulty(userId, profile, recentMetrics);
    if (difficultyRec) recommendations.push(difficultyRec);

    const savedRecommendations: Recommendation[] = [];
    for (const rec of recommendations) {
      const recId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const fullRec: Recommendation = { ...rec, id: recId, createdAt: new Date() };

      try {
        await setDoc(doc(db, 'analytics', userId, 'recommendations', recId), {
          ...fullRec,
          createdAt: Timestamp.fromDate(fullRec.createdAt),
          expiresAt: fullRec.expiresAt ? Timestamp.fromDate(fullRec.expiresAt) : null,
          acceptedAt: fullRec.acceptedAt ? Timestamp.fromDate(fullRec.acceptedAt) : null,
        });
        savedRecommendations.push(fullRec);
      } catch (error) {
        console.error('Error saving recommendation:', error);
      }
    }

    return savedRecommendations;
  }

  private recommendStudyMode(
    profile: LearningProfile,
    sessions: LearningSession[]
  ): Omit<Recommendation, 'id' | 'createdAt'> | null {
    const modePerformance: Record<string, { accuracy: number; count: number }> = {};

    sessions.forEach(session => {
      if (!modePerformance[session.studyMode]) {
        modePerformance[session.studyMode] = { accuracy: 0, count: 0 };
      }
      const accuracy = session.totalAnswers > 0
        ? (session.correctAnswers / session.totalAnswers) * 100
        : 0;
      modePerformance[session.studyMode].accuracy += accuracy;
      modePerformance[session.studyMode].count += 1;
    });

    let bestMode = profile.preferredStudyMode;
    let bestScore = 0;

    Object.entries(modePerformance).forEach(([mode, data]) => {
      const avgAccuracy = data.accuracy / data.count;
      if (avgAccuracy > bestScore) {
        bestScore = avgAccuracy;
        bestMode = mode;
      }
    });

    if (bestMode !== profile.preferredStudyMode && bestScore > 70) {
      return {
        userId: profile.userId,
        type: 'study_mode',
        title: `Try ${bestMode.replace('_', ' ')} mode`,
        description: `Based on your recent performance, ${bestMode} mode might be more effective for you.`,
        content: { studyMode: bestMode },
        confidence: Math.min(bestScore, 95),
        reason: `Higher accuracy rate in ${bestMode} mode`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }

    return null;
  }

  private async recommendContent(
    userId: string,
    sessions: LearningSession[]
  ): Promise<Omit<Recommendation, 'id' | 'createdAt'>[]> {
    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    const { useProgressStore } = await import('../store/useProgressStore');
    const userProgress = useProgressStore.getState().wordProgress as Record<string, WordProgressEntry>;

    const learningPatterns = this.analyzeLearningPatterns(sessions, userProgress);

    const weakCategories = this.identifyWeakCategoriesAdvanced(userProgress, sessions);
    if (weakCategories.length > 0) {
      recommendations.push({
        userId,
        type: 'category',
        title: 'Focus on weak areas',
        description: `Strengthen your knowledge in ${weakCategories.slice(0, 2).join(' and ')}`,
        content: { categories: weakCategories },
        confidence: Math.min(95, 75 + learningPatterns.consistencyBonus),
        reason: 'Advanced pattern analysis shows these areas need attention',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
    }

    const spacedRepRecs = this.generateSpacedRepetitionRecommendations(userId, userProgress);
    recommendations.push(...spacedRepRecs);

    const nextUnits = this.recommendNextUnits(userProgress, learningPatterns);
    if (nextUnits.length > 0) {
      recommendations.push({
        userId,
        type: 'unit',
        title: 'Continue your progress',
        description: `Ready for ${nextUnits[0].title}?`,
        content: { units: nextUnits.map(u => u.id) },
        confidence: Math.min(95, 80 + learningPatterns.masteryBonus),
        reason: 'Based on your current mastery levels and learning velocity',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });
    }

    const wordRecs = this.recommendSpecificWords(userId, userProgress, sessions, learningPatterns);
    recommendations.push(...wordRecs);

    return recommendations;
  }

  private recommendSchedule(
    profile: LearningProfile,
    metrics: PerformanceMetrics[]
  ): Omit<Recommendation, 'id' | 'createdAt'> | null {
    const recentMetrics = metrics.slice(0, 7);
    const avgSessionLength =
      recentMetrics.reduce((sum, m) => sum + m.averageSessionLength, 0) / recentMetrics.length;

    if (profile.consistencyScore < 60) {
      return {
        userId: profile.userId,
        type: 'schedule',
        title: 'Build a study habit',
        description: `Try studying ${Math.round(avgSessionLength)} minutes daily to build consistency`,
        content: { suggestedDuration: Math.round(avgSessionLength), frequency: 'daily' },
        confidence: 80,
        reason: 'Consistency leads to better retention',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };
    }

    return null;
  }

  private recommendDifficulty(
    userId: string,
    profile: LearningProfile,
    metrics: PerformanceMetrics[]
  ): Omit<Recommendation, 'id' | 'createdAt'> | null {
    const recentAccuracy =
      metrics.slice(0, 3).reduce((sum, m) => sum + m.accuracyRate, 0) / 3;

    if (recentAccuracy > 85 && profile.averageAccuracy > 80) {
      return {
        userId,
        type: 'word',
        title: 'Ready for a challenge?',
        description: 'Your performance suggests you can handle more difficult content',
        content: { difficulty: 'hard' },
        confidence: Math.min(recentAccuracy, 95),
        reason: 'High accuracy indicates readiness for increased difficulty',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    } else if (recentAccuracy < 60) {
      return {
        userId,
        type: 'word',
        title: 'Take it step by step',
        description: 'Consider reviewing easier content to build confidence',
        content: { difficulty: 'easy' },
        confidence: 85,
        reason: 'Lower accuracy suggests need for easier content',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };
    }

    return null;
  }

  // ─── Prediction Engine ───────────────────────────────────────────────────

  async generatePredictions(userId: string): Promise<Prediction[]> {
    const profile = await this.analyticsService.getUserLearningProfile(userId);
    const metrics = await this.analyticsService.getPerformanceMetrics(userId, 30);
    const sessions = await this.analyticsService.getLearningSessions(userId, 50);

    const predictions: Omit<Prediction, 'id' | 'createdAt'>[] = [];

    const progressPred = this.predictProgress(profile, metrics);
    if (progressPred) predictions.push(progressPred);

    const retentionPred = this.predictRetention(profile, sessions);
    if (retentionPred) predictions.push(retentionPred);

    const completionPred = this.predictCompletion(profile, metrics);
    if (completionPred) predictions.push(completionPred);

    const savedPredictions: Prediction[] = [];
    for (const pred of predictions) {
      const predId = `pred_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const fullPred: Prediction = { ...pred, id: predId, createdAt: new Date() };

      try {
        await setDoc(doc(db, 'analytics', userId, 'predictions', predId), {
          ...fullPred,
          createdAt: Timestamp.fromDate(fullPred.createdAt),
        });
        savedPredictions.push(fullPred);
      } catch (error) {
        console.error('Error saving prediction:', error);
      }
    }

    return savedPredictions;
  }

  private predictProgress(
    profile: LearningProfile,
    metrics: PerformanceMetrics[]
  ): Omit<Prediction, 'id' | 'createdAt'> | null {
    if (metrics.length < 7) return null;

    const recentMetrics = metrics.slice(0, 7);
    const avgWordsPerDay =
      recentMetrics.reduce((sum, m) => sum + m.wordsLearnedToday, 0) / 7;
    const trend = this.calculateTrend(recentMetrics.map(m => m.wordsLearnedToday));

    const predictedWordsThisWeek = Math.max(
      0,
      Math.round(avgWordsPerDay * 7 * (1 + trend * 0.1))
    );
    const confidence = Math.min(85, 60 + Math.abs(trend) * 20);

    return {
      userId: profile.userId,
      type: 'progress',
      title: 'Weekly Progress Prediction',
      description: `Expected to learn ${predictedWordsThisWeek} words this week`,
      predictedValue: { wordsLearned: predictedWordsThisWeek },
      confidence,
      timeFrame: 'week',
      basedOn: ['recent_performance', 'learning_velocity', 'consistency'],
    };
  }

  private predictRetention(
    profile: LearningProfile,
    sessions: LearningSession[]
  ): Omit<Prediction, 'id' | 'createdAt'> | null {
    const recentSessions = sessions.slice(0, 10);
    if (recentSessions.length === 0) return null;

    const avgAccuracy =
      recentSessions.reduce((sum, s) => {
        const accuracy =
          s.totalAnswers > 0 ? (s.correctAnswers / s.totalAnswers) * 100 : 0;
        return sum + accuracy;
      }, 0) / recentSessions.length;

    const predictedRetention = Math.min(95, Math.max(60, avgAccuracy * 0.9 + 10));

    return {
      userId: profile.userId,
      type: 'retention',
      title: 'Memory Retention Forecast',
      description: `Expected to retain ${Math.round(predictedRetention)}% of learned words`,
      predictedValue: { retentionRate: Math.round(predictedRetention) },
      confidence: 75,
      timeFrame: 'month',
      basedOn: ['recent_accuracy', 'study_frequency', 'content_difficulty'],
    };
  }

  private predictCompletion(
    profile: LearningProfile,
    metrics: PerformanceMetrics[]
  ): Omit<Prediction, 'id' | 'createdAt'> | null {
    const totalWordsLearned = metrics.reduce((sum, m) => sum + m.wordsLearnedToday, 0);
    const avgWordsPerDay =
      metrics.slice(0, 30).reduce((sum, m) => sum + m.wordsLearnedToday, 0) / 30;

    const totalWords = WORDS.length;
    const remainingWords = Math.max(0, totalWords - totalWordsLearned);
    const estimatedDays = avgWordsPerDay > 0 ? remainingWords / avgWordsPerDay : 365;

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.round(estimatedDays));

    return {
      userId: profile.userId,
      type: 'completion',
      title: 'Course Completion Estimate',
      description: `Expected to complete all content by ${completionDate.toLocaleDateString()}`,
      predictedValue: { completionDate: completionDate.toISOString() },
      confidence: avgWordsPerDay > 5 ? 80 : 60,
      timeFrame: 'month',
      basedOn: ['current_progress', 'learning_velocity', 'consistency_score'],
    };
  }

  // ─── Advanced AI Methods ─────────────────────────────────────────────────

  private analyzeLearningPatterns(
    sessions: LearningSession[],
    userProgress: Record<string, WordProgressEntry>
  ): LearningPatterns {
    const recentSessions = sessions.slice(0, 20);

    const sessionDates = recentSessions.map(s => s.startTime.toDateString());
    const uniqueDays = new Set(sessionDates).size;
    const oldestSession = recentSessions[recentSessions.length - 1];
    const totalDays = oldestSession
      ? Math.ceil(
          (Date.now() - oldestSession.startTime.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 1;
    const consistencyRatio = uniqueDays / Math.max(totalDays, 1);
    const consistencyBonus = Math.min(20, consistencyRatio * 20);

    const totalWords = Object.keys(userProgress).length;
    const masteredWords = Object.values(userProgress).filter(
      p => p.status === 'known'
    ).length;
    const masteryRatio = masteredWords / Math.max(totalWords, 1);
    const masteryBonus = Math.min(15, masteryRatio * 15);

    const modePerformance: Record<
      string,
      { score: number; recency: number; count: number }
    > = {};
    recentSessions.forEach((session, index) => {
      const recencyWeight = 1 - index / recentSessions.length;
      const accuracy =
        session.totalAnswers > 0
          ? (session.correctAnswers / session.totalAnswers) * 100
          : 0;

      if (!modePerformance[session.studyMode]) {
        modePerformance[session.studyMode] = { score: 0, recency: 0, count: 0 };
      }
      modePerformance[session.studyMode].score +=
        (accuracy * 0.7 + session.engagement * 0.3) * recencyWeight;
      modePerformance[session.studyMode].recency += recencyWeight;
      modePerformance[session.studyMode].count += 1;
    });

    Object.keys(modePerformance).forEach(mode => {
      modePerformance[mode].score /= modePerformance[mode].recency;
    });

    return {
      consistencyBonus,
      masteryBonus,
      modePerformance,
      recentAccuracy:
        recentSessions.length > 0
          ? recentSessions
              .slice(0, 5)
              .reduce(
                (sum, s) =>
                  sum + s.correctAnswers / Math.max(s.totalAnswers, 1),
                0
              ) / 5
          : 0,
      learningVelocity: this.calculateLearningVelocity(sessions),
      weakHours: this.identifyWeakStudyHours(sessions),
    };
  }

  private calculateLearningVelocity(sessions: LearningSession[]): number {
    if (sessions.length < 2) return 1;
    const recentSessions = sessions.slice(0, 10);
    const totalWords = recentSessions.reduce(
      (sum, s) => sum + s.wordsStudied.length,
      0
    );
    const totalTime = recentSessions.reduce((sum, s) => sum + s.duration, 0);
    return totalTime > 0 ? totalWords / (totalTime / 60) : 1;
  }

  private identifyWeakStudyHours(sessions: LearningSession[]): number[] {
    const hourPerformance: Record<number, { accuracy: number; count: number }> = {};

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const accuracy =
        session.totalAnswers > 0
          ? (session.correctAnswers / session.totalAnswers) * 100
          : 0;

      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { accuracy: 0, count: 0 };
      }
      hourPerformance[hour].accuracy += accuracy;
      hourPerformance[hour].count += 1;
    });

    const entries = Object.entries(hourPerformance);
    if (entries.length === 0) return [];

    const avgAccuracy =
      entries.reduce((sum, [, data]) => sum + data.accuracy / data.count, 0) /
      entries.length;

    return entries
      .filter(([, data]) => data.accuracy / data.count < avgAccuracy * 0.8)
      .map(([hour]) => parseInt(hour, 10));
  }

  private identifyWeakCategoriesAdvanced(
    userProgress: Record<string, WordProgressEntry>,
    sessions: LearningSession[]
  ): string[] {
    const categoryPerformance: Record<
      string,
      { correct: number; total: number }
    > = {};

    sessions.slice(0, 15).forEach((session, index) => {
      const recencyWeight = 1 - index / 15;
      session.wordsStudied.forEach(wordId => {
        const category = this.getWordCategory(wordId);
        if (!categoryPerformance[category]) {
          categoryPerformance[category] = { correct: 0, total: 0 };
        }
        categoryPerformance[category].total += recencyWeight;
        const progress = userProgress[wordId];
        if (progress?.status === 'known') {
          categoryPerformance[category].correct += recencyWeight;
        }
      });
    });

    return Object.entries(categoryPerformance)
      .filter(([, data]) => data.total > 2 && data.correct / data.total < 0.7)
      .map(([category]) => category)
      .slice(0, 3);
  }

  private generateSpacedRepetitionRecommendations(
    userId: string,
    userProgress: Record<string, WordProgressEntry>
  ): Omit<Recommendation, 'id' | 'createdAt'>[] {
    const now = Date.now();
    const reviewCandidates: { wordId: string; daysOverdue: number }[] = [];

    Object.entries(userProgress).forEach(([wordId, progress]) => {
      if (progress.lastReviewed) {
        const daysSinceReview =
          (now - progress.lastReviewed) / (1000 * 60 * 60 * 24);
        const idealInterval = this.calculateIdealReviewInterval(
          progress.easeFactor ?? 2.5,
          progress.repetitions ?? 0
        );

        if (daysSinceReview > idealInterval * 0.9) {
          reviewCandidates.push({
            wordId,
            daysOverdue: daysSinceReview - idealInterval,
          });
        }
      }
    });

    reviewCandidates.sort((a, b) => b.daysOverdue - a.daysOverdue);

    if (reviewCandidates.length === 0) return [];

    const urgentReviews = reviewCandidates.slice(0, 5);
    return [
      {
        userId,
        type: 'word',
        title: 'Review time!',
        description: `${urgentReviews.length} words are ready for spaced repetition review`,
        content: {
          words: urgentReviews.map(r => r.wordId),
          reviewType: 'spaced',
        },
        confidence: Math.min(95, 70 + urgentReviews.length * 2),
        reason: 'Spaced repetition algorithm indicates optimal review timing',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ];
  }

  private calculateIdealReviewInterval(
    easeFactor: number,
    repetitions: number
  ): number {
    if (repetitions === 0) return 1;
    if (repetitions === 1) return 6;
    return Math.round(6 * Math.pow(easeFactor, repetitions - 1));
  }

  private recommendNextUnits(
    userProgress: Record<string, WordProgressEntry>,
    patterns: LearningPatterns
  ): typeof UNITS {
    const unitsWithMastery = UNITS.map(unit => {
      const unitWords = WORDS.filter(w => w.unitId === unit.id);
      const masteredCount = unitWords.filter(
        w => userProgress[w.id.toString()]?.status === 'known'
      ).length;
      const masteryLevel =
        unitWords.length > 0 ? masteredCount / unitWords.length : 0;
      return { unit, masteryLevel };
    });

    return unitsWithMastery
      .filter(({ masteryLevel }) => masteryLevel < 0.8)
      .sort((a, b) => {
        const aScore =
          a.masteryLevel * 0.5 +
          (1 - Math.abs(0.5 - patterns.recentAccuracy)) * 0.5;
        const bScore =
          b.masteryLevel * 0.5 +
          (1 - Math.abs(0.5 - patterns.recentAccuracy)) * 0.5;
        return bScore - aScore;
      })
      .slice(0, 3)
      .map(({ unit }) => unit);
  }

  private recommendSpecificWords(
    userId: string,
    userProgress: Record<string, WordProgressEntry>,
    sessions: LearningSession[],
    patterns: LearningPatterns
  ): Omit<Recommendation, 'id' | 'createdAt'>[] {
    const strugglingWords: {
      wordId: string;
      difficulty: number;
      urgency: number;
      category: string;
    }[] = [];

    Object.entries(userProgress).forEach(([wordId, progress]) => {
      const incorrectCount = progress.incorrectCount ?? 0;
      const correctCount = progress.correctCount ?? 0;
      if (
        progress.status === 'learning' ||
        incorrectCount > correctCount
      ) {
        const difficulty = this.assessWordDifficulty(wordId, sessions);
        const urgency = this.calculateReviewUrgency(progress);

        if (urgency > 0.7) {
          strugglingWords.push({
            wordId,
            difficulty,
            urgency,
            category: this.getWordCategory(wordId),
          });
        }
      }
    });

    const categoryGroups = strugglingWords.reduce(
      (groups: Record<string, typeof strugglingWords>, word) => {
        if (!groups[word.category]) groups[word.category] = [];
        groups[word.category].push(word);
        return groups;
      },
      {}
    );

    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    Object.entries(categoryGroups).forEach(([category, words]) => {
      if (words.length >= 3) {
        const avgDifficulty =
          words.reduce((sum, w) => sum + w.difficulty, 0) / words.length;
        const difficulty =
          avgDifficulty > 0.7 ? 'hard' : avgDifficulty > 0.4 ? 'medium' : 'easy';

        recommendations.push({
          userId,
          type: 'word',
          title: `${category} practice needed`,
          description: `${words.length} words in ${category} need focused practice`,
          content: {
            words: words.map(w => w.wordId),
            category,
            difficulty,
            focus: 'accuracy',
          },
          confidence: Math.min(90, 60 + words.length * 3),
          reason: `Pattern analysis shows difficulty with ${category} vocabulary`,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        });
      }
    });

    // suppress unused variable warning — patterns is reserved for future weighting
    void patterns;

    return recommendations;
  }

  private assessWordDifficulty(
    wordId: string,
    sessions: LearningSession[]
  ): number {
    let totalAttempts = 0;
    let correctAttempts = 0;

    sessions.forEach(session => {
      if (session.wordsStudied.includes(wordId)) {
        const attemptsPerWord =
          session.totalAnswers / Math.max(session.wordsStudied.length, 1);
        totalAttempts += attemptsPerWord;
        correctAttempts +=
          session.correctAnswers / Math.max(session.wordsStudied.length, 1);
      }
    });

    return totalAttempts > 0 ? 1 - correctAttempts / totalAttempts : 0.5;
  }

  private calculateReviewUrgency(progress: WordProgressEntry): number {
    const daysSinceLastReview = progress.lastReviewed
      ? (Date.now() - progress.lastReviewed) / (1000 * 60 * 60 * 24)
      : 30;

    const incorrectCount = progress.incorrectCount ?? 0;
    const correctCount = progress.correctCount ?? 0;
    const incorrectRatio =
      incorrectCount / Math.max(correctCount + incorrectCount, 1);
    const easeFactor = progress.easeFactor ?? 2.5;

    const timeFactor = Math.min(1, daysSinceLastReview / 30);
    const easeFactorNormalized = Math.max(0, (3 - easeFactor) / 2);

    return timeFactor * 0.4 + incorrectRatio * 0.4 + easeFactorNormalized * 0.2;
  }

  private getWordCategory(wordId: string): string {
    const word = WORDS.find(w => w.id === parseInt(wordId, 10));
    return word ? `category_${word.categoryId}` : 'general';
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  // ─── Public API Methods ──────────────────────────────────────────────────

  async getRecommendations(
    userId: string,
    limitCount: number = 10
  ): Promise<Recommendation[]> {
    try {
      const recsQuery = query(
        collection(db, 'analytics', userId, 'recommendations'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );
      const snapshot = await getDocs(recsQuery);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt.toDate(),
        expiresAt: d.data().expiresAt?.toDate(),
        acceptedAt: d.data().acceptedAt?.toDate(),
      })) as Recommendation[];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  async getPredictions(
    userId: string,
    limitCount: number = 10
  ): Promise<Prediction[]> {
    try {
      const predsQuery = query(
        collection(db, 'analytics', userId, 'predictions'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );
      const snapshot = await getDocs(predsQuery);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt.toDate(),
      })) as Prediction[];
    } catch (error) {
      console.error('Error getting predictions:', error);
      return [];
    }
  }

  async getLearningPaths(userId: string): Promise<LearningPath[]> {
    try {
      const pathsQuery = query(
        collection(db, 'analytics', userId, 'learning_paths'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(10)
      );
      const snapshot = await getDocs(pathsQuery);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt.toDate(),
        completedAt: d.data().completedAt?.toDate(),
      })) as LearningPath[];
    } catch (error) {
      console.error('Error getting learning paths:', error);
      return [];
    }
  }

  async acceptRecommendation(recId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'analytics', userId, 'recommendations', recId), {
      accepted: true,
      acceptedAt: Timestamp.fromDate(new Date()),
    });
  }

  async generateLearningPath(userId: string, focus: string[]): Promise<LearningPath> {
    const profile = await this.analyticsService.getUserLearningProfile(userId);

    const pathId = `path_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const units = this.selectUnitsForPath(focus);

    const learningPath: LearningPath = {
      id: pathId,
      userId,
      name: `${focus.join(' & ')} Learning Path`,
      description: `Personalized path focusing on ${focus.join(' and ')}`,
      units: units.map(u => String(u.id)),
      estimatedDuration: Math.ceil(units.length * 2.5),
      difficulty:
        profile.averageAccuracy > 80
          ? 'advanced'
          : profile.averageAccuracy > 60
          ? 'intermediate'
          : 'beginner',
      focus,
      progress: 0,
      createdAt: new Date(),
    };

    try {
      await setDoc(doc(db, 'analytics', userId, 'learning_paths', pathId), {
        ...learningPath,
        createdAt: Timestamp.fromDate(learningPath.createdAt),
        completedAt: learningPath.completedAt
          ? Timestamp.fromDate(learningPath.completedAt)
          : null,
      });
    } catch (error) {
      console.error('Error saving learning path:', error);
      throw error;
    }

    return learningPath;
  }

  private selectUnitsForPath(focus: string[]): typeof UNITS {
    // Filter units loosely matching focus categories; fall back to first two units
    const matched = UNITS.filter(u =>
      focus.some(f => u.title.toLowerCase().includes(f.toLowerCase()))
    );
    return matched.length > 0 ? matched.slice(0, 3) : UNITS.slice(0, 2);
  }
}
