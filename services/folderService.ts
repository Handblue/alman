import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';

export interface Folder {
  id: string;
  name: string;
  wordIds: number[];
  createdAt: string;
}

export interface FolderData {
  folders: Folder[];
  lastUpdated: string;
}

class FolderService {
  private unsubscribeFolders: Unsubscribe | null = null;

  async createFolderDocument(uid: string, initialData: Partial<FolderData>): Promise<void> {
    const folderRef = doc(db, 'folders', uid);
    const folderData: FolderData = {
      folders: [],
      lastUpdated: new Date().toISOString(),
      ...initialData,
    };

    await setDoc(folderRef, folderData);
  }

  async getFolderData(uid: string): Promise<FolderData | null> {
    const folderRef = doc(db, 'folders', uid);
    const folderSnap = await getDoc(folderRef);

    if (folderSnap.exists()) {
      return folderSnap.data() as FolderData;
    }
    return null;
  }

  async updateFolderData(uid: string, updates: Partial<FolderData>): Promise<void> {
    const folderRef = doc(db, 'folders', uid);
    await updateDoc(folderRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  }

  subscribeToFolderData(uid: string, callback: (folders: FolderData | null) => void): Unsubscribe {
    const folderRef = doc(db, 'folders', uid);
    this.unsubscribeFolders = onSnapshot(folderRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as FolderData);
      } else {
        callback(null);
      }
    });
    return this.unsubscribeFolders;
  }

  unsubscribeFolderData(): void {
    if (this.unsubscribeFolders) {
      this.unsubscribeFolders();
      this.unsubscribeFolders = null;
    }
  }

  async syncLocalDataToCloud(localFolders: Folder[]): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const cloudFolders = await this.getFolderData(user.uid);
    if (!cloudFolders) {
      // Create new folder document with local data
      await this.createFolderDocument(user.uid, { folders: localFolders });
    } else {
      // Merge local and cloud folders (prefer more recent updates)
      const mergedFolders = this.mergeFolders(localFolders, cloudFolders.folders);
      await this.updateFolderData(user.uid, { folders: mergedFolders });
    }
  }

  private mergeFolders(local: Folder[], cloud: Folder[]): Folder[] {
    const merged: Folder[] = [...cloud];
    const cloudIds = new Set(cloud.map(f => f.id));

    // Add new local folders that don't exist in cloud
    local.forEach(localFolder => {
      if (!cloudIds.has(localFolder.id)) {
        merged.push(localFolder);
      } else {
        // Update existing folder if local version is newer
        const cloudIndex = merged.findIndex(f => f.id === localFolder.id);
        const cloudFolder = merged[cloudIndex];

        // Simple merge: prefer the one with more words or newer creation
        if (localFolder.wordIds.length > cloudFolder.wordIds.length ||
            new Date(localFolder.createdAt) > new Date(cloudFolder.createdAt)) {
          merged[cloudIndex] = localFolder;
        }
      }
    });

    return merged;
  }
}

export const folderService = new FolderService();