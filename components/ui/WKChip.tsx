import React from 'react';
import { View, ViewProps } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { WKText } from './WKText';

interface WKChipProps extends ViewProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium';
}

export function WKChip({
  label,
  color = `${Colors.brand.primary}20`,
  textColor,
  size = 'medium',
  style,
  ...props
}: WKChipProps) {
  return (
    <View
      style={[
        {
          backgroundColor: color,
          borderRadius: Radius.chip,
          paddingVertical: size === 'small' ? Spacing.s2 : Spacing.s4,
          paddingHorizontal: size === 'small' ? Spacing.s8 : Spacing.s12,
        },
        style,
      ]}
      {...props}
    >
      <WKText variant="caption" color={textColor}>{label}</WKText>
    </View>
  );
}
