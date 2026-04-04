import { collection, doc, setDoc, updateDoc, getDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { AnalyticsService, LearningSession, PerformanceMetrics } from './analyticsService';

export interface Recommendation {
  id: string;
  userId: string;
  type: 'word' | 'unit' | 'category' | 'study_mode' | 'schedule';
  title: string;
  description: string;
  content: any; // word IDs, unit IDs, etc.
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
  predictedValue: any;
  confidence: number;
  timeFrame: 'day' | 'week' | 'month' | 'quarter';
  basedOn: string[]; // factors used for prediction
  createdAt: Date;
  actualValue?: any;
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
  focus: string[]; // categories or skills
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
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

  // Recommendation Engine
  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    const profile = await this.analyticsService.getUserLearningProfile(userId);
    const recentSessions = await this.analyticsService.getLearningSessions(userId, 20);
    const recentMetrics = await this.analyticsService.getPerformanceMetrics(userId, 7);

    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    // Study mode recommendations
    const studyModeRec = this.recommendStudyMode(profile, recentSessions);
    if (studyModeRec) recommendations.push(studyModeRec);

    // Content recommendations
    const contentRecs = await this.recommendContent(userId, profile, recentSessions);
    recommendations.push(...contentRecs);

    // Schedule recommendations
    const scheduleRec = this.recommendSchedule(profile, recentMetrics);
    if (scheduleRec) recommendations.push(scheduleRec);

    // Difficulty adjustment
    const difficultyRec = this.recommendDifficulty(profile, recentMetrics);
    if (difficultyRec) recommendations.push(difficultyRec);

    // Save recommendations to Firebase
    const savedRecommendations: Recommendation[] = [];
    for (const rec of recommendations) {
      const recId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullRec: Recommendation = {
        ...rec,
        id: recId,
        createdAt: new Date(),
      };

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

  private recommendStudyMode(profile: any, sessions: LearningSession[]): Omit<Recommendation, 'id' | 'createdAt'> | null {
    const modePerformance: Record<string, { accuracy: number, count: number }> = {};

    sessions.forEach(session => {
      if (!modePerformance[session.studyMode]) {
        modePerformance[session.studyMode] = { accuracy: 0, count: 0 };
      }
      const accuracy = session.totalAnswers > 0 ? (session.correctAnswers / session.totalAnswers) * 100 : 0;
      modePerformance[session.studyMode].accuracy += accuracy;
      modePerformance[session.studyMode].count += 1;
    });

    // Find best performing mode
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
    }

    return null;
  }

  private recommendContent(
    userId: string,
    profile: any,
    sessions: LearningSession[]
  ): Promise<Omit<Recommendation, 'id' | 'createdAt'>[]> {
    // Enhanced content recommendation with machine learning-like algorithms
    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    // Get user's progress data
    const progressStore = (await import('../store/useProgressStore')).useProgressStore.getState();
    const userProgress = progressStore.getUserProgress(userId);

    // Analyze learning patterns
    const learningPatterns = this.analyzeLearningPatterns(sessions, userProgress);

    // Weak categories analysis
    const weakCategories = this.identifyWeakCategoriesAdvanced(userProgress, sessions, learningPatterns);
    if (weakCategories.length > 0) {
      recommendations.push({
        userId,
        type: 'category',
        title: 'Focus on weak areas',
        description: `Strengthen your knowledge in ${weakCategories.slice(0, 2).join(' and ')}`,
        content: { categories: weakCategories },
        confidence: Math.min(95, 75 + learningPatterns.consistencyBonus),
        reason: 'Advanced pattern analysis shows these areas need attention',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });
    }

    // Spaced repetition recommendations
    const spacedRepRecs = this.generateSpacedRepetitionRecommendations(userProgress, sessions);
    recommendations.push(...spacedRepRecs);

    // Next units based on mastery levels
    const nextUnits = this.recommendNextUnitsAdvanced(userProgress, learningPatterns);
    if (nextUnits.length > 0) {
      recommendations.push({
        userId,
        type: 'unit',
        title: 'Continue your progress',
        description: `Ready for ${nextUnits[0].name}? (${nextUnits[0].estimatedDifficulty})`,
        content: { units: nextUnits.map(u => u.id) },
        confidence: Math.min(95, 80 + learningPatterns.masteryBonus),
        reason: 'Based on your current mastery levels and learning velocity',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      });
    }

    // Word-specific recommendations
    const wordRecs = this.recommendSpecificWords(userProgress, sessions, learningPatterns);
    recommendations.push(...wordRecs);

    return recommendations;
  }

  private recommendSchedule(profile: any, metrics: PerformanceMetrics[]): Omit<Recommendation, 'id' | 'createdAt'> | null {
    const recentMetrics = metrics.slice(0, 7);
    const avgSessionLength = recentMetrics.reduce((sum, m) => sum + m.averageSessionLength, 0) / recentMetrics.length;

    if (profile.consistencyScore < 60) {
      return {
        userId: profile.userId,
        type: 'schedule',
        title: 'Build a study habit',
        description: `Try studying ${Math.round(avgSessionLength)} minutes daily to build consistency`,
        content: {
          suggestedDuration: Math.round(avgSessionLength),
          frequency: 'daily'
        },
        confidence: 80,
        reason: 'Consistency leads to better retention',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      };
    }

    return null;
  }

  private recommendDifficulty(profile: any, metrics: PerformanceMetrics[]): Omit<Recommendation, 'id' | 'createdAt'> | null {
    const recentAccuracy = metrics.slice(0, 3).reduce((sum, m) => sum + m.accuracyRate, 0) / 3;

    if (recentAccuracy > 85 && profile.averageAccuracy > 80) {
      return {
        userId,
        type: 'word',
        title: 'Ready for a challenge?',
        description: 'Your performance suggests you can handle more difficult content',
        content: { difficulty: 'hard' },
        confidence: Math.min(recentAccuracy, 95),
        reason: 'High accuracy indicates readiness for increased difficulty',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      };
    }

    return null;
  }

  // Prediction Engine
  async generatePredictions(userId: string): Promise<Prediction[]> {
    const profile = await this.analyticsService.getUserLearningProfile(userId);
    const metrics = await this.analyticsService.getPerformanceMetrics(userId, 30);
    const sessions = await this.analyticsService.getLearningSessions(userId, 50);

    const predictions: Omit<Prediction, 'id' | 'createdAt'>[] = [];

    // Progress prediction
    const progressPred = this.predictProgress(profile, metrics);
    if (progressPred) predictions.push(progressPred);

    // Retention prediction
    const retentionPred = this.predictRetention(profile, sessions);
    if (retentionPred) predictions.push(retentionPred);

    // Completion prediction
    const completionPred = this.predictCompletion(profile, metrics);
    if (completionPred) predictions.push(completionPred);

    // Save predictions to Firebase
    const savedPredictions: Prediction[] = [];
    for (const pred of predictions) {
      const predId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullPred: Prediction = {
        ...pred,
        id: predId,
        createdAt: new Date(),
      };

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

  private predictProgress(profile: any, metrics: PerformanceMetrics[]): Omit<Prediction, 'id' | 'createdAt'> | null {
    if (metrics.length < 7) return null;

    const recentMetrics = metrics.slice(0, 7);
    const avgWordsPerDay = recentMetrics.reduce((sum, m) => sum + m.wordsLearnedToday, 0) / 7;
    const trend = this.calculateTrend(recentMetrics.map(m => m.wordsLearnedToday));

    const predictedWordsThisWeek = Math.max(0, Math.round(avgWordsPerDay * 7 * (1 + trend * 0.1)));
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

  private predictRetention(profile: any, sessions: LearningSession[]): Omit<Prediction, 'id' | 'createdAt'> | null {
    const recentSessions = sessions.slice(0, 10);
    const avgAccuracy = recentSessions.reduce((sum, s) => {
      const accuracy = s.totalAnswers > 0 ? (s.correctAnswers / s.totalAnswers) * 100 : 0;
      return sum + accuracy;
    }, 0) / recentSessions.length;

    // Simple retention model: accuracy correlates with retention
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

  private predictCompletion(profile: any, metrics: PerformanceMetrics[]): Omit<Prediction, 'id' | 'createdAt'> | null {
    const totalWordsLearned = metrics.reduce((sum, m) => sum + m.wordsLearnedToday, 0);
    const avgWordsPerDay = metrics.slice(0, 30).reduce((sum, m) => sum + m.wordsLearnedToday, 0) / 30;

    // Assume target is 2000 words for completion
    const remainingWords = Math.max(0, 2000 - totalWordsLearned);
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

  // Advanced AI Methods
  private analyzeLearningPatterns(sessions: LearningSession[], userProgress: any): any {
    // Analyze learning patterns for better recommendations
    const recentSessions = sessions.slice(0, 20); // Last 20 sessions

    // Calculate consistency bonus
    const sessionDates = recentSessions.map(s => s.startTime.toDateString());
    const uniqueDays = new Set(sessionDates).size;
    const totalDays = Math.ceil((Date.now() - recentSessions[recentSessions.length - 1]?.startTime.toMillis()) / (1000 * 60 * 60 * 24));
    const consistencyRatio = uniqueDays / Math.max(totalDays, 1);
    const consistencyBonus = Math.min(20, consistencyRatio * 20);

    // Calculate mastery bonus based on overall progress
    const totalWords = Object.keys(userProgress).length;
    const masteredWords = Object.values(userProgress).filter((p: any) => p.status === 'known').length;
    const masteryRatio = masteredWords / Math.max(totalWords, 1);
    const masteryBonus = Math.min(15, masteryRatio * 15);

    // Analyze study mode preferences with time-based weighting
    const modePerformance: Record<string, { score: number, recency: number, count: number }> = {};
    recentSessions.forEach((session, index) => {
      const recencyWeight = 1 - (index / recentSessions.length); // More recent sessions have higher weight
      const accuracy = session.totalAnswers > 0 ? (session.correctAnswers / session.totalAnswers) * 100 : 0;
      const engagement = session.engagement;

      if (!modePerformance[session.studyMode]) {
        modePerformance[session.studyMode] = { score: 0, recency: 0, count: 0 };
      }

      modePerformance[session.studyMode].score += (accuracy * 0.7 + engagement * 0.3) * recencyWeight;
      modePerformance[session.studyMode].recency += recencyWeight;
      modePerformance[session.studyMode].count += 1;
    });

    // Calculate average scores
    Object.keys(modePerformance).forEach(mode => {
      modePerformance[mode].score /= modePerformance[mode].recency;
    });

    return {
      consistencyBonus,
      masteryBonus,
      modePerformance,
      recentAccuracy: recentSessions.length > 0 ?
        recentSessions.slice(0, 5).reduce((sum, s) => sum + (s.correctAnswers / Math.max(s.totalAnswers, 1)), 0) / 5 : 0,
      learningVelocity: this.calculateLearningVelocity(sessions),
      weakHours: this.identifyWeakStudyHours(sessions),
    };
  }

  private calculateLearningVelocity(sessions: LearningSession[]): number {
    if (sessions.length < 2) return 1;

    const recentSessions = sessions.slice(0, 10);
    const totalWords = recentSessions.reduce((sum, s) => sum + s.wordsStudied.length, 0);
    const totalTime = recentSessions.reduce((sum, s) => sum + s.duration, 0);

    return totalTime > 0 ? totalWords / (totalTime / 60) : 1; // words per hour
  }

  private identifyWeakStudyHours(sessions: LearningSession[]): number[] {
    const hourPerformance: Record<number, { accuracy: number, count: number }> = {};

    sessions.forEach(session => {
      const hour = session.startTime.toDate().getHours();
      const accuracy = session.totalAnswers > 0 ? (session.correctAnswers / session.totalAnswers) * 100 : 0;

      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { accuracy: 0, count: 0 };
      }

      hourPerformance[hour].accuracy += accuracy;
      hourPerformance[hour].count += 1;
    });

    // Find hours with below-average performance
    const avgAccuracy = Object.values(hourPerformance).reduce((sum, h) => sum + (h.accuracy / h.count), 0) /
                       Object.keys(hourPerformance).length;

    return Object.entries(hourPerformance)
      .filter(([, data]) => (data.accuracy / data.count) < avgAccuracy * 0.8)
      .map(([hour]) => parseInt(hour));
  }

  private identifyWeakCategoriesAdvanced(userProgress: any, sessions: LearningSession[], patterns: any): string[] {
    const categoryPerformance: Record<string, { correct: number, total: number, recency: number }> = {};

    // Analyze performance by category from recent sessions
    sessions.slice(0, 15).forEach((session, index) => {
      const recencyWeight = 1 - (index / 15);
      session.wordsStudied.forEach(wordId => {
        // Get word category (simplified - would need actual word data)
        const category = this.getWordCategory(wordId);

        if (!categoryPerformance[category]) {
          categoryPerformance[category] = { correct: 0, total: 0, recency: 0 };
        }

        categoryPerformance[category].total += recencyWeight;
        categoryPerformance[category].recency += recencyWeight;

        // Check if word was answered correctly (simplified logic)
        const progress = userProgress[wordId];
        if (progress && progress.status === 'known') {
          categoryPerformance[category].correct += recencyWeight;
        }
      });
    });

    // Calculate accuracy rates and find weak categories
    const weakCategories: string[] = [];
    Object.entries(categoryPerformance).forEach(([category, data]) => {
      const accuracy = data.correct / data.total;
      if (accuracy < 0.7 && data.total > 2) { // Less than 70% accuracy and enough data
        weakCategories.push(category);
      }
    });

    return weakCategories.slice(0, 3); // Return top 3 weak categories
  }

  private generateSpacedRepetitionRecommendations(userProgress: any, sessions: LearningSession[]): Omit<Recommendation, 'id' | 'createdAt'>[] {
    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    // Find words that need review based on spaced repetition algorithm
    const now = Date.now();
    const reviewCandidates: any[] = [];

    Object.entries(userProgress).forEach(([wordId, progress]: [string, any]) => {
      if (progress.lastReviewed) {
        const daysSinceReview = (now - progress.lastReviewed) / (1000 * 60 * 60 * 24);
        const idealReviewInterval = this.calculateIdealReviewInterval(progress.easeFactor || 2.5, progress.repetitions || 0);

        if (daysSinceReview > idealReviewInterval * 0.9) { // Due for review
          reviewCandidates.push({
            wordId,
            daysOverdue: daysSinceReview - idealReviewInterval,
            easeFactor: progress.easeFactor || 2.5,
            repetitions: progress.repetitions || 0
          });
        }
      }
    });

    // Sort by urgency and take top recommendations
    reviewCandidates.sort((a, b) => b.daysOverdue - a.daysOverdue);

    if (reviewCandidates.length > 0) {
      const urgentReviews = reviewCandidates.slice(0, 5);
      recommendations.push({
        userId: 'current-user', // Will be set by caller
        type: 'word',
        title: 'Review time!',
        description: `${urgentReviews.length} words are ready for spaced repetition review`,
        content: { words: urgentReviews.map(r => r.wordId), reviewType: 'spaced' },
        confidence: Math.min(95, 70 + urgentReviews.length * 2),
        reason: 'Spaced repetition algorithm indicates optimal review timing',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      });
    }

    return recommendations;
  }

  private calculateIdealReviewInterval(easeFactor: number, repetitions: number): number {
    // Simplified SM-2 algorithm
    if (repetitions === 0) return 1;
    if (repetitions === 1) return 6;
    return Math.round(6 * Math.pow(easeFactor, repetitions - 1));
  }

  private recommendNextUnitsAdvanced(userProgress: any, patterns: any): any[] {
    // Advanced unit recommendation based on mastery levels and learning patterns
    const units = (global as any).UNITS || []; // Would need to import properly

    const unitMastery: any[] = units.map(unit => {
      const unitWords = unit.words || [];
      const masteredCount = unitWords.filter((wordId: string) =>
        userProgress[wordId]?.status === 'known'
      ).length;

      const masteryLevel = unitWords.length > 0 ? masteredCount / unitWords.length : 0;

      return {
        ...unit,
        masteryLevel,
        estimatedDifficulty: this.estimateUnitDifficulty(unit, patterns),
        prerequisiteReady: this.checkPrerequisites(unit, userProgress)
      };
    });

    // Find units that are ready to learn
    const readyUnits = unitMastery
      .filter(unit => unit.prerequisiteReady && unit.masteryLevel < 0.8)
      .sort((a, b) => {
        // Prioritize based on difficulty match and progress
        const aScore = a.masteryLevel * 0.3 + (1 - Math.abs(a.estimatedDifficulty - patterns.recentAccuracy / 100)) * 0.4 + a.prerequisiteReady * 0.3;
        const bScore = b.masteryLevel * 0.3 + (1 - Math.abs(b.estimatedDifficulty - patterns.recentAccuracy / 100)) * 0.4 + b.prerequisiteReady * 0.3;
        return bScore - aScore;
      });

    return readyUnits.slice(0, 3);
  }

  private estimateUnitDifficulty(unit: any, patterns: any): number {
    // Estimate difficulty based on unit characteristics and user patterns
    const baseDifficulty = unit.difficulty || 0.5;
    const velocityAdjustment = patterns.learningVelocity > 2 ? 0.1 : patterns.learningVelocity < 1 ? -0.1 : 0;
    const consistencyAdjustment = patterns.consistencyBonus > 10 ? 0.05 : 0;

    return Math.max(0.1, Math.min(0.9, baseDifficulty + velocityAdjustment + consistencyAdjustment));
  }

  private checkPrerequisites(unit: any, userProgress: any): boolean {
    // Check if user has mastered prerequisite units
    if (!unit.prerequisites) return true;

    return unit.prerequisites.every((prereqId: string) => {
      const prereqUnit = (global as any).UNITS?.find((u: any) => u.id === prereqId);
      if (!prereqUnit) return true;

      const prereqWords = prereqUnit.words || [];
      const masteredCount = prereqWords.filter((wordId: string) =>
        userProgress[wordId]?.status === 'known'
      ).length;

      return prereqWords.length > 0 && (masteredCount / prereqWords.length) > 0.7;
    });
  }

  private recommendSpecificWords(userProgress: any, sessions: LearningSession[], patterns: any): Omit<Recommendation, 'id' | 'createdAt'>[] {
    const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];

    // Find words that user struggles with but could benefit from focused practice
    const strugglingWords: any[] = [];

    Object.entries(userProgress).forEach(([wordId, progress]: [string, any]) => {
      if (progress.status === 'learning' || progress.incorrectCount > progress.correctCount) {
        const difficulty = this.assessWordDifficulty(wordId, sessions);
        const reviewUrgency = this.calculateReviewUrgency(progress, patterns);

        if (reviewUrgency > 0.7) {
          strugglingWords.push({
            wordId,
            difficulty,
            urgency: reviewUrgency,
            category: this.getWordCategory(wordId)
          });
        }
      }
    });

    // Group by category and recommend focused practice
    const categoryGroups = strugglingWords.reduce((groups, word) => {
      if (!groups[word.category]) groups[word.category] = [];
      groups[word.category].push(word);
      return groups;
    }, {} as Record<string, any[]>);

    Object.entries(categoryGroups).forEach(([category, words]) => {
      if (words.length >= 3) {
        const avgDifficulty = words.reduce((sum, w) => sum + w.difficulty, 0) / words.length;
        const difficulty = avgDifficulty > 0.7 ? 'hard' : avgDifficulty > 0.4 ? 'medium' : 'easy';

        recommendations.push({
          userId: 'current-user',
          type: 'word',
          title: `${category} practice needed`,
          description: `${words.length} words in ${category} need focused practice`,
          content: {
            words: words.map(w => w.wordId),
            category,
            difficulty,
            focus: 'accuracy'
          },
          confidence: Math.min(90, 60 + words.length * 3),
          reason: `Pattern analysis shows difficulty with ${category} vocabulary`,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        });
      }
    });

    return recommendations;
  }

  private assessWordDifficulty(wordId: string, sessions: LearningSession[]): number {
    // Assess word difficulty based on session performance
    let totalAttempts = 0;
    let correctAttempts = 0;

    sessions.forEach(session => {
      if (session.wordsStudied.includes(wordId)) {
        totalAttempts += session.totalAnswers / session.wordsStudied.length; // Estimate attempts per word
        correctAttempts += session.correctAnswers / session.wordsStudied.length;
      }
    });

    return totalAttempts > 0 ? 1 - (correctAttempts / totalAttempts) : 0.5;
  }

  private calculateReviewUrgency(progress: any, patterns: any): number {
    const daysSinceLastReview = progress.lastReviewed ?
      (Date.now() - progress.lastReviewed) / (1000 * 60 * 60 * 24) : 30;

    const incorrectRatio = progress.incorrectCount / Math.max(progress.correctCount + progress.incorrectCount, 1);
    const easeFactor = progress.easeFactor || 2.5;

    // Urgency increases with time since review, incorrect ratio, and low ease factor
    const timeFactor = Math.min(1, daysSinceLastReview / 30);
    const accuracyFactor = incorrectRatio;
    const easeFactorNormalized = Math.max(0, (3 - easeFactor) / 2); // Lower ease = higher urgency

    return (timeFactor * 0.4 + accuracyFactor * 0.4 + easeFactorNormalized * 0.2);
  }

  private getWordCategory(wordId: string): string {
    // Simplified category detection - would need actual word data
    const wordData = (global as any).WORDS?.find((w: any) => w.id === wordId);
    return wordData?.category || 'general';
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  // Public API Methods
  async getRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    try {
      const recsQuery = query(
        collection(db, 'analytics', userId, 'recommendations'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const recsSnapshot = await getDocs(recsQuery);
      return recsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
      })) as Recommendation[];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  async getPredictions(userId: string, limit: number = 10): Promise<Prediction[]> {
    try {
      const predsQuery = query(
        collection(db, 'analytics', userId, 'predictions'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const predsSnapshot = await getDocs(predsQuery);
      return predsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Prediction[];
    } catch (error) {
      console.error('Error getting predictions:', error);
      return [];
    }
  }

  async acceptRecommendation(recId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    try {
      await updateDoc(doc(db, 'analytics', userId, 'recommendations', recId), {
        accepted: true,
        acceptedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      throw error;
    }
  }

  async generateLearningPath(userId: string, focus: string[]): Promise<LearningPath> {
    const profile = await this.analyticsService.getUserLearningProfile(userId);

    // Generate personalized learning path based on user profile and focus areas
    const pathId = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const units = this.selectUnitsForPath(profile, focus);

    const learningPath: LearningPath = {
      id: pathId,
      userId,
      name: `${focus.join(' & ')} Learning Path`,
      description: `Personalized path focusing on ${focus.join(' and ')}`,
      units: units.map(u => u.id),
      estimatedDuration: Math.ceil(units.length * 2.5), // ~2.5 days per unit
      difficulty: profile.averageAccuracy > 80 ? 'advanced' : profile.averageAccuracy > 60 ? 'intermediate' : 'beginner',
      focus,
      progress: 0,
      createdAt: new Date(),
    };

    try {
      await setDoc(doc(db, 'analytics', userId, 'learning_paths', pathId), {
        ...learningPath,
        createdAt: Timestamp.fromDate(learningPath.createdAt),
        completedAt: learningPath.completedAt ? Timestamp.fromDate(learningPath.completedAt) : null,
      });
    } catch (error) {
      console.error('Error saving learning path:', error);
      throw error;
    }

    return learningPath;
  }

  private selectUnitsForPath(profile: any, focus: string[]): any[] {
    // This would intelligently select units based on user profile and focus
    // For now, return example units
    return [
      { id: 'unit_1', name: 'Basic Vocabulary' },
      { id: 'unit_2', name: 'Common Phrases' },
    ];
  }
}