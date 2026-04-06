import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useFolderStore } from '@/store/useFolderStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';
import { NotificationService } from '@/services/notificationService';
import { OfflineQueueService } from '@/services/offlineQueueService';
import { auth } from '@/firebase';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const initializeAuth = useUserStore((s) => s.initializeAuth);
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak);
  const initializeProgressSync = useProgressStore((s) => s.initializeProgressSync);
  const initializeFolderSync = useFolderStore((s) => s.initializeFolderSync);
  const initializeSocialSync = useSocialStore((s) => s.initializeSocialSync);
  const { loadAnalyticsData, loadAIData, loadStreakInsights } = useAnalyticsStore();
  const { loadFromCloud, syncToCloud } = useDailyChallengeStore();

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ─── Notification deep link handler ────────────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'daily_reminder' || data?.type === 'challenge_complete') {
        router.push('/(app)/daily-challenge');
      } else if (data?.type === 'streak_alert') {
        router.push('/(app)/dashboard');
      } else if (data?.type === 'badge_earned') {
        router.push('/(app)/profile');
      }
    });
    return () => sub.remove();
  }, []);

  // ─── App foreground → flush offline queue ───────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        await flushOfflineQueue();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ─── Main init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();

    initializeAuth().then(async () => {
      checkAndUpdateStreak();
      initializeProgressSync();
      initializeFolderSync();
      initializeSocialSync();

      const userId = auth.currentUser?.uid;
      if (userId) {
        // Analytics
        loadAnalyticsData(userId);
        loadAIData(userId);
        loadStreakInsights(userId);

        // Daily challenge cloud sync
        loadFromCloud(userId);

        // Streak alert check
        const { streak } = useUserStore.getState();
        const hour = new Date().getHours();
        if (streak > 0 && hour >= 20) {
          const notifService = NotificationService.getInstance();
          const prefs = notifService.getPreferences();
          if (prefs.streakAlert) {
            notifService.sendStreakAlert(streak).catch(() => {});
          }
        }
      }

      // Init push notifications (permission request)
      NotificationService.getInstance().initialize().catch(() => {});

      // Flush any queued offline actions
      await flushOfflineQueue();
    });

    router.replace(hasOnboarded ? '/(app)/dashboard' : '/(onboarding)/welcome');
  }, [fontsLoaded]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

// ─── Offline Queue Flush ────────────────────────────────────────────────────

async function flushOfflineQueue() {
  const queue = OfflineQueueService.getInstance();
  const stats = queue.getStats();
  if (stats.total === 0) return;

  queue.deduplicateProgressUpdates();

  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const result = await queue.processQueue({
    onChallengeComplete: async (action) => {
      const { db } = await import('@/firebase');
      const { doc, setDoc, Timestamp } = await import('firebase/firestore');
      await setDoc(
        doc(db, 'daily_challenges', userId, 'sessions', action.date),
        {
          date: action.date,
          correctCount: action.correctCount,
          totalCount: action.totalCount,
          xpEarned: action.xpEarned,
          completed: true,
          syncedAt: Timestamp.now(),
        },
        { merge: true }
      );
    },

    onStreakUpdate: async (action) => {
      const { db } = await import('@/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        streak: action.streak,
        lastActiveDate: action.date,
      });
    },

    onXPGain: async (action) => {
      const { db } = await import('@/firebase');
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        xp: increment(action.amount),
      });
    },

    onBadgeEarn: async (action) => {
      const { db } = await import('@/firebase');
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        badges: arrayUnion(action.badgeId),
      });
    },
  });

  if (result.processed > 0) {
    console.log(`[OfflineQueue] Synced ${result.processed} actions`);
  }
}
