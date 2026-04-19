// Mock dynamic imports used by completeChallenge
jest.mock('@/services/notificationService', () => ({
  NotificationService: {
    getInstance: jest.fn(() => ({
      scheduleDailyReminder: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));
jest.mock('@/services/offlineQueueService', () => ({
  OfflineQueueService: {
    getInstance: jest.fn(() => ({
      enqueue: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

import { useDailyChallengeStore } from '../useDailyChallengeStore';

beforeEach(() => {
  useDailyChallengeStore.setState({ todayChallenge: null, history: [] });
});

describe('useDailyChallengeStore', () => {
  it('initToday creates challenge with 5 questionIds', () => {
    useDailyChallengeStore.getState().initToday();
    const { todayChallenge } = useDailyChallengeStore.getState();
    expect(todayChallenge).not.toBeNull();
    expect(todayChallenge?.questionIds).toHaveLength(5);
    expect(todayChallenge?.completed).toBe(false);
    expect(todayChallenge?.answeredCount).toBe(0);
  });

  it('initToday called twice same day does not reset progress', () => {
    useDailyChallengeStore.getState().initToday();
    useDailyChallengeStore.getState().recordAnswer(true);
    const countAfterFirst = useDailyChallengeStore.getState().todayChallenge?.answeredCount;

    useDailyChallengeStore.getState().initToday();
    const countAfterSecond = useDailyChallengeStore.getState().todayChallenge?.answeredCount;
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it('recordAnswer increments answeredCount', () => {
    useDailyChallengeStore.getState().initToday();
    useDailyChallengeStore.getState().recordAnswer(true);
    expect(useDailyChallengeStore.getState().todayChallenge?.answeredCount).toBe(1);
    expect(useDailyChallengeStore.getState().todayChallenge?.correctCount).toBe(1);

    useDailyChallengeStore.getState().recordAnswer(false);
    expect(useDailyChallengeStore.getState().todayChallenge?.answeredCount).toBe(2);
    expect(useDailyChallengeStore.getState().todayChallenge?.correctCount).toBe(1);
  });

  it('5th answer triggers completion', () => {
    useDailyChallengeStore.getState().initToday();
    for (let i = 0; i < 5; i++) {
      useDailyChallengeStore.getState().recordAnswer(true);
    }
    expect(useDailyChallengeStore.getState().todayChallenge?.completed).toBe(true);
    expect(useDailyChallengeStore.getState().history).toHaveLength(1);
  });

  it('xpEarned calculated correctly', () => {
    useDailyChallengeStore.getState().initToday();
    // Answer 3 correct, 2 wrong
    useDailyChallengeStore.getState().recordAnswer(true);
    useDailyChallengeStore.getState().recordAnswer(true);
    useDailyChallengeStore.getState().recordAnswer(true);
    useDailyChallengeStore.getState().recordAnswer(false);
    useDailyChallengeStore.getState().recordAnswer(false);

    const { todayChallenge } = useDailyChallengeStore.getState();
    // 3 correct * 10 + 25 base = 55
    expect(todayChallenge?.xpEarned).toBe(55);
    expect(todayChallenge?.correctCount).toBe(3);
  });
});
