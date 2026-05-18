import { create } from 'zustand';
import { socialService, Friend, FriendRequest, SocialChallenge } from '@/services/socialService';
import { authService } from '@/services/authService';
import { createStorage } from '@/utils/storage';

const storage = createStorage('social-store');

// Conditionally import Firebase services only in non-test environments
let socialServiceInstance: any = null;
const isTestEnv = process.env.JEST_WORKER_ID !== undefined;

if (!isTestEnv) {
  // Only import in production/runtime
  socialServiceInstance = require('@/services/socialService').socialService;
}

interface SocialState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  challenges: SocialChallenge[];
  isOnline: boolean;
  loading: {
    friends: boolean;
    requests: boolean;
    challenges: boolean;
  };

  // Actions
  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  sendFriendRequest: (toUid: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;

  loadChallenges: () => Promise<void>;
  createChallenge: (challenge: Omit<SocialChallenge, 'id' | 'participants' | 'progress'>) => Promise<string>;
  joinChallenge: (challengeId: string) => Promise<void>;
  updateChallengeProgress: (challengeId: string, completedWords: number, streak: number) => Promise<void>;

  initializeSocialSync: () => Promise<void>;
  unsubscribeAll: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  challenges: [],
  isOnline: false,
  loading: {
    friends: false,
    requests: false,
    challenges: false,
  },

  loadFriends: async () => {
    if (!socialServiceInstance) return;

    set(state => ({ loading: { ...state.loading, friends: true } }));
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const friends = await socialServiceInstance.getFriends(user.id);
      set({ friends });
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      set(state => ({ loading: { ...state.loading, friends: false } }));
    }
  },

  loadFriendRequests: async () => {
    if (!socialServiceInstance) return;

    set(state => ({ loading: { ...state.loading, requests: true } }));
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const [friendRequests, sentRequests] = await Promise.all([
        socialServiceInstance.getPendingRequests(user.id),
        socialServiceInstance.getSentRequests(user.id),
      ]);
      set({ friendRequests, sentRequests });
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      set(state => ({ loading: { ...state.loading, requests: false } }));
    }
  },

  sendFriendRequest: async (toUid: string) => {
    if (!socialServiceInstance) return;

    try {
      await socialServiceInstance.sendFriendRequest(toUid);
      // Reload sent requests
      const user = authService.getCurrentUser();
      if (user) {
        const sentRequests = await socialServiceInstance.getSentRequests(user.id);
        set({ sentRequests });
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    if (!socialServiceInstance) return;

    try {
      await socialServiceInstance.acceptFriendRequest(requestId);
      // Reload friends and requests
      await Promise.all([
        get().loadFriends(),
        get().loadFriendRequests(),
      ]);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  },

  declineFriendRequest: async (requestId: string) => {
    if (!socialServiceInstance) return;

    try {
      await socialServiceInstance.declineFriendRequest(requestId);
      // Reload requests
      await get().loadFriendRequests();
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      throw error;
    }
  },

  removeFriend: async (friendUid: string) => {
    if (!socialServiceInstance) return;

    try {
      await socialServiceInstance.removeFriend(friendUid);
      // Reload friends
      await get().loadFriends();
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  },

  loadChallenges: async () => {
    if (!socialServiceInstance) return;

    set(state => ({ loading: { ...state.loading, challenges: true } }));
    try {
      const challenges = await socialServiceInstance.getActiveChallenges();
      set({ challenges });
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      set(state => ({ loading: { ...state.loading, challenges: false } }));
    }
  },

  createChallenge: async (challenge) => {
    if (!socialServiceInstance) throw new Error('Social service not available');

    try {
      const challengeId = await socialServiceInstance.createChallenge(challenge);
      // Reload challenges
      await get().loadChallenges();
      return challengeId;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      throw error;
    }
  },

  joinChallenge: async (challengeId: string) => {
    if (!socialServiceInstance) return;

    try {
      await socialServiceInstance.joinChallenge(challengeId);
      // Reload challenges
      await get().loadChallenges();
    } catch (error) {
      console.error('Failed to join challenge:', error);
      throw error;
    }
  },

  updateChallengeProgress: async (challengeId: string, completedWords: number, streak: number) => {
    if (!socialServiceInstance) return;

    try {
      await socialServiceInstance.updateChallengeProgress(challengeId, completedWords, streak);
    } catch (error) {
      console.error('Failed to update challenge progress:', error);
    }
  },

  initializeSocialSync: async () => {
    if (!socialServiceInstance) {
      set({ isOnline: false });
      return;
    }

    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      // Load initial data
      await Promise.all([
        get().loadFriends(),
        get().loadFriendRequests(),
        get().loadChallenges(),
      ]);

      // Set up subscriptions
      socialServiceInstance.subscribeToFriends(user.id, (friends: Friend[]) => {
        set({ friends });
      });

      socialServiceInstance.subscribeToFriendRequests(user.id, (requests: FriendRequest[]) => {
        set({ friendRequests: requests });
      });

      socialServiceInstance.subscribeToChallenges((challenges: SocialChallenge[]) => {
        set({ challenges });
      });

      set({ isOnline: true });
    } catch (error) {
      console.error('Failed to initialize social sync:', error);
      set({ isOnline: false });
    }
  },

  unsubscribeAll: () => {
    if (socialServiceInstance) {
      socialServiceInstance.unsubscribeAll();
    }
  },
}));
