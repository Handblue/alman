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
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.listeners.forEach(listener => listener(user));
    });
  }

  async signInAnonymously(): Promise<User> {
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
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signOut(): Promise<void> {
    await auth.signOut();
  }
}

export const authService = new AuthService();