import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

import { Colors } from '@/constants/colors';

export interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  Colors.accent.gold,
  Colors.brand.primary,
  Colors.status.success,
  Colors.battle.purple,
  Colors.accent.orange,
] as const;

const REDUCED_MOTION_FLASH_OPACITY = 0.15;
const REDUCED_MOTION_FLASH_DURATION = 300;

interface StartableConfettiCannonProps extends React.ComponentProps<typeof ConfettiCannon> {
  autoStartDelay?: number;
}

type ConfettiCannonHandle = React.Component<StartableConfettiCannonProps> & {
  start: () => void;
};

const StartableConfettiCannon =
  ConfettiCannon as unknown as React.ComponentClass<StartableConfettiCannonProps>;

export default function ConfettiOverlay({
  visible,
  onComplete,
}: ConfettiOverlayProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);
  const cannon = useRef<ConfettiCannonHandle | null>(null);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashAnimation = useRef<Animated.CompositeAnimation | null>(null);

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
      flashAnimation.current?.stop();
      flashOpacity.stopAnimation();
    };
  }, [flashOpacity]);

  useEffect(() => {
    if (reduceMotionEnabled !== false || !visible) {
      return;
    }

    cannon.current?.start();
  }, [reduceMotionEnabled, visible]);

  useEffect(() => {
    if (reduceMotionEnabled !== true) {
      flashAnimation.current?.stop();
      flashOpacity.setValue(0);
      return;
    }

    flashAnimation.current?.stop();

    if (!visible) {
      flashOpacity.setValue(0);
      return;
    }

    const animation = Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: REDUCED_MOTION_FLASH_OPACITY,
        duration: REDUCED_MOTION_FLASH_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: REDUCED_MOTION_FLASH_DURATION,
        useNativeDriver: true,
      }),
    ]);

    flashAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });

    return () => {
      animation.stop();
    };
  }, [flashOpacity, onComplete, reduceMotionEnabled, visible]);

  if (!visible || reduceMotionEnabled === null) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      {reduceMotionEnabled ? (
        <Animated.View style={[styles.reducedMotionOverlay, { opacity: flashOpacity }]} />
      ) : (
        <StartableConfettiCannon
          ref={cannon}
          autoStart={false}
          autoStartDelay={0}
          count={400}
          origin={{ x: -10, y: 0 }}
          explosionSpeed={350}
          fallSpeed={3000}
          colors={[...CONFETTI_COLORS]}
          fadeOut
          onAnimationEnd={onComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9998,
  },
  reducedMotionOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.status.success,
  },
});
