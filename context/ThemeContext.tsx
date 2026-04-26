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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

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
