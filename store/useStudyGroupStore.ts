import { create } from 'zustand';
import { studyGroupService, StudyGroup, ProgressShare } from '@/services/studyGroupService';

interface StudyGroupState {
  myGroups: StudyGroup[];
  publicGroups: StudyGroup[];
  activeGroup: StudyGroup | null;
  progressFeed: ProgressShare[];
  loading: boolean;
  error: string | null;

  loadMyGroups: () => Promise<void>;
  loadPublicGroups: () => Promise<void>;
  createGroup: (params: Parameters<typeof studyGroupService.createGroup>[0]) => Promise<string>;
  joinGroup: (groupId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<string>;
  leaveGroup: (groupId: string) => Promise<void>;
  setActiveGroup: (group: StudyGroup | null) => void;
  shareProgress: (params: Parameters<typeof studyGroupService.shareProgress>[0]) => Promise<string>;
  loadProgressFeed: (friendUids: string[]) => Promise<void>;
  clearError: () => void;
}

export const useStudyGroupStore = create<StudyGroupState>((set, get) => ({
  myGroups: [],
  publicGroups: [],
  activeGroup: null,
  progressFeed: [],
  loading: false,
  error: null,

  loadMyGroups: async () => {
    set({ loading: true, error: null });
    try {
      const groups = await studyGroupService.getUserGroups();
      set({ myGroups: groups });
    } catch (err) {
      set({ error: 'Gruplar yüklenemedi' });
    } finally {
      set({ loading: false });
    }
  },

  loadPublicGroups: async () => {
    set({ loading: true, error: null });
    try {
      const groups = await studyGroupService.getPublicGroups();
      set({ publicGroups: groups });
    } catch (err) {
      set({ error: 'Gruplar yüklenemedi' });
    } finally {
      set({ loading: false });
    }
  },

  createGroup: async (params) => {
    set({ loading: true, error: null });
    try {
      const groupId = await studyGroupService.createGroup(params);
      await get().loadMyGroups();
      return groupId;
    } catch (err) {
      set({ error: 'Grup oluşturulamadı' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  joinGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      await studyGroupService.joinGroup(groupId);
      await get().loadMyGroups();
    } catch (err: any) {
      set({ error: err.message ?? 'Gruba katılınamadı' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  joinByCode: async (code) => {
    set({ loading: true, error: null });
    try {
      const groupId = await studyGroupService.joinGroupByInviteCode(code);
      await get().loadMyGroups();
      return groupId;
    } catch (err: any) {
      set({ error: err.message ?? 'Geçersiz davet kodu' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  leaveGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      await studyGroupService.leaveGroup(groupId);
      set(state => ({
        myGroups: state.myGroups.filter(g => g.id !== groupId),
        activeGroup: state.activeGroup?.id === groupId ? null : state.activeGroup,
      }));
    } catch (err) {
      set({ error: 'Gruptan ayrılınamadı' });
    } finally {
      set({ loading: false });
    }
  },

  setActiveGroup: (group) => set({ activeGroup: group }),

  shareProgress: async (params) => {
    try {
      return await studyGroupService.shareProgress(params);
    } catch (err) {
      set({ error: 'İlerleme paylaşılamadı' });
      throw err;
    }
  },

  loadProgressFeed: async (friendUids) => {
    try {
      const feed = await studyGroupService.getFriendProgressFeed(friendUids);
      set({ progressFeed: feed });
    } catch (err) {
      // Sessizce başarısız ol
    }
  },

  clearError: () => set({ error: null }),
}));
