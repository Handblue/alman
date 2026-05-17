import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { createStorage } from '@/utils/storage';
import { authService } from '@/services/authService';

const API_BASE = 'http://45.143.11.97/api';

const storage = createStorage('notification-prefs');

export interface NotificationPreferences {
  dailyReminder: boolean;
  reminderHour: number;   // 0–23
  reminderMinute: number; // 0–59
  streakAlert: boolean;
  challengeUpdates: boolean;
  badgeAlerts: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  dailyReminder: true,
  reminderHour: 19,
  reminderMinute: 0,
  streakAlert: true,
  challengeUpdates: true,
  badgeAlerts: true,
};

const DAILY_MESSAGES = [
  { title: 'WortKrieg zamanı! ⚔️', body: 'Bugün Almanca kelimelerin seni bekliyor.' },
  { title: 'Serin devam ediyor! 🔥', body: 'Çalışmayı unutma, serin kırılmasın.' },
  { title: 'Yeni kelimeler seni bekliyor 📖', body: 'Kısa bir seans bile büyük fark yaratır.' },
  { title: 'Almanca öğrenme vakti! 🇩🇪', body: '5 dakika bile fark yaratır. Hadi başlayalım!' },
  { title: 'Günlük hedefine ulaştın mı? 🎯', body: 'Bugünkü kelimelerini öğrenmek için buraya tıkla.' },
  { title: 'Öğrenme maceran sürüyor! 🚀', body: 'Her gün biraz daha iyi oluyorsun. Devam et!' },
  { title: 'Almanca bekliyor… 🇩🇪', body: 'Bugünkü pratik seansın hazır. Hadi başla!' },
];

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  async initialize(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const granted = await this.requestPermissions();
    if (granted) {
      await this.rescheduleAll();
    }
    return granted;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    if (existing === 'denied') return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // ─── Preferences ─────────────────────────────────────────────────────────

  getPreferences(): NotificationPreferences {
    const raw = storage.getString('prefs');
    if (!raw) return { ...DEFAULT_PREFS };
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }

  async savePreferences(prefs: NotificationPreferences): Promise<void> {
    storage.set('prefs', JSON.stringify(prefs));
    await this.rescheduleAll();
  }

  async updatePref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ): Promise<void> {
    const prefs = this.getPreferences();
    await this.savePreferences({ ...prefs, [key]: value });
  }

  // ─── Scheduling ───────────────────────────────────────────────────────────

  async rescheduleAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const prefs = this.getPreferences();
    if (prefs.dailyReminder) {
      await this.scheduleDailyReminder(prefs.reminderHour, prefs.reminderMinute);
    }
  }

  private async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
    const msg = DAILY_MESSAGES[new Date().getDay() % DAILY_MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: true,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  // ─── Immediate Notifications ──────────────────────────────────────────────

  async sendStreakAlert(currentStreak: number): Promise<void> {
    const prefs = this.getPreferences();
    if (!prefs.streakAlert) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Serin tehlikede!',
        body: `${currentStreak} günlük serini kaybetmek üzeresin. Hemen çalış!`,
        sound: true,
        data: { type: 'streak_alert', streak: currentStreak },
      },
      trigger: null,
    });
  }

  async sendChallengeComplete(xpEarned: number, correctCount: number, total: number): Promise<void> {
    const prefs = this.getPreferences();
    if (!prefs.challengeUpdates) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Günlük Challenge Tamamlandı!',
        body: `${correctCount}/${total} doğru · ${xpEarned} XP kazandın!`,
        sound: true,
        data: { type: 'challenge_complete' },
      },
      trigger: null,
    });
  }

  async sendBadgeEarned(badgeName: string, badgeEmoji: string): Promise<void> {
    const prefs = this.getPreferences();
    if (!prefs.badgeAlerts) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${badgeEmoji} Yeni Rozet Kazandın!`,
        body: `"${badgeName}" rozetinin kilidi açıldı!`,
        sound: true,
        data: { type: 'badge_earned' },
      },
      trigger: null,
    });
  }

  async sendStreakMilestone(streak: number): Promise<void> {
    const milestoneEmoji = streak >= 100 ? '👑' : streak >= 30 ? '🏆' : streak >= 14 ? '🔥' : '⭐';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${milestoneEmoji} ${streak} Günlük Seri!`,
        body: `Harika! ${streak} gün üst üste çalıştın. Bu inanılmaz bir başarı!`,
        sound: true,
        data: { type: 'streak_milestone', streak },
      },
      trigger: null,
    });
  }

  async sendBattleChallenge(challengerName: string): Promise<void> {
    const prefs = this.getPreferences();
    if (!prefs.challengeUpdates) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ Yeni Meydan Okuma!',
        body: `${challengerName} seni battle'a çağırıyor!`,
        sound: true,
        data: { type: 'battle_challenge' },
      },
      trigger: null,
    });
  }

  // ─── Push Token Registration ──────────────────────────────────────────────

  async registerAndSavePushToken(): Promise<void> {
    if (Platform.OS === 'web' || !Device.isDevice) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      const authToken = authService.getToken();
      if (!authToken) return;

      await fetch(`${API_BASE}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Non-critical — silently ignore
    }
  }
}
