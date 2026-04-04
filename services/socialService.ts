import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';

export interface Friend {
  uid: string;
  displayName: string;
  avatar?: string;
  xp: number;
  level: number;
  lastActive: string;
  status: 'online' | 'offline' | 'away';
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromDisplayName: string;
  fromAvatar?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  creatorUid: string;
  creatorName: string;
  participants: string[];
  targetWords: number;
  targetDays: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: Record<string, { completedWords: number; streak: number }>;
}

class SocialService {
  private unsubscribeFriends: Unsubscribe | null = null;
  private unsubscribeRequests: Unsubscribe | null = null;
  private unsubscribeChallenges: Unsubscribe | null = null;

  // Friend Management
  async sendFriendRequest(toUid: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const requestId = `${user.uid}_${toUid}_${Date.now()}`;
    const requestRef = doc(db, 'friendRequests', requestId);

    // Get sender info
    const userProfile = await this.getUserPublicProfile(user.uid);
    if (!userProfile) throw new Error('User profile not found');

    const request: FriendRequest = {
      id: requestId,
      fromUid: user.uid,
      toUid,
      fromDisplayName: userProfile.displayName || 'Anonymous User',
      fromAvatar: userProfile.avatar,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(requestRef, request);
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const requestRef = doc(db, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error('Friend request not found');

    const request = requestSnap.data() as FriendRequest;
    if (request.toUid !== user.uid) throw new Error('Unauthorized');

    // Update request status
    await updateDoc(requestRef, { status: 'accepted' });

    // Add to friends lists
    await this.addFriend(request.fromUid, request.toUid);
    await this.addFriend(request.toUid, request.fromUid);
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const requestRef = doc(db, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error('Friend request not found');

    const request = requestSnap.data() as FriendRequest;
    if (request.toUid !== user.uid) throw new Error('Unauthorized');

    await updateDoc(requestRef, { status: 'declined' });
  }

  private async addFriend(uid1: string, uid2: string): Promise<void> {
    const friendsRef1 = doc(db, 'users', uid1, 'friends', uid2);
    const friendsRef2 = doc(db, 'users', uid2, 'friends', uid1);

    await setDoc(friendsRef1, { friendUid: uid2, addedAt: Timestamp.now() });
    await setDoc(friendsRef2, { friendUid: uid1, addedAt: Timestamp.now() });
  }

  async removeFriend(friendUid: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const friendRef1 = doc(db, 'users', user.uid, 'friends', friendUid);
    const friendRef2 = doc(db, 'users', friendUid, 'friends', user.uid);

    await Promise.all([
      updateDoc(friendRef1, { status: 'removed', removedAt: Timestamp.now() }),
      updateDoc(friendRef2, { status: 'removed', removedAt: Timestamp.now() }),
    ]);
  }

  async getFriends(uid: string): Promise<Friend[]> {
    const friendsRef = collection(db, 'users', uid, 'friends');
    const friendsSnap = await getDocs(friendsRef);

    const friends: Friend[] = [];
    for (const friendDoc of friendsSnap.docs) {
      const friendData = friendDoc.data();
      if (friendData.status !== 'removed') {
        const profile = await this.getUserPublicProfile(friendData.friendUid);
        if (profile) {
          friends.push({
            uid: friendData.friendUid,
            displayName: profile.displayName || 'Anonymous User',
            avatar: profile.avatar,
            xp: profile.xp || 0,
            level: profile.level || 1,
            lastActive: profile.lastActive || profile.updatedAt || new Date().toISOString(),
            status: this.getUserStatus(profile.lastActive),
          });
        }
      }
    }

    return friends;
  }

  async getPendingRequests(uid: string): Promise<FriendRequest[]> {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    );
    const requestsSnap = await getDocs(q);

    return requestsSnap.docs.map(doc => doc.data() as FriendRequest);
  }

  async getSentRequests(uid: string): Promise<FriendRequest[]> {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      where('fromUid', '==', uid),
      where('status', '==', 'pending')
    );
    const requestsSnap = await getDocs(q);

    return requestsSnap.docs.map(doc => doc.data() as FriendRequest);
  }

  // User Profile
  async getUserPublicProfile(uid: string): Promise<any> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid,
        displayName: data.displayName || `User${uid.slice(0, 6)}`,
        avatar: data.avatar,
        xp: data.xp || 0,
        level: data.level || 1,
        lastActive: data.lastActive || data.updatedAt,
      };
    }
    return null;
  }

  async updateUserProfile(updates: Partial<{ displayName: string; avatar: string }>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  private getUserStatus(lastActive: string): 'online' | 'offline' | 'away' {
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);

    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 60) return 'away';
    return 'offline';
  }

  // Challenge System
  async createChallenge(challenge: Omit<SocialChallenge, 'id' | 'participants' | 'progress'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const challengeRef = doc(db, 'social', 'challenges', challengeId);

    const newChallenge: SocialChallenge = {
      ...challenge,
      id: challengeId,
      participants: [user.uid],
      progress: {
        [user.uid]: { completedWords: 0, streak: 0 },
      },
    };

    await setDoc(challengeRef, newChallenge);
    return challengeId;
  }

  async joinChallenge(challengeId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const challengeRef = doc(db, 'social', 'challenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) throw new Error('Challenge not found');

    const challenge = challengeSnap.data() as SocialChallenge;
    if (challenge.participants.includes(user.uid)) {
      throw new Error('Already joined this challenge');
    }

    await updateDoc(challengeRef, {
      participants: arrayUnion(user.uid),
      [`progress.${user.uid}`]: { completedWords: 0, streak: 0 },
    });
  }

  async updateChallengeProgress(challengeId: string, completedWords: number, streak: number): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const challengeRef = doc(db, 'social', 'challenges', challengeId);
    await updateDoc(challengeRef, {
      [`progress.${user.uid}`]: { completedWords, streak },
    });
  }

  async getActiveChallenges(): Promise<SocialChallenge[]> {
    const challengesRef = collection(db, 'social', 'challenges');
    const q = query(where('status', '==', 'active'));
    const challengesSnap = await getDocs(q);

    return challengesSnap.docs.map(doc => doc.data() as SocialChallenge);
  }

  async getUserChallenges(uid: string): Promise<SocialChallenge[]> {
    const challengesRef = collection(db, 'social', 'challenges');
    const challengesSnap = await getDocs(challengesRef);

    return challengesSnap.docs
      .map(doc => doc.data() as SocialChallenge)
      .filter(challenge => challenge.participants.includes(uid));
  }

  // Subscriptions
  subscribeToFriends(uid: string, callback: (friends: Friend[]) => void): Unsubscribe {
    const friendsRef = collection(db, 'users', uid, 'friends');
    this.unsubscribeFriends = onSnapshot(friendsRef, async () => {
      const friends = await this.getFriends(uid);
      callback(friends);
    });
    return this.unsubscribeFriends;
  }

  subscribeToFriendRequests(uid: string, callback: (requests: FriendRequest[]) => void): Unsubscribe {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    );
    this.unsubscribeRequests = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data() as FriendRequest);
      callback(requests);
    });
    return this.unsubscribeRequests;
  }

  subscribeToChallenges(callback: (challenges: SocialChallenge[]) => void): Unsubscribe {
    const challengesRef = collection(db, 'social', 'challenges');
    this.unsubscribeChallenges = onSnapshot(challengesRef, (snapshot) => {
      const challenges = snapshot.docs.map(doc => doc.data() as SocialChallenge);
      callback(challenges);
    });
    return this.unsubscribeChallenges;
  }

  unsubscribeAll(): void {
    if (this.unsubscribeFriends) {
      this.unsubscribeFriends();
      this.unsubscribeFriends = null;
    }
    if (this.unsubscribeRequests) {
      this.unsubscribeRequests();
      this.unsubscribeRequests = null;
    }
    if (this.unsubscribeChallenges) {
      this.unsubscribeChallenges();
      this.unsubscribeChallenges = null;
    }
  }
}

export const socialService = new SocialService();