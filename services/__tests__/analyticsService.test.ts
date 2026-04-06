import { AnalyticsService } from '../analyticsService';

// Mock Firebase — jest.fn() must be INSIDE factory to avoid hoisting TDZ issues
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => args[0]),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('../../config/firebase', () => ({
  db: 'mock-db',
  auth: { currentUser: { uid: 'test-user-id' } },
}));

// Pull the mocked functions after jest.mock (safe at module scope)
import {
  doc as mockDocFn,
  setDoc as mockSetDocFn,
  updateDoc as mockUpdateDocFn,
  getDoc as mockGetDocFn,
  query as mockQueryFn,
  getDocs as mockGetDocsFn,
} from 'firebase/firestore';

const mockDoc = mockDocFn as jest.Mock;
const mockSetDoc = mockSetDocFn as jest.Mock;
const mockUpdateDoc = mockUpdateDocFn as jest.Mock;
const mockGetDoc = mockGetDocFn as jest.Mock;
const mockQuery = mockQueryFn as jest.Mock;
const mockGetDocs = mockGetDocsFn as jest.Mock;

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

      expect(mockDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(mockSessionRef, expect.objectContaining({
        userId: 'test-user-id',
        studyMode: 'flashcard',
        unitId: 'unit-1',
      }));
      expect(typeof sessionId).toBe('string');
    });
  });

  describe('endLearningSession', () => {
    it('should end a learning session successfully', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          startTime: { toDate: () => new Date('2024-01-01T10:00:00Z') },
        }),
      };
      const mockSessionRef = 'session-ref';

      mockDoc.mockReturnValue(mockSessionRef);
      mockGetDoc.mockResolvedValue(mockSessionDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await analyticsService.endLearningSession('session-123', ['word1', 'word2'], 15, 20, 80, 2);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        mockSessionRef,
        expect.objectContaining({
          wordsStudied: ['word1', 'word2'],
          correctAnswers: 15,
          totalAnswers: 20,
        })
      );
    });

    it('should throw error if session not found', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });

      await expect(
        analyticsService.endLearningSession('invalid-session', [], 0, 0, 0, 0)
      ).rejects.toThrow('Learning session not found');
    });
  });

  describe('calculateDifficulty', () => {
    it('should calculate difficulty correctly', () => {
      const service = analyticsService as any;
      expect(service.calculateDifficulty(18, 20)).toBe('easy');
      expect(service.calculateDifficulty(14, 20)).toBe('medium');
      expect(service.calculateDifficulty(10, 20)).toBe('hard');
      expect(service.calculateDifficulty(0, 0)).toBe('medium');
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
            accuracyRate: 85,
          }),
        },
      ];
      mockQuery.mockReturnValue('query-ref');
      mockGetDocs.mockResolvedValue({ docs: mockMetrics });

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
        { accuracyRate: 90, averageSessionLength: 30, studyVelocity: 3.0, consistencyScore: 85, wordsLearnedToday: 20 },
      ];
      const mockSessions = [
        { studyMode: 'flashcard', duration: 25 },
        { studyMode: 'multiple-choice', duration: 30 },
        { studyMode: 'flashcard', duration: 20 },
      ];

      jest.spyOn(analyticsService, 'getPerformanceMetrics').mockResolvedValue(mockMetrics as any);
      jest.spyOn(analyticsService, 'getLearningSessions').mockResolvedValue(mockSessions as any);

      const profile = await analyticsService.getUserLearningProfile('test-user');

      expect(profile.averageAccuracy).toBe(87.5);
      expect(profile.preferredStudyMode).toBe('flashcard');
      expect(profile.totalWordsLearned).toBe(35);
    });
  });
});
