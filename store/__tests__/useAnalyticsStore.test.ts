import { AnalyticsService } from '../services/analyticsService';
import { AIService } from '../services/aiService';
import { useAnalyticsStore } from '../store/useAnalyticsStore';

// Mock Firebase services for testing
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

jest.mock('../services/analyticsService');
jest.mock('../services/aiService');

describe('Analytics Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useAnalyticsStore.getState();

    expect(store.performanceMetrics).toEqual([]);
    expect(store.learningSessions).toEqual([]);
    expect(store.recommendations).toEqual([]);
    expect(store.predictions).toEqual([]);
    expect(store.currentSessionId).toBeNull();
    expect(store.currentSessionStart).toBeNull();
  });

  it('should start learning session', async () => {
    const mockStartSession = jest.fn().mockResolvedValue('session-123');
    (AnalyticsService.getInstance as jest.Mock).mockReturnValue({
      startLearningSession: mockStartSession
    });

    const store = useAnalyticsStore.getState();
    await store.startLearningSession('flashcard', 'unit-1');

    expect(mockStartSession).toHaveBeenCalledWith('flashcard', 'unit-1');
    expect(useAnalyticsStore.getState().currentSessionId).toBe('session-123');
    expect(useAnalyticsStore.getState().currentSessionStart).toBeInstanceOf(Date);
  });

  it('should end learning session', async () => {
    const mockEndSession = jest.fn().mockResolvedValue(undefined);
    (AnalyticsService.getInstance as jest.Mock).mockReturnValue({
      endLearningSession: mockEndSession
    });

    // Set up initial session state
    useAnalyticsStore.setState({
      currentSessionId: 'session-123',
      currentSessionStart: new Date()
    });

    const store = useAnalyticsStore.getState();
    await store.endLearningSession(['word1', 'word2'], 15, 20, 80, 2);

    expect(mockEndSession).toHaveBeenCalledWith('session-123', ['word1', 'word2'], 15, 20, 80, 2);
    expect(useAnalyticsStore.getState().currentSessionId).toBeNull();
    expect(useAnalyticsStore.getState().currentSessionStart).toBeNull();
  });

  it('should load analytics data', async () => {
    const mockAnalyticsService = {
      getPerformanceMetrics: jest.fn().mockResolvedValue([
        {
          userId: 'test-user',
          date: new Date(),
          wordsLearnedToday: 10,
          accuracyRate: 85,
          studyStreak: 5
        }
      ]),
      getLearningSessions: jest.fn().mockResolvedValue([]),
      getLearningInsights: jest.fn().mockResolvedValue([])
    };

    (AnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalyticsService);

    const store = useAnalyticsStore.getState();
    await store.loadAnalyticsData('test-user');

    expect(mockAnalyticsService.getPerformanceMetrics).toHaveBeenCalledWith('test-user', 30);
    expect(mockAnalyticsService.getLearningSessions).toHaveBeenCalledWith('test-user', 50);
    expect(mockAnalyticsService.getLearningInsights).toHaveBeenCalledWith('test-user');

    const state = useAnalyticsStore.getState();
    expect(state.performanceMetrics).toHaveLength(1);
    expect(state.learningSessions).toHaveLength(0);
    expect(state.learningInsights).toHaveLength(0);
  });

  it('should load AI data', async () => {
    const mockAIService = {
      getRecommendations: jest.fn().mockResolvedValue([
        {
          id: 'rec-1',
          userId: 'test-user',
          type: 'study_mode',
          title: 'Try multiple choice',
          description: 'Multiple choice might be better for you',
          confidence: 85,
          reason: 'Based on your performance'
        }
      ]),
      getPredictions: jest.fn().mockResolvedValue([])
    };

    (AIService.getInstance as jest.Mock).mockReturnValue(mockAIService);

    const store = useAnalyticsStore.getState();
    await store.loadAIData('test-user');

    expect(mockAIService.getRecommendations).toHaveBeenCalledWith('test-user');
    expect(mockAIService.getPredictions).toHaveBeenCalledWith('test-user');

    const state = useAnalyticsStore.getState();
    expect(state.recommendations).toHaveLength(1);
    expect(state.predictions).toHaveLength(0);
  });

  it('should accept recommendation', async () => {
    const mockAcceptRec = jest.fn().mockResolvedValue(undefined);
    (AIService.getInstance as jest.Mock).mockReturnValue({
      acceptRecommendation: mockAcceptRec
    });

    // Set up initial recommendations
    useAnalyticsStore.setState({
      recommendations: [
        {
          id: 'rec-1',
          userId: 'test-user',
          type: 'study_mode',
          title: 'Try multiple choice',
          description: 'Multiple choice might be better for you',
          confidence: 85,
          reason: 'Based on your performance',
          accepted: false
        }
      ]
    });

    const store = useAnalyticsStore.getState();
    await store.acceptRecommendation('rec-1');

    expect(mockAcceptRec).toHaveBeenCalledWith('rec-1');

    const state = useAnalyticsStore.getState();
    expect(state.recommendations[0].accepted).toBe(true);
    expect(state.recommendations[0].acceptedAt).toBeInstanceOf(Date);
  });
});