import { Platform } from 'react-native';

const shadow = (elevation: number, opacity: number) =>
  Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: elevation }, shadowOpacity: opacity, shadowRadius: elevation * 1.5 },
    android: { elevation },
  });

export const Shadows = {
  level1: shadow(2, 0.08),
  level2: shadow(4, 0.12),
  level3: shadow(8, 0.16),
  level4: shadow(16, 0.24),
} as const;
