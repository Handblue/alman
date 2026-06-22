import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';

// Study-group detail is dark-immersive.
export default function StudyGroupLayout() {
  return (
    <ThemeProvider initialDark>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </ThemeProvider>
  );
}
