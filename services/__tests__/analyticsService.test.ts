import { AnalyticsService } from '../analyticsService';

// Mock Firebase
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockGetDocs = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs,
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn()
  }
}));

jest.mock('../../config/firebase', () => ({
  db: 'mock-db',
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = AnalyticsService.getInstance();
  });

  describe('startLearningSession', () => {
    it('should start a learning session successfully', async () => {
      const mockSessionRef = 'session-ref';
      mockDoc.mockReturnValue(mockSessionRef);
      mockSetDoc.mockResolvedValue(undefined);

      const sessionId = await analyticsService.startLearningSession('flashcard', 'unit-1');

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'analytics', 'test-user-id', 'learning_sessions', expect.any(String));
      expect(mockSetDoc).toHaveBeenCalledWith(mockSessionRef, expect.objectContaining({
        id: expect.any(String),
        userId: 'test-user-id',
        startTime: expect.any(Object),
        studyMode: 'flashcard',
        unitId: 'unit-1',
        difficulty: 'medium'
      }));
      expect(typeof sessionId).toBe('string');
    });

    it('should throw error if user not authenticated', async () => {
      // Mock unauthenticated user
      jest.doMock('../../config/firebase', () => ({
        auth: { currentUser: null }
      }));

      await expect(analyticsService.startLearningSession('flashcard')).rejects.toThrow('User not authenticated');
    });
  });

  describe('endLearningSession', () => {
    it('should end a learning session successfully', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          startTime: { toDate: () => new Date('2024-01-01T10:00:00Z') }
        })
      };
      const mockSessionRef = 'session-ref';

      mockDoc.mockReturnValue(mockSessionRef);
      mockGetDoc.mockResolvedValue(mockSessionDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await analyticsService.endLearningSession(
        'session-123',
        ['word1', 'word2'],
        15,
        20,
        80,
        2
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockSessionRef, expect.objectContaining({
        endTime: expect.any(Object),
        duration: expect.any(Number),
        wordsStudied: ['word1', 'word2'],
        correctAnswers: 15,
        totalAnswers: 20,
        engagement: 80,
        interruptions: 2,
        difficulty: 'easy' // 75% accuracy = easy
      }));
    });

    it('should throw error if session not found', async () => {
      const mockSessionDoc = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockSessionDoc);

      await expect(analyticsService.endLearningSession('invalid-session', [], 0, 0, 0, 0))
        .rejects.toThrow('Learning session not found');
    });
  });

  describe('calculateDifficulty', () => {
    it('should calculate difficulty correctly', () => {
      const service = analyticsService as any; // Access private method

      expect(service.calculateDifficulty(18, 20)).toBe('easy');    // 90%
      expect(service.calculateDifficulty(14, 20)).toBe('medium');  // 70%
      expect(service.calculateDifficulty(10, 20)).toBe('hard');    // 50%
      expect(service.calculateDifficulty(0, 0)).toBe('medium');    // No answers
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should retrieve performance metrics', async () => {
      const mockMetrics = [
        {
          id: 'metric1',
          data: () => ({
            userId: 'test-user',
            date: { toDate: () => new Date() },
            wordsLearnedToday: 10,
            accuracyRate: 85
          })
        }
      ];

      const mockSnapshot = {
        docs: mockMetrics
      };

      mockQuery.mockReturnValue('query-ref');
      mockGetDocs.mockResolvedValue(mockSnapshot);

      const metrics = await analyticsService.getPerformanceMetrics('test-user', 7);

      expect(mockQuery).toHaveBeenCalled();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].wordsLearnedToday).toBe(10);
    });
  });

  describe('getLearningProfile', () => {
    it('should generate user learning profile', async () => {
      const mockMetrics = [
        { accuracyRate: 85, averageSessionLength: 25, studyVelocity: 2.5, consistencyScore: 80, wordsLearnedToday: 15 },
        { accuracyRate: 90, averageSessionLength: 30, studyVelocity: 3.0, consistencyScore: 85, wordsLearnedToday: 20 }
      ];

      const mockSessions = [
        { studyMode: 'flashcard', duration: 25 },
        { studyMode: 'multiple-choice', duration: 30 },
        { studyMode: 'flashcard', duration: 20 }
      ];

      jest.spyOn(analyticsService, 'getPerformanceMetrics').mockResolvedValue(mockMetrics as any);
      jest.spyOn(analyticsService, 'getLearningSessions').mockResolvedValue(mockSessions as any);

      const profile = await analyticsService.getUserLearningProfile('test-user');

      expect(profile.averageAccuracy).toBe(87.5);
      expect(profile.averageSessionLength).toBe(27.5);
      expect(profile.preferredStudyMode).toBe('flashcard');
      expect(profile.learningVelocity).toBe(2.75);
      expect(profile.totalWordsLearned).toBe(35);
      expect(profile.totalStudyTime).toBe(75);
    });
  });
});