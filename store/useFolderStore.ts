import { create } from 'zustand';
import { Folder } from '@/services/folderService';
import { createStorage, readStoredJson } from '@/utils/storage';

// Conditionally import Firebase services only in non-test environments
let folderService: any = null;
let authService: any = null;
const isTestEnv = process.env.JEST_WORKER_ID !== undefined;

if (!isTestEnv) {
  // Only import in production/runtime
  const { folderService: fs } = require('@/services/folderService');
  const { authService: as } = require('@/services/authService');
  folderService = fs;
  authService = as;
}

const storage = createStorage('folder-store');

interface FolderState {
  folders: Folder[];
  isOnline: boolean;
  createFolder: (name: string) => string;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  addWordToFolder: (folderId: string, wordId: number) => void;
  removeWordFromFolder: (folderId: string, wordId: number) => void;
  isWordInFolder: (folderId: string, wordId: number) => boolean;
  syncWithCloud: () => Promise<void>;
  initializeFolderSync: () => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: readStoredJson<Folder[]>(storage, 'folders', []),
  isOnline: false,

  createFolder: (name) => {
    const { folders } = get();
    if (folders.length >= 3) return '';
    const id = Date.now().toString();
    const newFolder: Folder = {
      id,
      name,
      wordIds: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...folders, newFolder];
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
    get().syncWithCloud();
    return id;
  },

  deleteFolder: (id) => {
    const updated = get().folders.filter((f) => f.id !== id);
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
    get().syncWithCloud();
  },

  renameFolder: (id, name) => {
    const updated = get().folders.map((f) => f.id === id ? { ...f, name } : f);
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
    get().syncWithCloud();
  },

  addWordToFolder: (folderId, wordId) => {
    const updated = get().folders.map((f) => {
      if (f.id !== folderId) return f;
      if (f.wordIds.length >= 50) return f;
      if (f.wordIds.includes(wordId)) return f;
      return { ...f, wordIds: [...f.wordIds, wordId] };
    });
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
    get().syncWithCloud();
  },

  removeWordFromFolder: (folderId, wordId) => {
    const updated = get().folders.map((f) => {
      if (f.id !== folderId) return f;
      return { ...f, wordIds: f.wordIds.filter((id) => id !== wordId) };
    });
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
    get().syncWithCloud();
  },

  isWordInFolder: (folderId, wordId) => {
    const folder = get().folders.find((f) => f.id === folderId);
    return folder ? folder.wordIds.includes(wordId) : false;
  },

  syncWithCloud: async () => {
    if (!folderService || !authService) return; // Skip in test environment

    const user = authService.getCurrentUser();
    if (!user) return;

    const state = get();
    try {
      await folderService.updateFolderData(user.uid, {
        folders: state.folders,
      });
    } catch (error) {
      console.error('Failed to sync folders with cloud:', error);
    }
  },

  initializeFolderSync: async () => {
    if (!folderService || !authService) return; // Skip in test environment

    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      // Sync local data to cloud
      const state = get();
      await folderService.syncLocalDataToCloud(state.folders);

      // Subscribe to cloud changes
      folderService.subscribeToFolderData(user.uid, (folderData: { folders: Folder[] } | null) => {
        if (folderData) {
          // Update local state with cloud data
          storage.set('folders', JSON.stringify(folderData.folders));
          set({
            folders: folderData.folders,
            isOnline: true,
          });
        }
      });
    } catch (error) {
      console.error('Failed to initialize folder sync:', error);
      set({ isOnline: false });
    }
  },
}));

export type { Folder };
