import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const initializeAuth = useUserStore((s) => s.initializeAuth);
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak);
  const initializeProgressSync = useProgressStore((s) => s.initializeProgressSync);
  const initializeFolderSync = useFolderStore((s) => s.initializeFolderSync);
  const initializeSocialSync = useSocialStore((s) => s.initializeSocialSync);
  const loadAnalyticsData = useAnalyticsStore((s) => s.loadAnalyticsData);
  const loadAIData = useAnalyticsStore((s) => s.loadAIData);
  const loadStreakInsights = useAnalyticsStore((s) => s.loadStreakInsights);
  const loadFromCloud = useDailyChallengeStore((s) => s.loadFromCloud);

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ─── Bildirim deep link ──────────────────────────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const { router } = require('expo-router');
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

  // ─── Foreground → offline queue flush ───────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await flushOfflineQueue();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ─── Fontlar yüklenince splash kapat + arka plan init ───────────────────
  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    SplashScreen.hideAsync().catch(() => {});

    (async () => {
      try { await initializeAuth(); } catch {}
      try { checkAndUpdateStreak(); } catch {}
      try { initializeProgressSync(); } catch {}
      try { initializeFolderSync(); } catch {}
      try { initializeSocialSync(); } catch {}

      const userId = auth?.currentUser?.uid;
      if (userId) {
        try { loadAnalyticsData(userId); } catch {}
        try { loadAIData(userId); } catch {}
        try { loadStreakInsights(userId); } catch {}
        try { loadFromCloud(userId); } catch {}
      }

      try { NotificationService.getInstance().initialize(); } catch {}
      try { await flushOfflineQueue(); } catch {}
    })();
  }, [fontsLoaded, fontError]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

async function flushOfflineQueue() {
  const queue = OfflineQueueService.getInstance();
  const stats = queue.getStats();
  if (stats.total === 0) return;

  queue.deduplicateProgressUpdates();

  const userId = auth?.currentUser?.uid;
  if (!userId) return;

  const { db } = await import('@/firebase');
  if (!db) return;

  await queue.processQueue({
    onChallengeComplete: async (action) => {
      const { doc, setDoc, Timestamp } = await import('firebase/firestore');
      await setDoc(doc(db, 'daily_challenges', userId, 'sessions', action.date), {
        date: action.date, correctCount: action.correctCount,
        totalCount: action.totalCount, xpEarned: action.xpEarned,
        completed: true, syncedAt: Timestamp.now(),
      }, { merge: true });
    },
    onStreakUpdate: async (action) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), { streak: action.streak, lastActiveDate: action.date });
    },
    onXPGain: async (action) => {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), { xp: increment(action.amount) });
    },
    onBadgeEarn: async (action) => {
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), { badges: arrayUnion(action.badgeId) });
    },
  });
}
