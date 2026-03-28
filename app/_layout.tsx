import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { useUserStore } from '@/store/useUserStore';
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      router.replace(hasOnboarded ? '/(app)/dashboard' : '/(onboarding)/welcome');
    }
  }, [fontsLoaded, hasOnboarded]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
