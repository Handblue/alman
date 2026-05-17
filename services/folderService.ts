// Firebase kaldırıldı — klasörler useFolderStore (MMKV) üzerinde yerel saklanıyor.

export interface Folder {
  id: string;
  name: string;
  wordIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderData {
  folders: Folder[];
}

class FolderService {
  async createFolderDocument(_uid: string, _initialData: Partial<FolderData>): Promise<void> {}
  async getFolderData(_uid: string): Promise<FolderData | null> { return null; }
  async updateFolderData(_uid: string, _updates: Partial<FolderData>): Promise<void> {}
  async syncLocalDataToCloud(_localFolders: Folder[], _uid?: string): Promise<void> {}
}

export const folderService = new FolderService();
