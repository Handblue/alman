import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';

export function WKCard({ style, children, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[{
        backgroundColor: colors.card,
        borderRadius: Radius.card,
        padding: Spacing.s16,
        ...Shadows.level1,
      }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
