import React from 'react';
import { View, ViewProps } from 'react-native';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { WKText } from './WKText';

interface WKChipProps extends ViewProps {
  label: string;
  color?: string;
  textColor?: string;
}

export function WKChip({ label, color = '#1A73E820', textColor, style, ...props }: WKChipProps) {
  return (
    <View style={[{ backgroundColor: color, borderRadius: Radius.chip, paddingVertical: Spacing.s4, paddingHorizontal: Spacing.s12 }, style]} {...props}>
      <WKText variant="caption" color={textColor}>{label}</WKText>
    </View>
  );
}
