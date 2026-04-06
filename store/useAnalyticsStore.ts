import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AnalyticsService, LearningSession, PerformanceMetrics, LearningInsight } from '../services/analyticsService';
import { AIService, Recommendation, Prediction, LearningPath } from '../services/aiService';
import { StreakService, StreakInsight } from '../services/streakService';

interface AnalyticsState {
  // Analytics Data
  performanceMetrics: PerformanceMetrics[];
  learningSessions: LearningSession[];
  learningInsights: LearningInsight[];

  // AI Data
  recommendations: Recommendation[];
  predictions: Prediction[];
  learningPaths: LearningPath[];

  // Streak AI
  streakInsights: StreakInsight | null;

  // Loading States
  loading: {
    metrics: boolean;
    sessions: boolean;
    insights: boolean;
    recommendations: boolean;
    predictions: boolean;
    paths: boolean;
    streak: boolean;
  };

  // Current Session
  currentSessionId: string | null;
  currentSessionStart: Date | null;

  // Actions
  startLearningSession: (studyMode: LearningSession['studyMode'], unitId?: string, folderId?: string) => Promise<void>;
  endLearningSession: (wordsStudied: string[], correctAnswers: number, totalAnswers: number, engagement: number, interruptions: number) => Promise<void>;
  loadAnalyticsData: (userId: string) => Promise<void>;
  loadAIData: (userId: string) => Promise<void>;
  loadStreakInsights: (userId: string) => Promise<void>;
  loadLearningPaths: (userId: string) => Promise<void>;
  acceptRecommendation: (recId: string) => Promise<void>;
  generateRecommendations: (userId: string) => Promise<void>;
  generatePredictions: (userId: string) => Promise<void>;
  createLearningPath: (userId: string, focus: string[]) => Promise<void>;
  refreshAnalytics: (userId: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    performanceMetrics: [],
    learningSessions: [],
    learningInsights: [],
    recommendations: [],
    predictions: [],
    learningPaths: [],
    streakInsights: null,
    loading: {
      metrics: false,
      sessions: false,
      insights: false,
      recommendations: false,
      predictions: false,
      paths: false,
      streak: false,
    },
    currentSessionId: null,
    currentSessionStart: null,

    // Actions
    startLearningSession: async (studyMode, unitId, folderId) => {
      try {
        const analyticsService = AnalyticsService.getInstance();
        const sessionId = await analyticsService.startLearningSession(studyMode, unitId, folderId);
        set({ currentSessionId: sessionId, currentSessionStart: new Date() });
      } catch (error) {
        console.error('Error starting learning session:', error);
        throw error;
      }
    },

    endLearningSession: async (wordsStudied, correctAnswers, totalAnswers, engagement, interruptions) => {
      const { currentSessionId } = get();
      if (!currentSessionId) throw new Error('No active learning session');

      try {
        const analyticsService = AnalyticsService.getInstance();
        await analyticsService.endLearningSession(
          currentSessionId, wordsStudied, correctAnswers, totalAnswers, engagement, interruptions
        );
        set({ currentSessionId: null, currentSessionStart: null });
      } catch (error) {
        console.error('Error ending learning session:', error);
        throw error;
      }
    },

    loadAnalyticsData: async (userId) => {
      set(state => ({
        loading: { ...state.loading, metrics: true, sessions: true, insights: true },
      }));
      try {
        const analyticsService = AnalyticsService.getInstance();
        const [metrics, sessions, insights] = await Promise.all([
          analyticsService.getPerformanceMetrics(userId, 30),
          analyticsService.getLearningSessions(userId, 50),
          analyticsService.getLearningInsights(userId),
        ]);
        set(state => ({
          performanceMetrics: metrics,
          learningSessions: sessions,
          learningInsights: insights,
          loading: { ...state.loading, metrics: false, sessions: false, insights: false },
        }));
      } catch (error) {
        console.error('Error loading analytics data:', error);
        set(state => ({
          loading: { ...state.loading, metrics: false, sessions: false, insights: false },
        }));
        throw error;
      }
    },

    loadAIData: async (userId) => {
      set(state => ({
        loading: { ...state.loading, recommendations: true, predictions: true, paths: true },
      }));
      try {
        const aiService = AIService.getInstance();
        const [recommendations, predictions, learningPaths] = await Promise.all([
          aiService.getRecommendations(userId),
          aiService.getPredictions(userId),
          aiService.getLearningPaths(userId),
        ]);
        set(state => ({
          recommendations,
          predictions,
          learningPaths,
          loading: { ...state.loading, recommendations: false, predictions: false, paths: false },
        }));
      } catch (error) {
        console.error('Error loading AI data:', error);
        set(state => ({
          loading: { ...state.loading, recommendations: false, predictions: false, paths: false },
        }));
        throw error;
      }
    },

    loadStreakInsights: async (userId) => {
      set(state => ({ loading: { ...state.loading, streak: true } }));
      try {
        const streakService = StreakService.getInstance();
        const streakInsights = await streakService.getStreakInsights(userId);
        set(state => ({
          streakInsights,
          loading: { ...state.loading, streak: false },
        }));
      } catch (error) {
        console.error('Error loading streak insights:', error);
        set(state => ({ loading: { ...state.loading, streak: false } }));
      }
    },

    loadLearningPaths: async (userId) => {
      set(state => ({ loading: { ...state.loading, paths: true } }));
      try {
        const aiService = AIService.getInstance();
        const learningPaths = await aiService.getLearningPaths(userId);
        set(state => ({
          learningPaths,
          loading: { ...state.loading, paths: false },
        }));
      } catch (error) {
        console.error('Error loading learning paths:', error);
        set(state => ({ loading: { ...state.loading, paths: false } }));
      }
    },

    acceptRecommendation: async (recId) => {
      try {
        const aiService = AIService.getInstance();
        await aiService.acceptRecommendation(recId);
        set(state => ({
          recommendations: state.recommendations.map(rec =>
            rec.id === recId ? { ...rec, accepted: true, acceptedAt: new Date() } : rec
          ),
        }));
      } catch (error) {
        console.error('Error accepting recommendation:', error);
        throw error;
      }
    },

    generateRecommendations: async (userId) => {
      set(state => ({ loading: { ...state.loading, recommendations: true } }));
      try {
        const aiService = AIService.getInstance();
        const newRecommendations = await aiService.generateRecommendations(userId);
        set(state => ({
          recommendations: [...newRecommendations, ...state.recommendations],
          loading: { ...state.loading, recommendations: false },
        }));
      } catch (error) {
        console.error('Error generating recommendations:', error);
        set(state => ({ loading: { ...state.loading, recommendations: false } }));
        throw error;
      }
    },

    generatePredictions: async (userId) => {
      set(state => ({ loading: { ...state.loading, predictions: true } }));
      try {
        const aiService = AIService.getInstance();
        const newPredictions = await aiService.generatePredictions(userId);
        set(state => ({
          predictions: [...newPredictions, ...state.predictions],
          loading: { ...state.loading, predictions: false },
        }));
      } catch (error) {
        console.error('Error generating predictions:', error);
        set(state => ({ loading: { ...state.loading, predictions: false } }));
        throw error;
      }
    },

    createLearningPath: async (userId, focus) => {
      set(state => ({ loading: { ...state.loading, paths: true } }));
      try {
        const aiService = AIService.getInstance();
        const newPath = await aiService.generateLearningPath(userId, focus);
        set(state => ({
          learningPaths: [newPath, ...state.learningPaths],
          loading: { ...state.loading, paths: false },
        }));
      } catch (error) {
        console.error('Error creating learning path:', error);
        set(state => ({ loading: { ...state.loading, paths: false } }));
        throw error;
      }
    },

    refreshAnalytics: async (userId) => {
      await Promise.all([
        get().loadAnalyticsData(userId),
        get().loadAIData(userId),
        get().loadStreakInsights(userId),
      ]);
    },
  }))
);

