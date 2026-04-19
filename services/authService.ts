import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from '../firebase';

class AuthService {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        this.user = user;
        this.listeners.forEach(listener => listener(user));
      });
    }
  }

  async signInAnonymously(): Promise<User> {
    if (!auth) return null as any;
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      throw error as AuthError;
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  onAuthStateChange(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signOut(): Promise<void> {
    if (auth) await auth.signOut();
  }
}

export const authService = new AuthService();