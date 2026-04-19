import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAIRecommendations, useStudyRecommendations, useContentRecommendations, usePerformancePredictions } from '../useAIRecommendations';

// Mock the analytics store
jest.mock('../../store/useAnalyticsStore', () => ({
  useAnalyticsStore: jest.fn()
}));

// Mock the user store
jest.mock('../../store/useUserStore', () => ({
  useUserStore: jest.fn()
}));

// Mock the AI service
jest.mock('../../services/aiService', () => ({
  AIService: {
    getInstance: jest.fn(() => ({
      generateRecommendations: jest.fn(),
      generatePredictions: jest.fn()
    }))
  }
}));

describe('useAIRecommendations', () => {
  const mockUseAnalyticsStore = require('../../store/useAnalyticsStore').useAnalyticsStore;
  const mockUseUserStore = require('../../store/useUserStore').useUserStore;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockUseAnalyticsStore.mockReturnValue({
      recommendations: [
        {
          id: 'rec1',
          type: 'study_mode',
          confidence: 85,
          accepted: false,
          expiresAt: new Date(Date.now() + 86400000) // Tomorrow
        },
        {
          id: 'rec2',
          type: 'word',
          confidence: 90,
          accepted: false,
          expiresAt: new Date(Date.now() + 86400000)
        },
        {
          id: 'rec3',
          type: 'unit',
          confidence: 70,
          accepted: true, // Already accepted
          expiresAt: new Date(Date.now() + 86400000)
        }
      ],
      predictions: [
        { id: 'pred1', type: 'progress', confidence: 80 },
        { id: 'pred2', type: 'retention', confidence: 75 },
        { id: 'pred3', type: 'completion', confidence: 70 },
      ],
      loading: false,
      loadAIData: jest.fn().mockResolvedValue(undefined),
      acceptRecommendation: jest.fn().mockResolvedValue(undefined),
      generateRecommendations: jest.fn().mockResolvedValue(undefined),
      generatePredictions: jest.fn().mockResolvedValue(undefined)
    });

    mockUseUserStore.mockReturnValue({
      user: { id: 'test-user-id' }
    });
  });

  it('should return filtered recommendations based on options', () => {
    const { result } = renderHook(() =>
      useAIRecommendations({
        filterByType: ['study_mode'],
        minConfidence: 80
      })
    );

    expect(result.current.recommendations).toHaveLength(1);
    expect(result.current.recommendations[0].type).toBe('study_mode');
    expect(result.current.recommendations[0].confidence).toBe(85);
  });

  it('should filter out expired recommendations', () => {
    mockUseAnalyticsStore.mockReturnValue({
      ...mockUseAnalyticsStore(),
      recommendations: [
        {
          id: 'rec1',
          type: 'study_mode',
          confidence: 85,
          accepted: false,
          expiresAt: new Date(Date.now() - 86400000) // Yesterday - expired
        }
      ],
      predictions: [],
      loading: false,
      loadAIData: jest.fn().mockResolvedValue(undefined),
      acceptRecommendation: jest.fn().mockResolvedValue(undefined),
      generateRecommendations: jest.fn().mockResolvedValue(undefined),
      generatePredictions: jest.fn().mockResolvedValue(undefined)
    });

    const { result } = renderHook(() => useAIRecommendations());

    expect(result.current.recommendations).toHaveLength(0);
  });

  it('should filter out accepted recommendations', () => {
    const { result } = renderHook(() => useAIRecommendations());

    // Should only return non-accepted recommendations
    expect(result.current.recommendations).toHaveLength(2);
    expect(result.current.recommendations.every(rec => !rec.accepted)).toBe(true);
  });

  it('should handle acceptRecommendation', async () => {
    const mockAccept = jest.fn().mockResolvedValue(undefined);
    mockUseAnalyticsStore.mockReturnValue({
      ...mockUseAnalyticsStore(),
      acceptRecommendation: mockAccept
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.acceptRecommendation('rec1');
    });

    expect(mockAccept).toHaveBeenCalledWith('rec1');
  });

  it('should handle refresh', async () => {
    const mockLoadAIData = jest.fn().mockResolvedValue(undefined);
    const mockGenerateRecommendations = jest.fn().mockResolvedValue(undefined);
    const mockGeneratePredictions = jest.fn().mockResolvedValue(undefined);

    mockUseAnalyticsStore.mockReturnValue({
      ...mockUseAnalyticsStore(),
      loadAIData: mockLoadAIData,
      generateRecommendations: mockGenerateRecommendations,
      generatePredictions: mockGeneratePredictions
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockLoadAIData).toHaveBeenCalledWith('test-user-id');
    expect(mockGenerateRecommendations).toHaveBeenCalledWith('test-user-id');
    expect(mockGeneratePredictions).toHaveBeenCalledWith('test-user-id');
  });

  it('should get recommendations by type', () => {
    const { result } = renderHook(() => useAIRecommendations());

    const studyModeRecs = result.current.getRecommendationsByType('study_mode');
    const wordRecs = result.current.getRecommendationsByType('word');

    expect(studyModeRecs).toHaveLength(1);
    expect(studyModeRecs[0].type).toBe('study_mode');
    expect(wordRecs).toHaveLength(1);
    expect(wordRecs[0].type).toBe('word');
  });

  it('should get top recommendations sorted by confidence', () => {
    const { result } = renderHook(() => useAIRecommendations());

    const topRecs = result.current.getTopRecommendations(2);

    expect(topRecs).toHaveLength(2);
    expect(topRecs[0].confidence).toBeGreaterThanOrEqual(topRecs[1].confidence);
  });

  describe('Specialized hooks', () => {
    it('useStudyRecommendations should filter for study-related recommendations', () => {
      const { result } = renderHook(() => useStudyRecommendations());

      // Should only include study_mode, word, and unit types with confidence >= 70
      expect(result.current.recommendations.every(rec =>
        ['study_mode', 'word', 'unit'].includes(rec.type) && rec.confidence >= 70
      )).toBe(true);
    });

    it('useContentRecommendations should filter for content-related recommendations', () => {
      const { result } = renderHook(() => useContentRecommendations());

      // Should only include unit and category types with confidence >= 75
      expect(result.current.recommendations.every(rec =>
        ['unit', 'category'].includes(rec.type) && rec.confidence >= 75
      )).toBe(true);
    });

    it('usePerformancePredictions should provide prediction helpers', () => {
      const { result } = renderHook(() => usePerformancePredictions());

      const progressPred = result.current.getProgressPrediction();
      const retentionPred = result.current.getRetentionPrediction();
      const completionPred = result.current.getCompletionPrediction();

      expect(progressPred?.type).toBe('progress');
      expect(retentionPred?.type).toBe('retention');
      expect(completionPred?.type).toBe('completion');
    });
  });

  it('should handle errors gracefully', async () => {
    const mockLoadAIData = jest.fn().mockRejectedValue(new Error('Network error'));
    mockUseAnalyticsStore.mockReturnValue({
      ...mockUseAnalyticsStore(),
      loadAIData: mockLoadAIData
    });

    const { result } = renderHook(() => useAIRecommendations({ autoLoad: true }));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load AI recommendations');
    });
  });

  it('should not load data when user is not available', () => {
    mockUseUserStore.mockReturnValue({ user: null });

    const mockLoadAIData = jest.fn();
    mockUseAnalyticsStore.mockReturnValue({
      ...mockUseAnalyticsStore(),
      loadAIData: mockLoadAIData
    });

    renderHook(() => useAIRecommendations({ autoLoad: true }));

    expect(mockLoadAIData).not.toHaveBeenCalled();
  });
});