import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';

// Study sessions are dark-immersive (see almaapp_ui_guide.md §6). Provide the dark scheme to
// all study screens so their WKText/WKCard render light-on-dark regardless of the global default.
export default function StudyLayout() {
  return (
    <ThemeProvider initialDark>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </ThemeProvider>
  );
}
