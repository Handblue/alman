import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  creatorUid: string;
  members: string[];
  maxMembers: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'mixed';
  isPrivate: boolean;
  inviteCode: string;
  createdAt: string;
  weeklyXP: Record<string, number>;
  totalXP: Record<string, number>;
}

export interface ProgressShare {
  id: string;
  fromUid: string;
  toUid: string | null;
  weeklyXP: number;
  wordsLearned: number;
  streakDays: number;
  topCategory: string;
  sharedAt: string;
  isPublic: boolean;
}

class StudyGroupService {
  private unsubscribeGroup: Unsubscribe | null = null;

  async createGroup(params: {
    name: string;
    description: string;
    level: StudyGroup['level'];
    isPrivate: boolean;
    maxMembers?: number;
  }): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const newGroup: StudyGroup = {
      id: groupId,
      name: params.name,
      description: params.description,
      creatorUid: user.id,
      members: [user.id],
      maxMembers: params.maxMembers ?? 10,
      level: params.level,
      isPrivate: params.isPrivate,
      inviteCode,
      createdAt: new Date().toISOString(),
      weeklyXP: { [user.id]: 0 },
      totalXP: { [user.id]: 0 },
    };

    await setDoc(doc(db, 'studyGroups', groupId), newGroup);
    return groupId;
  }

  async joinGroup(groupId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const groupRef = doc(db, 'studyGroups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error('Group not found');

    const group = groupSnap.data() as StudyGroup;
    if (group.members.length >= group.maxMembers) throw new Error('Group is full');
    if (group.members.includes(user.id)) throw new Error('Already a member');

    await updateDoc(groupRef, {
      members: arrayUnion(user.id),
      [`weeklyXP.${user.id}`]: 0,
      [`totalXP.${user.id}`]: 0,
    });
  }

  async joinGroupByInviteCode(inviteCode: string): Promise<string> {
    const groupsRef = collection(db, 'studyGroups');
    const q = query(groupsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid invite code');

    const groupId = snap.docs[0].id;
    await this.joinGroup(groupId);
    return groupId;
  }

  async leaveGroup(groupId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const groupRef = doc(db, 'studyGroups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(user.id),
    });
  }

  async updateWeeklyXP(groupId: string, xpAmount: number): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const groupRef = doc(db, 'studyGroups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) return;

    const group = groupSnap.data() as StudyGroup;
    const currentXP = group.weeklyXP[user.id] ?? 0;
    const currentTotal = group.totalXP[user.id] ?? 0;

    await updateDoc(groupRef, {
      [`weeklyXP.${user.id}`]: currentXP + xpAmount,
      [`totalXP.${user.id}`]: currentTotal + xpAmount,
    });
  }

  async getUserGroups(): Promise<StudyGroup[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const groupsRef = collection(db, 'studyGroups');
    const q = query(groupsRef, where('members', 'array-contains', user.id));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudyGroup);
  }

  async getPublicGroups(): Promise<StudyGroup[]> {
    const groupsRef = collection(db, 'studyGroups');
    const q = query(groupsRef, where('isPrivate', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudyGroup);
  }

  async getGroup(groupId: string): Promise<StudyGroup | null> {
    const groupRef = doc(db, 'studyGroups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) return null;
    return snap.data() as StudyGroup;
  }

  subscribeToGroup(groupId: string, callback: (group: StudyGroup) => void): Unsubscribe {
    const groupRef = doc(db, 'studyGroups', groupId);
    this.unsubscribeGroup = onSnapshot(groupRef, snap => {
      if (snap.exists()) callback(snap.data() as StudyGroup);
    });
    return this.unsubscribeGroup;
  }

  // Progress Sharing
  async shareProgress(params: {
    toUid?: string;
    weeklyXP: number;
    wordsLearned: number;
    streakDays: number;
    topCategory: string;
    isPublic: boolean;
  }): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const shareId = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const shareData: ProgressShare = {
      id: shareId,
      fromUid: user.id,
      toUid: params.toUid ?? null,
      weeklyXP: params.weeklyXP,
      wordsLearned: params.wordsLearned,
      streakDays: params.streakDays,
      topCategory: params.topCategory,
      sharedAt: new Date().toISOString(),
      isPublic: params.isPublic,
    };

    await setDoc(doc(db, 'progressShares', shareId), shareData);
    return shareId;
  }

  async getFriendProgressFeed(friendUids: string[]): Promise<ProgressShare[]> {
    if (friendUids.length === 0) return [];

    // Firestore 'in' max 10 items
    const limited = friendUids.slice(0, 10);
    const sharesRef = collection(db, 'progressShares');
    const q = query(sharesRef, where('fromUid', 'in', limited));
    const snap = await getDocs(q);

    return snap.docs
      .map(d => d.data() as ProgressShare)
      .sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime());
  }

  cleanup(): void {
    if (this.unsubscribeGroup) {
      this.unsubscribeGroup();
      this.unsubscribeGroup = null;
    }
  }
}

export const studyGroupService = new StudyGroupService();
