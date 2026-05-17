// Firebase kaldırıldı — kullanıcı verileri useUserStore (MMKV) + REST API (authService) üzerinde yönetiliyor.

export interface UserProfile {
  displayName: string;
  username?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  plan: string;
  profileVisibility: string;
  createdAt: string;
  updatedAt: string;
}

class UserService {
  async createUserProfile(_uid: string, _initialData: Partial<UserProfile>): Promise<void> {}
  async getUserProfile(_uid: string): Promise<UserProfile | null> { return null; }
  async updateUserProfile(_uid: string, _updates: Partial<UserProfile>): Promise<void> {}
  async syncLocalDataToCloud(_localData: Partial<UserProfile>, _uid: string): Promise<void> {}
}

export const userService = new UserService();
