import { AIService } from '../aiService';

// Mock firebase with jest.fn() inside factory (avoids hoisting TDZ)
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

describe('AIService - Advanced Features', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = AIService.getInstance();
  });

  describe('analyzeLearningPatterns', () => {
    it('should analyze learning patterns correctly', () => {
      // Use real Date objects (not Firestore Timestamp-like)
      const sessions = [
        {
          startTime: new Date('2024-01-01T10:00:00Z'),
          studyMode: 'flashcard',
          correctAnswers: 15,
          totalAnswers: 20,
          engagement: 80,
          wordsStudied: ['w1', 'w2'],
          duration: 25,
        },
        {
          startTime: new Date('2024-01-02T10:00:00Z'),
          studyMode: 'multiple-choice',
          correctAnswers: 18,
          totalAnswers: 20,
          engagement: 85,
          wordsStudied: ['w3', 'w4'],
          duration: 30,
        },
      ] as any;

      const userProgress = {};
      const patterns = (aiService as any).analyzeLearningPatterns(sessions, userProgress);

      expect(patterns.modePerformance).toBeDefined();
      expect(typeof patterns.recentAccuracy).toBe('number');
      expect(patterns.learningVelocity).toBeDefined();
    });
  });

  describe('identifyWeakCategoriesAdvanced', () => {
    it('should identify weak categories based on performance', () => {
      const sessions = [
        { wordsStudied: ['word1', 'word2'], correctAnswers: 1, totalAnswers: 2 },
      ] as any;

      const userProgress = {
        word1: { status: 'learning' },
        word2: { status: 'known' },
      };

      (aiService as any).getWordCategory = jest.fn()
        .mockReturnValueOnce('nouns')
        .mockReturnValueOnce('verbs');

      const weakCategories = (aiService as any).identifyWeakCategoriesAdvanced(userProgress, sessions, { consistencyBonus: 10 });

      expect(Array.isArray(weakCategories)).toBe(true);
      expect(weakCategories.length).toBeLessThanOrEqual(3);
    });
  });

  describe('generateSpacedRepetitionRecommendations', () => {
    it('should generate spaced repetition recommendations', () => {
      const userProgress = {
        word1: {
          lastReviewed: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago — overdue
          easeFactor: 2.5,
          repetitions: 1, // idealInterval = 6 days → 20 > 6*0.9=5.4 ✓
        },
      };

      const recommendations = (aiService as any).generateSpacedRepetitionRecommendations('test-user', userProgress);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('word');
    });
  });

  describe('calculateIdealReviewInterval', () => {
    it('should calculate correct review intervals', () => {
      const service = aiService as any;
      expect(service.calculateIdealReviewInterval(2.5, 0)).toBe(1);
      expect(service.calculateIdealReviewInterval(2.5, 1)).toBe(6);
      expect(service.calculateIdealReviewInterval(2.5, 2)).toBeCloseTo(15);
    });
  });

  describe('recommendNextUnits', () => {
    it('should recommend next units based on mastery', () => {
      const userProgress = {
        word1: { status: 'known' },
        word2: { status: 'known' },
        word3: { status: 'learning' },
      };

      const patterns = { recentAccuracy: 0.8, consistencyBonus: 5 };

      // recommendNextUnits is a private method — access via any
      const recommendations = (aiService as any).recommendNextUnits(userProgress, patterns);

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('recommendSpecificWords', () => {
    it('should recommend specific words for practice', () => {
      const userProgress = {
        word1: { status: 'learning', incorrectCount: 3, correctCount: 1 },
        word2: { status: 'learning', incorrectCount: 1, correctCount: 2 },
      };

      (aiService as any).getWordCategory = jest.fn().mockReturnValue('verbs');

      const recommendations = (aiService as any).recommendSpecificWords(userProgress, [], { consistencyBonus: 5 });

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('assessWordDifficulty', () => {
    it('should assess word difficulty based on session performance', () => {
      const sessions = [
        { wordsStudied: ['word1', 'word2'], correctAnswers: 1, totalAnswers: 2 },
      ] as any;

      const difficulty = (aiService as any).assessWordDifficulty('word1', sessions);
      expect(typeof difficulty).toBe('number');
    });
  });

  describe('calculateReviewUrgency', () => {
    it('should calculate review urgency correctly', () => {
      const progress = {
        lastReviewed: Date.now() - 20 * 24 * 60 * 60 * 1000,
        incorrectCount: 2,
        correctCount: 1,
        easeFactor: 2.0,
      };

      const urgency = (aiService as any).calculateReviewUrgency(progress, { consistencyBonus: 5 });

      expect(urgency).toBeGreaterThan(0);
      expect(urgency).toBeLessThanOrEqual(1);
    });
  });
});
