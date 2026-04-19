import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { WKText } from './WKText';

interface WKButtonProps extends TouchableOpacityProps {
  label?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export function WKButton({
  label,
  title,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  ...props
}: WKButtonProps) {
  const resolvedLabel = label ?? title ?? '';
  const sizeStyle = size === 'small'
    ? styles.small
    : size === 'large'
      ? styles.large
      : styles.medium;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      disabled={disabled}
      style={[styles.base, disabled && styles.disabled, style]}
      {...props}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={Colors.gradient.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyle]}
        >
          <WKText variant="body" color={Colors.text.primaryDark} style={styles.label}>
            {resolvedLabel}
          </WKText>
        </LinearGradient>
      ) : (
        <View style={[styles.gradient, sizeStyle, variant === 'secondary' && styles.secondary, variant === 'ghost' && styles.ghost]}>
          <WKText
            variant="body"
            color={variant === 'ghost' ? Colors.brand.primary : Colors.text.primaryDark}
            style={styles.label}
          >
            {resolvedLabel}
          </WKText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.button, minHeight: 48, ...Shadows.level2 },
  gradient: { borderRadius: Radius.button, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: Colors.brand.primary },
  ghost: { backgroundColor: 'transparent' },
  label: { fontWeight: '600' },
  disabled: { opacity: 0.5 },
  small: { minHeight: 40, paddingVertical: 10, paddingHorizontal: 16 },
  medium: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 24 },
  large: { minHeight: 56, paddingVertical: 18, paddingHorizontal: 28 },
});
