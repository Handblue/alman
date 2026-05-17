import React from 'react';
import { Pressable, PressableProps, View, ViewProps, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';

interface WKCardProps extends ViewProps {
  onPress?: PressableProps['onPress'];
  pressable?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WKCard({ style, children, onPress, pressable, ...props }: WKCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.card },
    style,
  ];

  if (onPress || pressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[cardStyle, animatedStyle]}
        accessibilityRole="button"
        {...(props as PressableProps)}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.s16,
    ...Shadows.level1,
  },
});
