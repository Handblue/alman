import { create } from 'zustand';
import { createStorage, readStoredJson } from '@/utils/storage';

// Conditionally import Firebase services only in non-test environments
let authService: any = null;
let userService: any = null;
const isTestEnv = process.env.JEST_WORKER_ID !== undefined;

if (!isTestEnv) {
  // Only import in production/runtime
  const { authService: as } = require('@/services/authService');
  const { userService: us } = require('@/services/userService');
  authService = as;
  userService = us;
}

const storage = createStorage('user-store');

function xpToLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

interface UserState {
  hasOnboarded: boolean;
  selectedLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | null;
  selectedCategories: number[];
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  level: number;
  badges: string[];
  isOnline: boolean;
  setOnboarded: (v: boolean) => void;
  setLevel: (level: UserState['selectedLevel']) => void;
  setCategories: (ids: number[]) => void;
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => void;
  earnBadge: (id: string) => void;
  syncWithCloud: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  hasOnboarded: storage.getBoolean('hasOnboarded') ?? false,
  selectedLevel: (storage.getString('level') as UserState['selectedLevel']) ?? null,
  selectedCategories: readStoredJson<number[]>(storage, 'categories', []),
  xp: storage.getNumber('xp') ?? 0,
  streak: storage.getNumber('streak') ?? 0,
  lastActiveDate: storage.getString('lastActiveDate') ?? null,
  level: xpToLevel(storage.getNumber('xp') ?? 0),
  badges: readStoredJson<string[]>(storage, 'badges', []),
  isOnline: false,

  setOnboarded: (v) => {
    storage.set('hasOnboarded', v);
    set({ hasOnboarded: v });
    get().syncWithCloud();
  },

  setLevel: (level) => {
    if (level) storage.set('level', level);
    set({ selectedLevel: level });
    get().syncWithCloud();
  },

  setCategories: (ids) => {
    storage.set('categories', JSON.stringify(ids));
    set({ selectedCategories: ids });
    get().syncWithCloud();
  },

  addXP: (amount) => set((s) => {
    const xp = s.xp + amount;
    storage.set('xp', xp);
    const level = xpToLevel(xp);
    get().syncWithCloud();
    return { xp, level };
  }),

  checkAndUpdateStreak: () => set((s) => {
    const today = getToday();
    const yesterday = getYesterday();
    if (s.lastActiveDate === today) return {};
    let streak: number;
    if (s.lastActiveDate === yesterday) {
      streak = s.streak + 1;
    } else {
      streak = 1;
    }
    storage.set('streak', streak);
    storage.set('lastActiveDate', today);
    get().syncWithCloud();
    return { streak, lastActiveDate: today };
  }),

  earnBadge: (id) => set((s) => {
    if (s.badges.includes(id)) return {};
    const badges = [...s.badges, id];
    storage.set('badges', JSON.stringify(badges));
    get().syncWithCloud();
    return { badges };
  }),

  syncWithCloud: async () => {
    if (!userService || !authService) return; // Skip in test environment

    const user = authService.getCurrentUser();
    if (!user) return;

    const state = get();
    try {
      await userService.updateUserProfile(user.uid, {
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate || '',
        selectedLevel: state.selectedLevel,
        selectedCategories: state.selectedCategories,
        badges: state.badges,
      });
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
    }
  },

  initializeAuth: async () => {
    if (!authService || !userService) {
      // In test environment, just set online to false
      set({ isOnline: false });
      return;
    }

    try {
      // Sign in anonymously
      await authService.signInAnonymously();
      set({ isOnline: true });

      // Sync local data to cloud
      const state = get();
      await userService.syncLocalDataToCloud({
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        selectedLevel: state.selectedLevel,
        selectedCategories: state.selectedCategories,
        badges: state.badges,
      });

      // Subscribe to cloud changes
      userService.subscribeToUserProfile(authService.getCurrentUser()!.uid, (profile: any) => {
        if (profile) {
          // Update local state with cloud data
          storage.set('xp', profile.xp);
          storage.set('streak', profile.streak);
          storage.set('lastActiveDate', profile.lastActiveDate);
          if (profile.selectedLevel) storage.set('level', profile.selectedLevel);
          storage.set('categories', JSON.stringify(profile.selectedCategories));
          storage.set('badges', JSON.stringify(profile.badges));

          set({
            xp: profile.xp,
            level: profile.level,
            streak: profile.streak,
            lastActiveDate: profile.lastActiveDate,
            selectedLevel: profile.selectedLevel,
            selectedCategories: profile.selectedCategories,
            badges: profile.badges,
          });
        }
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isOnline: false });
    }
  },
}));
