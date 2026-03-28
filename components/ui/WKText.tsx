import React from 'react';
import { Text, TextProps } from 'react-native';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';

type Variant = keyof typeof Typography;

interface WKTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function WKText({ variant = 'body', color, style, ...props }: WKTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[Typography[variant], { color: color ?? colors.textPrimary }, style]}
      {...props}
    />
  );
}
