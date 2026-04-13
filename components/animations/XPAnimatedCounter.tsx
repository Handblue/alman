import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const AnimatedText = Animated.createAnimatedComponent(Text);

export interface XPAnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  style?: TextStyle;
}

export function XPAnimatedCounter({
  from = 0,
  to,
  duration = 800,
  style,
}: XPAnimatedCounterProps) {
  const sharedValue = useSharedValue(from);
  const isMountedRef = useRef(true);

  const [displayValue, setDisplayValue] = useState(() => Math.round(from));
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);

  const animatedValue = useDerivedValue(() => Math.round(sharedValue.value));

  const animatedProps = useAnimatedProps<TextProps>(() => ({
    accessibilityLabel: `+${animatedValue.value} XP`,
  }));

  const syncDisplayValue = (nextValue: number) => {
    if (!isMountedRef.current) {
      return;
    }

    setDisplayValue((currentValue) => (
      currentValue === nextValue ? currentValue : nextValue
    ));
  };

  useDerivedValue(() => {
    runOnJS(syncDisplayValue)(animatedValue.value);
  });

  useEffect(() => {
    let cancelled = false;

    const loadReduceMotionPreference = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();

        if (!cancelled) {
          setReduceMotionEnabled(isEnabled);
        }
      } catch {
        if (!cancelled) {
          setReduceMotionEnabled(false);
        }
      }
    };

    void loadReduceMotionPreference();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled === null) {
      return;
    }

    if (reduceMotionEnabled) {
      sharedValue.value = to;
      setDisplayValue(Math.round(to));
      return;
    }

    sharedValue.value = withTiming(to, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, reduceMotionEnabled, sharedValue, to]);

  return (
    <WKText
      accessibilityLabel={`${to} XP kazanıldı`}
      accessibilityLiveRegion="polite"
      accessible
      style={[styles.text, style]}
    >
      +
      <AnimatedText animatedProps={animatedProps}>{displayValue}</AnimatedText>
      {' XP'}
    </WKText>
  );
}

const styles = StyleSheet.create({
  text: {
    ...Typography.score,
    color: Colors.accent.orange,
  },
});

export default XPAnimatedCounter;
