import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';

// Battle screens are dark-immersive (cinematic). Provide the dark scheme to the whole group.
export default function BattleLayout() {
  return (
    <ThemeProvider initialDark>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="lobby" />
        <Stack.Screen name="vs" />
        <Stack.Screen name="question" />
        <Stack.Screen name="result" />
        <Stack.Screen name="history" />
      </Stack>
    </ThemeProvider>
  );
}
