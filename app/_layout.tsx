import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useFolderStore } from '@/store/useFolderStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';
import { NotificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import { setupWidgetDataSync } from '@/services/widgetDataService';
import { widgetService } from '@/services/widgetService';
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
      } else if (data?.type === 'battle_challenge') {
        router.push('/(app)/battle/lobby');
      }
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

      const userId = authService.getCurrentUser()?.id;
      if (userId) {
        try { loadAnalyticsData(userId); } catch {}
        try { loadAIData(userId); } catch {}
        try { loadStreakInsights(userId); } catch {}
        try { loadFromCloud(userId); } catch {}
      }

      const ns = NotificationService.getInstance();
      try { await ns.initialize(); } catch {}
      try { await ns.registerAndSavePushToken(); } catch {}
    })();

    // Widget data sync — writes snapshot to shared storage on each app-active event
    const cleanupWidget = setupWidgetDataSync(() => {
      const snap = widgetService.getSnapshot();
      return {
        wordGerman: snap.wordOfTheDay.german,
        wordTurkish: snap.wordOfTheDay.turkish,
        streak: snap.streak,
        xpToday: snap.xp,
        goalProgress: snap.goalProgress,
        dailyChallengeCompleted: snap.dailyChallenge.completed,
        weeklyRank: 0,
        winRate: 0,
        lastUpdated: Date.now(),
      };
    });

    return () => {
      cleanupWidget();
    };
  }, [fontsLoaded, fontError]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
