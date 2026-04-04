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

export interface UserProfile {
  uid: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  selectedLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | null;
  selectedCategories: number[];
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

class UserService {
  private unsubscribeUser: Unsubscribe | null = null;

  async createUserProfile(uid: string, initialData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userProfile: UserProfile = {
      uid,
      xp: 0,
      level: 1,
      streak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      selectedLevel: null,
      selectedCategories: [],
      badges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...initialData,
    };

    await setDoc(userRef, userProfile);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
    const userRef = doc(db, 'users', uid);
    this.unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserProfile);
      } else {
        callback(null);
      }
    });
    return this.unsubscribeUser;
  }

  unsubscribeUserProfile(): void {
    if (this.unsubscribeUser) {
      this.unsubscribeUser();
      this.unsubscribeUser = null;
    }
  }

  async syncLocalDataToCloud(localData: {
    xp: number;
    level: number;
    streak: number;
    lastActiveDate: string | null;
    selectedLevel: UserProfile['selectedLevel'];
    selectedCategories: number[];
    badges: string[];
  }): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const cloudProfile = await this.getUserProfile(user.uid);
    if (!cloudProfile) {
      // Create new profile with local data
      await this.createUserProfile(user.uid, localData);
    } else {
      // Merge local and cloud data (prefer higher values)
      const mergedData = {
        xp: Math.max(localData.xp, cloudProfile.xp),
        level: Math.max(localData.level, cloudProfile.level),
        streak: Math.max(localData.streak, cloudProfile.streak),
        lastActiveDate: localData.lastActiveDate || cloudProfile.lastActiveDate,
        selectedLevel: localData.selectedLevel || cloudProfile.selectedLevel,
        selectedCategories: localData.selectedCategories.length > 0
          ? localData.selectedCategories
          : cloudProfile.selectedCategories,
        badges: [...new Set([...localData.badges, ...cloudProfile.badges])],
      };
      await this.updateUserProfile(user.uid, mergedData);
    }
  }
}

export const userService = new UserService();