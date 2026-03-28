import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'folder-store' });

export type Folder = {
  id: string;
  name: string;
  wordIds: number[];
  createdAt: string;
};

interface FolderState {
  folders: Folder[];
  createFolder: (name: string) => string;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  addWordToFolder: (folderId: string, wordId: number) => void;
  removeWordFromFolder: (folderId: string, wordId: number) => void;
  isWordInFolder: (folderId: string, wordId: number) => boolean;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: JSON.parse(storage.getString('folders') ?? '[]'),

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
    return id;
  },

  deleteFolder: (id) => {
    const updated = get().folders.filter((f) => f.id !== id);
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
  },

  renameFolder: (id, name) => {
    const updated = get().folders.map((f) => f.id === id ? { ...f, name } : f);
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
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
  },

  removeWordFromFolder: (folderId, wordId) => {
    const updated = get().folders.map((f) => {
      if (f.id !== folderId) return f;
      return { ...f, wordIds: f.wordIds.filter((id) => id !== wordId) };
    });
    storage.set('folders', JSON.stringify(updated));
    set({ folders: updated });
  },

  isWordInFolder: (folderId, wordId) => {
    const folder = get().folders.find((f) => f.id === folderId);
    return folder ? folder.wordIds.includes(wordId) : false;
  },
}));
