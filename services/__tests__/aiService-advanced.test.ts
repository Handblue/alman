import { AIService } from '../aiService';

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

describe('AIService - Advanced Features', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = AIService.getInstance();
  });

  describe('analyzeLearningPatterns', () => {
    it('should analyze learning patterns correctly', () => {
      const sessions = [
        {
          startTime: { toDate: () => new Date('2024-01-01T10:00:00Z') },
          studyMode: 'flashcard',
          correctAnswers: 15,
          totalAnswers: 20,
          engagement: 80
        },
        {
          startTime: { toDate: () => new Date('2024-01-02T10:00:00Z') },
          studyMode: 'multiple-choice',
          correctAnswers: 18,
          totalAnswers: 20,
          engagement: 85
        }
      ] as any;

      const userProgress = {};

      const patterns = (aiService as any).analyzeLearningPatterns(sessions, userProgress);

      expect(patterns.consistencyBonus).toBeGreaterThan(0);
      expect(patterns.masteryBonus).toBe(0); // No progress data
      expect(patterns.modePerformance).toBeDefined();
      expect(patterns.recentAccuracy).toBe(0.825); // (15/20 + 18/20) / 2
      expect(patterns.learningVelocity).toBeDefined();
    });
  });

  describe('identifyWeakCategoriesAdvanced', () => {
    it('should identify weak categories based on performance', () => {
      const sessions = [
        {
          wordsStudied: ['word1', 'word2'],
          correctAnswers: 1,
          totalAnswers: 2
        }
      ] as any;

      const userProgress = {
        word1: { status: 'learning' },
        word2: { status: 'known' }
      };

      // Mock getWordCategory
      (aiService as any).getWordCategory = jest.fn()
        .mockReturnValueOnce('nouns')
        .mockReturnValueOnce('verbs');

      const weakCategories = (aiService as any).identifyWeakCategoriesAdvanced(userProgress, sessions, { consistencyBonus: 10 });

      expect(weakCategories).toContain('nouns');
      expect(weakCategories.length).toBeLessThanOrEqual(3);
    });
  });

  describe('generateSpacedRepetitionRecommendations', () => {
    it('should generate spaced repetition recommendations', () => {
      const userProgress = {
        word1: {
          lastReviewed: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
          easeFactor: 2.5,
          repetitions: 2
        }
      };

      const sessions = [] as any;

      const recommendations = (aiService as any).generateSpacedRepetitionRecommendations(userProgress, sessions);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('word');
      expect(recommendations[0].content.reviewType).toBe('spaced');
    });
  });

  describe('calculateIdealReviewInterval', () => {
    it('should calculate correct review intervals', () => {
      const service = aiService as any;

      expect(service.calculateIdealReviewInterval(2.5, 0)).toBe(1);
      expect(service.calculateIdealReviewInterval(2.5, 1)).toBe(6);
      expect(service.calculateIdealReviewInterval(2.5, 2)).toBeCloseTo(15); // 6 * 2.5^1
    });
  });

  describe('recommendNextUnitsAdvanced', () => {
    it('should recommend next units based on mastery', () => {
      // Mock global UNITS
      (global as any).UNITS = [
        {
          id: 'unit1',
          words: ['word1', 'word2'],
          difficulty: 0.5
        },
        {
          id: 'unit2',
          words: ['word3', 'word4'],
          difficulty: 0.7,
          prerequisites: ['unit1']
        }
      ];

      const userProgress = {
        word1: { status: 'known' },
        word2: { status: 'known' },
        word3: { status: 'learning' }
      };

      const patterns = {
        recentAccuracy: 0.8,
        consistencyBonus: 5
      };

      const recommendations = (aiService as any).recommendNextUnitsAdvanced(userProgress, patterns);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('id');
      expect(recommendations[0]).toHaveProperty('estimatedDifficulty');
    });
  });

  describe('recommendSpecificWords', () => {
    it('should recommend specific words for practice', () => {
      const userProgress = {
        word1: {
          status: 'learning',
          incorrectCount: 3,
          correctCount: 1
        },
        word2: {
          status: 'learning',
          incorrectCount: 1,
          correctCount: 2
        }
      };

      const sessions = [] as any;
      const patterns = { consistencyBonus: 5 };

      // Mock getWordCategory
      (aiService as any).getWordCategory = jest.fn().mockReturnValue('verbs');

      const recommendations = (aiService as any).recommendSpecificWords(userProgress, sessions, patterns);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe('word');
      expect(recommendations[0].content.category).toBe('verbs');
    });
  });

  describe('assessWordDifficulty', () => {
    it('should assess word difficulty based on session performance', () => {
      const sessions = [
        {
          wordsStudied: ['word1', 'word2'],
          correctAnswers: 1,
          totalAnswers: 2
        }
      ] as any;

      const difficulty = (aiService as any).assessWordDifficulty('word1', sessions);

      expect(difficulty).toBe(0.5); // 50% accuracy
    });
  });

  describe('calculateReviewUrgency', () => {
    it('should calculate review urgency correctly', () => {
      const progress = {
        lastReviewed: Date.now() - (20 * 24 * 60 * 60 * 1000), // 20 days ago
        incorrectCount: 2,
        correctCount: 1,
        easeFactor: 2.0
      };

      const patterns = { consistencyBonus: 5 };

      const urgency = (aiService as any).calculateReviewUrgency(progress, patterns);

      expect(urgency).toBeGreaterThan(0);
      expect(urgency).toBeLessThanOrEqual(1);
    });
  });
});