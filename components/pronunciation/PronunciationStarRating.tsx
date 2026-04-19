import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface PronunciationStarRatingProps {
  score: 1 | 2 | 3 | 4 | 5;
  animate?: boolean;
}

interface StarProps {
  filled: boolean;
  index: number;
  animate: boolean;
  reducedMotionEnabled: boolean;
}

function Star({ filled, index, animate, reducedMotionEnabled }: StarProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (reducedMotionEnabled || !animate) {
      scale.value = 1;
      return;
    }

    scale.value = withDelay(
      index * 120,
      withSpring(1.3, { damping: 9, stiffness: 220 }, (finished) => {
        if (finished) {
          scale.value = withSpring(1, { damping: 12, stiffness: 180 });
        }
      }),
    );
  }, [animate, index, reducedMotionEnabled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <WKText
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.star,
          filled ? styles.filledStar : styles.emptyStar,
        ]}
      >
        ★
      </WKText>
    </Animated.View>
  );
}

export function PronunciationStarRating({
  score,
  animate = true,
}: PronunciationStarRatingProps) {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReducedMotionEnabled(enabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReducedMotionEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReducedMotionEnabled(enabled);
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const feedbackColor =
    score < 3 ? Colors.status.error : Colors.status.success;
  const feedbackText = score < 3 ? 'Tekrar dene 🎯' : 'Harika! 🌟';

  return (
    <View
      accessibilityLabel={`${score} yıldız, 5 üzerinden`}
      accessibilityRole="text"
      style={styles.container}
    >
      <View style={styles.starRow}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            animate={animate}
            filled={index < score}
            index={index}
            reducedMotionEnabled={reducedMotionEnabled}
          />
        ))}
      </View>
      <WKText color={feedbackColor} style={styles.feedbackText}>
        {feedbackText}
      </WKText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.s8,
  },
  starRow: {
    flexDirection: 'row',
    gap: Spacing.s4,
  },
  star: {
    ...Typography.bodySm,
    fontSize: 28,
    lineHeight: 32,
  },
  filledStar: {
    color: Colors.accent.gold,
    opacity: 1,
  },
  emptyStar: {
    color: Colors.text.secondary,
    opacity: 0.25,
  },
  feedbackText: {
    ...Typography.bodySm,
  },
});
