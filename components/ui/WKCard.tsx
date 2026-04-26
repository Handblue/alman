import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Radius } from '@/constants/radius';

interface WKCardProps extends ViewProps {
  dark?: boolean;
}

export function WKCard({ style, children, dark, ...props }: WKCardProps) {
  const { colors, isDark } = useTheme();
  const useDark = dark ?? isDark;

  return (
    <View
      style={[{
        backgroundColor: useDark ? '#1A2A3A' : '#FFFFFF',
        borderRadius: Radius.card,
        padding: 16,
        borderWidth: 1,
        borderColor: useDark ? 'rgba(255,255,255,0.08)' : '#D9E1EC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: useDark ? 0 : 0.06,
        shadowRadius: 4,
        elevation: useDark ? 0 : 2,
      }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
