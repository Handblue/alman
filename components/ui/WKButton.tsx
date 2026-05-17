import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { WKText } from './WKText';

interface WKButtonProps extends TouchableOpacityProps {
  label?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'violet' | 'dark' | 'tint';
  size?: 'small' | 'medium' | 'large';
}

const HEIGHT  = { small: 36, medium: 48, large: 56 };
const PADV    = { small: 10, medium: 14, large: 18 };
const PADH    = { small: 16, medium: 24, large: 28 };
const FONT_SZ = { small: 13, medium: 14, large: 15 };

export function WKButton({
  label,
  title,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  ...props
}: WKButtonProps) {
  const text = label ?? title ?? '';
  const h  = HEIGHT[size];
  const pv = PADV[size];
  const ph = PADH[size];
  const fs = FONT_SZ[size];

  const inner = (
    variant === 'primary' ? (
      <LinearGradient
        colors={Colors.gradient.cta}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.inner, { minHeight: h, paddingVertical: pv, paddingHorizontal: ph }]}
      >
        <WKText style={[styles.label, { fontSize: fs, color: '#fff' }]}>{text}</WKText>
      </LinearGradient>
    ) : (
      <View style={[
        styles.inner,
        { minHeight: h, paddingVertical: pv, paddingHorizontal: ph },
        variant === 'violet' && styles.variantViolet,
        variant === 'secondary' && styles.variantSecondary,
        variant === 'ghost'   && styles.variantGhost,
        variant === 'dark'    && styles.variantDark,
        variant === 'tint'    && styles.variantTint,
      ]}>
        <WKText style={[styles.label, { fontSize: fs }, variantTextColor(variant)]}>
          {text}
        </WKText>
      </View>
    )
  );

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={text}
      disabled={disabled}
      activeOpacity={0.82}
      style={[styles.base, disabled && styles.disabled, style]}
      {...props}
    >
      {inner}
    </TouchableOpacity>
  );
}

function variantTextColor(variant: string) {
  switch (variant) {
    case 'violet':    return { color: '#fff' };
    case 'secondary': return { color: '#fff' };
    case 'ghost':     return { color: Colors.text.muted };
    case 'dark':      return { color: Colors.text.primaryDark };
    case 'tint':      return { color: Colors.brand.violet };
    default:          return { color: '#fff' };
  }
}

const styles = StyleSheet.create({
  base:  { borderRadius: 999, overflow: 'hidden' },
  inner: { borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  label: { fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  disabled: { opacity: 0.5 },

  variantViolet:    { backgroundColor: Colors.brand.violet },
  variantSecondary: { backgroundColor: Colors.brand.violet },
  variantGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D9E1EC',
  },
  variantDark: {
    backgroundColor: '#243447',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  variantTint: { backgroundColor: '#EEF2FF' },
});
