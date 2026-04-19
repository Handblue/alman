import { useState, useEffect, useCallback } from 'react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { useUserStore } from '../store/useUserStore';
import { AIService, Recommendation, Prediction } from '../services/aiService';

export interface UseAIRecommendationsOptions {
  autoLoad?: boolean;
  refreshInterval?: number; // in minutes
  filterByType?: string[];
  minConfidence?: number;
}

export interface UseAIRecommendationsReturn {
  recommendations: Recommendation[];
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  acceptRecommendation: (recId: string) => Promise<void>;
  dismissRecommendation: (recId: string) => Promise<void>;
  getRecommendationsByType: (type: string) => Recommendation[];
  getTopRecommendations: (limit?: number) => Recommendation[];
}

export const useAIRecommendations = (
  options: UseAIRecommendationsOptions = {}
): UseAIRecommendationsReturn => {
  const {
    autoLoad = true,
    refreshInterval = 60, // 1 hour
    filterByType,
    minConfidence = 0
  } = options;

  const {
    recommendations: storeRecommendations,
    predictions: storePredictions,
    loading: loadingState,
    loadAIData,
    acceptRecommendation: storeAcceptRecommendation,
    generateRecommendations,
    generatePredictions
  } = useAnalyticsStore();

  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const userState = useUserStore() as ReturnType<typeof useUserStore> & { user?: { id?: string } };
  const userId = userState.user?.id ?? null;

  // Filter recommendations based on options
  const recommendations = storeRecommendations.filter(rec => {
    if (filterByType && !filterByType.includes(rec.type)) return false;
    if (rec.confidence < minConfidence) return false;
    if (rec.expiresAt && rec.expiresAt < new Date()) return false;
    return !rec.accepted;
  });

  const predictions = storePredictions.filter(pred => {
    if (pred.confidence < minConfidence) return false;
    return true;
  });

  // Auto-load data when user is available
  useEffect(() => {
    if (autoLoad && userId) {
      Promise.resolve(loadAIData(userId)).catch(err => {
        console.error('Error loading AI data:', err);
        setError('Failed to load AI recommendations');
      });
    }
  }, [autoLoad, userId, loadAIData]);

  // Auto-refresh data at specified interval
  useEffect(() => {
    if (!refreshInterval || !userId) return;

    const interval = setInterval(async () => {
      try {
        await refresh();
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Error refreshing AI data:', err);
      }
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setError(null);
    try {
      await Promise.all([
        loadAIData(userId),
        generateRecommendations(userId),
        generatePredictions(userId)
      ]);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error refreshing AI data:', err);
      setError('Failed to refresh AI recommendations');
      throw err;
    }
  }, [userId, loadAIData, generateRecommendations, generatePredictions]);

  const acceptRecommendation = useCallback(async (recId: string) => {
    try {
      await storeAcceptRecommendation(recId);
    } catch (err) {
      console.error('Error accepting recommendation:', err);
      setError('Failed to accept recommendation');
      throw err;
    }
  }, [storeAcceptRecommendation]);

  const dismissRecommendation = useCallback(async (recId: string) => {
    // For now, just mark as accepted (could be extended to have a dismissed state)
    try {
      await storeAcceptRecommendation(recId);
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
      setError('Failed to dismiss recommendation');
      throw err;
    }
  }, [storeAcceptRecommendation]);

  const getRecommendationsByType = useCallback((type: string): Recommendation[] => {
    return recommendations.filter(rec => rec.type === type);
  }, [recommendations]);

  const getTopRecommendations = useCallback((limit: number = 5): Recommendation[] => {
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }, [recommendations]);

  return {
    recommendations,
    predictions,
    loading: loadingState.recommendations || loadingState.predictions || loadingState.paths,
    error,
    refresh,
    acceptRecommendation,
    dismissRecommendation,
    getRecommendationsByType,
    getTopRecommendations
  };
};

// Specialized hooks for specific use cases
export const useStudyRecommendations = () => {
  return useAIRecommendations({
    filterByType: ['study_mode', 'word', 'unit'],
    minConfidence: 70,
    refreshInterval: 30 // Refresh every 30 minutes during study
  });
};

export const useContentRecommendations = () => {
  return useAIRecommendations({
    filterByType: ['unit', 'category'],
    minConfidence: 75,
    refreshInterval: 60
  });
};

export const usePerformancePredictions = () => {
  const { predictions, loading, error } = useAIRecommendations({
    minConfidence: 60,
    refreshInterval: 120 // Refresh every 2 hours
  });

  const getProgressPrediction = useCallback(() => {
    return predictions.find(p => p.type === 'progress');
  }, [predictions]);

  const getRetentionPrediction = useCallback(() => {
    return predictions.find(p => p.type === 'retention');
  }, [predictions]);

  const getCompletionPrediction = useCallback(() => {
    return predictions.find(p => p.type === 'completion');
  }, [predictions]);

  return {
    predictions,
    loading,
    error,
    getProgressPrediction,
    getRetentionPrediction,
    getCompletionPrediction
  };
};
