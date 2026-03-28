import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { WKText } from './WKText';

interface WKButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function WKButton({ label, variant = 'primary', style, disabled, ...props }: WKButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={[styles.base, disabled && styles.disabled, style]}
      {...props}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={Colors.gradient.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <WKText variant="body" color="#FFFFFF" style={styles.label}>{label}</WKText>
        </LinearGradient>
      ) : (
        <View style={[styles.gradient, variant === 'secondary' && styles.secondary]}>
          <WKText variant="body" color={variant === 'ghost' ? Colors.brand.primary : '#FFFFFF'} style={styles.label}>
            {label}
          </WKText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.button, minHeight: 48, ...Shadows.level2 },
  gradient: { borderRadius: Radius.button, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  secondary: { backgroundColor: Colors.brand.primary },
  label: { fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
