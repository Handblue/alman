import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

type CountVariant = keyof Pick<typeof Typography, 'bodySm' | 'body' | 'heading2'>;

export interface StreakFlameProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

const SIZE_CONFIG = {
  small: {
    flameFontSize: 14,
    textVariant: 'bodySm',
  },
  medium: {
    flameFontSize: 18,
    textVariant: 'body',
  },
  large: {
    flameFontSize: 24,
    textVariant: 'heading2',
  },
} as const satisfies Record<
  NonNullable<StreakFlameProps['size']>,
  {
    flameFontSize: number;
    textVariant: CountVariant;
  }
>;

export function StreakFlame({
  count,
  size = 'medium',
}: StreakFlameProps) {
  const scale = useSharedValue(1);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);

  const { flameFontSize, textVariant } = SIZE_CONFIG[size];
  const isHotStreak = count >= 7;
  const isMaxStreak = count >= 30;

  const countColor = isMaxStreak
    ? Colors.status.error
    : isHotStreak
      ? Colors.accent.orange
      : Colors.text.primaryDark;

  useEffect(() => {
    let isMounted = true;

    const loadReduceMotionPreference = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();

        if (isMounted) {
          setReduceMotionEnabled(isEnabled);
        }
      } catch {
        if (isMounted) {
          setReduceMotionEnabled(false);
        }
      }
    };

    void loadReduceMotionPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled !== false) {
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [reduceMotionEnabled, scale]);

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`${count} günlük seri`}
      accessibilityRole="text"
      style={styles.container}
    >
      <Animated.View style={[styles.flameWrapper, isMaxStreak && styles.flameGlow, animatedFlameStyle]}>
        <Text
          style={[
            styles.flameText,
            {
              color: Colors.text.primaryDark,
              fontSize: flameFontSize,
            },
          ]}
        >
          🔥
        </Text>
      </Animated.View>
      <WKText color={countColor} variant={textVariant}>
        {count}
      </WKText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  flameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameGlow: {
    elevation: 8,
    shadowColor: Colors.status.error,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  flameText: {
    textAlign: 'center',
  },
});

export default StreakFlame;
