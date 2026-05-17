import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { WKText } from './WKText';

interface WKButtonProps extends PressableProps {
  label?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WKButton({
  label,
  title,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  onPress,
  ...props
}: WKButtonProps) {
  const resolvedLabel = label ?? title ?? '';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeStyle = size === 'small'
    ? styles.small
    : size === 'large'
      ? styles.large
      : styles.medium;

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.base, disabled && styles.disabled, animatedStyle, style]}
      {...props}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={Colors.gradient.cta as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.inner, sizeStyle]}
        >
          <WKText variant="body" color={Colors.text.onColor} style={styles.label}>
            {resolvedLabel}
          </WKText>
        </LinearGradient>
      )}

      {variant === 'secondary' && (
        <Animated.View style={[styles.inner, styles.secondaryInner, sizeStyle]}>
          <WKText variant="body" color={Colors.brand.primary} style={styles.label}>
            {resolvedLabel}
          </WKText>
        </Animated.View>
      )}

      {variant === 'ghost' && (
        <Animated.View style={[styles.inner, styles.ghostInner, sizeStyle]}>
          <WKText variant="body" color={Colors.brand.primary} style={styles.label}>
            {resolvedLabel}
          </WKText>
        </Animated.View>
      )}

      {variant === 'danger' && (
        <LinearGradient
          colors={['#FF5252', '#D32F2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.inner, sizeStyle]}
        >
          <WKText variant="body" color={Colors.text.onColor} style={styles.label}>
            {resolvedLabel}
          </WKText>
        </LinearGradient>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.button,
    overflow: 'hidden',
    ...Shadows.level2,
  },
  inner: {
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryInner: {
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    backgroundColor: 'transparent',
  },
  ghostInner: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  disabled: { opacity: 0.45 },
  small:  { minHeight: 40, paddingVertical: 10, paddingHorizontal: 16 },
  medium: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 24 },
  large:  { minHeight: 58, paddingVertical: 18, paddingHorizontal: 32 },
});
