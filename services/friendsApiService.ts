import { authService } from './authService';

export interface ApiFriend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  since: string;
}

export interface ApiFriendRequest {
  id: string;
  from: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    level: number;
  };
  createdAt: string;
}

export interface ApiUserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  xp: number;
}

class FriendsApiService {
  async getFriends(): Promise<ApiFriend[]> {
    const res = await authService.authFetch('/friends');
    if (!res.ok) throw new Error('Arkadaşlar yüklenemedi');
    return res.json();
  }

  async getPendingRequests(): Promise<ApiFriendRequest[]> {
    const res = await authService.authFetch('/friends/requests/incoming');
    if (!res.ok) throw new Error('İstekler yüklenemedi');
    return res.json();
  }

  async getSentRequests(): Promise<any[]> {
    const res = await authService.authFetch('/friends/requests/sent');
    if (!res.ok) return [];
    return res.json();
  }

  async sendRequest(toUserId: string): Promise<void> {
    const res = await authService.authFetch(`/friends/request/${toUserId}`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'İstek gönderilemedi');
  }

  async acceptRequest(requestId: string): Promise<void> {
    const res = await authService.authFetch(`/friends/accept/${requestId}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'İstek kabul edilemedi');
    }
  }

  async declineRequest(requestId: string): Promise<void> {
    const res = await authService.authFetch(`/friends/decline/${requestId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('İstek reddedilemedi');
  }

  async removeFriend(friendId: string): Promise<void> {
    const res = await authService.authFetch(`/friends/${friendId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Arkadaşlıktan çıkarılamadı');
  }

  async searchUsers(query: string): Promise<ApiUserSearchResult[]> {
    if (!query || query.length < 2) return [];
    const res = await authService.authFetch(`/users/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  }
}

export const friendsApiService = new FriendsApiService();
