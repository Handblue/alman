import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'user-store' });

interface UserState {
  hasOnboarded: boolean;
  selectedLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | null;
  selectedCategories: number[];
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  setOnboarded: (v: boolean) => void;
  setLevel: (level: UserState['selectedLevel']) => void;
  setCategories: (ids: number[]) => void;
  addXP: (amount: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hasOnboarded: storage.getBoolean('hasOnboarded') ?? false,
  selectedLevel: (storage.getString('level') as UserState['selectedLevel']) ?? null,
  selectedCategories: JSON.parse(storage.getString('categories') ?? '[]'),
  xp: storage.getNumber('xp') ?? 0,
  streak: storage.getNumber('streak') ?? 0,
  lastActiveDate: storage.getString('lastActiveDate') ?? null,
  setOnboarded: (v) => { storage.set('hasOnboarded', v); set({ hasOnboarded: v }); },
  setLevel: (level) => { if (level) storage.set('level', level); set({ selectedLevel: level }); },
  setCategories: (ids) => { storage.set('categories', JSON.stringify(ids)); set({ selectedCategories: ids }); },
  addXP: (amount) => set((s) => { const xp = s.xp + amount; storage.set('xp', xp); return { xp }; }),
}));
