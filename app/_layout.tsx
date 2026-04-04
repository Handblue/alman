import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useFolderStore } from '@/store/useFolderStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
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
  const initializeProgressSync = useProgressStore((s) => s.initializeProgressSync);
  const initializeFolderSync = useFolderStore((s) => s.initializeFolderSync);
  const initializeSocialSync = useSocialStore((s) => s.initializeSocialSync);
  const initializeAnalyticsSync = useAnalyticsStore((s) => s.refreshAnalytics);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Initialize Firebase auth and data sync
      initializeAuth().then(() => {
        initializeProgressSync();
        initializeFolderSync();
        initializeSocialSync();
        // Initialize analytics for logged-in users
        const userId = useUserStore.getState().user?.id;
        if (userId) {
          initializeAnalyticsSync(userId);
        }
      });
      router.replace(hasOnboarded ? '/(app)/dashboard' : '/(onboarding)/welcome');
    }
  }, [fontsLoaded, hasOnboarded, initializeAuth, initializeProgressSync, initializeFolderSync, initializeSocialSync, initializeAnalyticsSync]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