// ─── Selectors ───────────────────────────────────────────────────────────────

export const useAnalyticsLoading = () => useAnalyticsStore(state => state.loading);
export const useCurrentSession = () =>
  useAnalyticsStore(state => ({
    sessionId: state.currentSessionId,
    startTime: state.currentSessionStart,
  }));
export const usePerformanceMetrics = () => useAnalyticsStore(state => state.performanceMetrics);
export const useLearningSessions = () => useAnalyticsStore(state => state.learningSessions);
export const useRecommendations = () => useAnalyticsStore(state => state.recommendations);
export const usePredictions = () => useAnalyticsStore(state => state.predictions);
export const useLearningPaths = () => useAnalyticsStore(state => state.learningPaths);
export const useStreakInsights = () => useAnalyticsStore(state => state.streakInsights);

// ─── Computed Selectors ───────────────────────────────────────────────────────

export const useTodayMetrics = () => {
  const metrics = usePerformanceMetrics();
  const today = new Date().toISOString().split('T')[0];
  return metrics.find(m => m.date.toISOString().split('T')[0] === today);
};

export const useWeeklyProgress = () => {
  const metrics = usePerformanceMetrics();
  const last7 = metrics.slice(0, 7);
  return {
    totalWords: last7.reduce((sum, m) => sum + m.wordsLearnedToday, 0),
    averageAccuracy: last7.length > 0
      ? last7.reduce((sum, m) => sum + m.accuracyRate, 0) / last7.length
      : 0,
    averageSessionLength: last7.length > 0
      ? last7.reduce((sum, m) => sum + m.averageSessionLength, 0) / last7.length
      : 0,
    studyStreak: last7[0]?.studyStreak || 0,
    dailyWords: last7.map(m => m.wordsLearnedToday).reverse(),
    dailyAccuracy: last7.map(m => m.accuracyRate).reverse(),
  };
};

export const useActiveRecommendations = () => {
  const recommendations = useRecommendations();
  const now = new Date();
  return recommendations.filter(
    rec => !rec.accepted && (!rec.expiresAt || rec.expiresAt > now)
  );
};

export const useTopRecommendations = () => {
  const activeRecs = useActiveRecommendations();
  return activeRecs.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
};
