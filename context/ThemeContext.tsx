import React, { createContext, useState } from 'react';
import { Colors } from '@/constants/colors';

type Theme = {
  isDark: boolean;
  colors: {
    bg: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  toggleTheme: () => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children, initialDark = false }: { children: React.ReactNode; initialDark?: boolean }) {
  // Hybrid design (see almaapp_ui_guide.md §6): light browse surfaces by default, with
  // dark-immersive screens (battle, pronunciation, dashboard) styling themselves explicitly.
  // So the global default is the LIGHT scheme; a dark-immersive screen can nest its own
  // <ThemeProvider initialDark> so its WKText/WKCard pick up the dark scheme.
  const [isDark, setIsDark] = useState(initialDark);

  const colors = {
    bg:            isDark ? Colors.bg.primaryDark  : Colors.bg.light,
    card:          isDark ? Colors.bg.cardDark     : Colors.bg.card,
    textPrimary:   isDark ? Colors.text.primaryDark  : Colors.text.primary,
    textSecondary: isDark ? Colors.text.mutedDark    : Colors.text.muted,
    border:        isDark ? Colors.border.dark       : Colors.border.primary,
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme: () => setIsDark(p => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
