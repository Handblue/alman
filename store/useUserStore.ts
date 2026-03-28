import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'user-store' });

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
  setOnboarded: (v: boolean) => void;
  setLevel: (level: UserState['selectedLevel']) => void;
  setCategories: (ids: number[]) => void;
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => void;
  earnBadge: (id: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hasOnboarded: storage.getBoolean('hasOnboarded') ?? false,
  selectedLevel: (storage.getString('level') as UserState['selectedLevel']) ?? null,
  selectedCategories: JSON.parse(storage.getString('categories') ?? '[]'),
  xp: storage.getNumber('xp') ?? 0,
  streak: storage.getNumber('streak') ?? 0,
  lastActiveDate: storage.getString('lastActiveDate') ?? null,
  level: xpToLevel(storage.getNumber('xp') ?? 0),
  badges: JSON.parse(storage.getString('badges') ?? '[]'),
  setOnboarded: (v) => { storage.set('hasOnboarded', v); set({ hasOnboarded: v }); },
  setLevel: (level) => { if (level) storage.set('level', level); set({ selectedLevel: level }); },
  setCategories: (ids) => { storage.set('categories', JSON.stringify(ids)); set({ selectedCategories: ids }); },
  addXP: (amount) => set((s) => {
    const xp = s.xp + amount;
    storage.set('xp', xp);
    return { xp, level: xpToLevel(xp) };
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
    return { streak, lastActiveDate: today };
  }),
  earnBadge: (id) => set((s) => {
    if (s.badges.includes(id)) return {};
    const badges = [...s.badges, id];
    storage.set('badges', JSON.stringify(badges));
    return { badges };
  }),
}));
