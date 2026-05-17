import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://45.143.11.97/api';

export interface WKUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  plan: string;
}

const TOKEN_KEY = '@wk_access_token';
const USER_KEY = '@wk_user';

class AuthService {
  private accessToken: string | null = null;
  private currentUser: WKUser | null = null;
  private listeners: ((user: WKUser | null) => void)[] = [];

  async initialize() {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        this.accessToken = token;
        this.currentUser = JSON.parse(userJson);
        this.notify();
      }
    } catch {
      // ilk açılış
    }
  }

  // ─── Kayıt ────────────────────────────────────────────────────────────────
  async register(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    username?: string;
  }): Promise<{ message: string; accessToken?: string; user?: WKUser }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Kayıt başarısız');

    // Sunucu anında token döndürdüyse (SKIP_EMAIL_VERIFY=true modunda) otomatik giriş yap
    if (json.accessToken && json.user) {
      this.accessToken = json.accessToken;
      this.currentUser = json.user;
      await this.saveSession();
      this.notify();
    }
    return json;
  }

  // ─── Giriş ────────────────────────────────────────────────────────────────
  async signInWithEmail(email: string, password: string): Promise<WKUser> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Giriş başarısız');

    this.accessToken = json.accessToken;
    this.currentUser = json.user;
    await this.saveSession();
    this.notify();
    return json.user;
  }

  // ─── Şifre sıfırlama ──────────────────────────────────────────────────────
  async sendPasswordReset(email: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'İstek gönderilemedi');
    }
  }

  // ─── Doğrulama e-postasını tekrar gönder ──────────────────────────────────
  async resendVerification(email: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'İstek gönderilemedi');
    }
  }

  // ─── Çıkış ────────────────────────────────────────────────────────────────
  async signOut(): Promise<void> {
    this.accessToken = null;
    this.currentUser = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    this.notify();
  }

  // ─── Yardımcılar ──────────────────────────────────────────────────────────
  getCurrentUser(): WKUser | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken && !!this.currentUser;
  }

  onAuthStateChange(listener: (user: WKUser | null) => void): () => void {
    this.listeners.push(listener);
    // Hemen mevcut durumu bildir
    listener(this.currentUser);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i > -1) this.listeners.splice(i, 1);
    };
  }

  // Backend'e yetkili istek yapar
  async authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      await this.signOut();
    }
    return res;
  }

  private async saveSession() {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, this.accessToken!),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(this.currentUser)),
    ]);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentUser));
  }
}

export const authService = new AuthService();
