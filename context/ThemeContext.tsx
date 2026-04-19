import React, { createContext, useContext, useState } from 'react';
import { Colors } from '@/constants/colors';

type Theme = {
  isDark: boolean;
  colors: {
    bg: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
  };
  toggleTheme: () => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const colors = {
    bg: isDark ? Colors.bg.primaryDark : Colors.bg.primaryLight,
    card: isDark ? Colors.bg.cardDark : Colors.bg.cardLight,
    textPrimary: isDark ? Colors.text.primaryDark : Colors.text.primaryLight,
    textSecondary: isDark ? Colors.text.secondary : Colors.text.secondaryLight,
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme: () => setIsDark(p => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
