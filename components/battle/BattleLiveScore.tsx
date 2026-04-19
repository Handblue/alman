import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface BattleLiveScoreProps {
  myScore: number;
  opponentScore: number;
  questionNumber: number;
  totalQuestions: number;
}

export function BattleLiveScore({
  myScore,
  opponentScore,
  questionNumber,
  totalQuestions,
}: BattleLiveScoreProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);

  const myScale = useSharedValue(1);
  const opponentScale = useSharedValue(1);

  const previousMyScore = useRef(myScore);
  const previousOpponentScore = useRef(opponentScore);

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

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        setReduceMotionEnabled(isEnabled);
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (previousMyScore.current === myScore) {
      return;
    }

    if (reduceMotionEnabled !== false) {
      myScale.value = 1;
      previousMyScore.current = myScore;
      return;
    }

    cancelAnimation(myScale);
    myScale.value = 1;
    myScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
    previousMyScore.current = myScore;
  }, [myScale, myScore, reduceMotionEnabled]);

  useEffect(() => {
    if (previousOpponentScore.current === opponentScore) {
      return;
    }

    if (reduceMotionEnabled !== false) {
      opponentScale.value = 1;
      previousOpponentScore.current = opponentScore;
      return;
    }

    cancelAnimation(opponentScale);
    opponentScale.value = 1;
    opponentScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
    previousOpponentScore.current = opponentScore;
  }, [opponentScale, opponentScore, reduceMotionEnabled]);

  const myAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: myScale.value }],
  }));

  const opponentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: opponentScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View accessible accessibilityLabel={`Senin skorun: ${myScore}`} style={styles.sideSection}>
        <Animated.View style={myAnimatedStyle}>
          <WKText color={Colors.status.success} style={styles.scoreText}>
            {myScore}
          </WKText>
        </Animated.View>
      </View>

      <View
        accessible
        accessibilityLabel={`Soru ${questionNumber} / ${totalQuestions}`}
        style={styles.centerSection}
      >
        <WKText color={Colors.text.secondary} style={styles.progressText}>
          {`Q ${questionNumber}/${totalQuestions}`}
        </WKText>
      </View>

      <View
        accessible
        accessibilityLabel={`Rakibin skoru: ${opponentScore}`}
        style={styles.sideSectionRight}
      >
        <Animated.View style={opponentAnimatedStyle}>
          <WKText color={Colors.status.error} style={styles.scoreText}>
            {opponentScore}
          </WKText>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    ...Shadows.level3,
  },
  sideSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: Spacing.s16,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.s8,
  },
  sideSectionRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: Spacing.s16,
  },
  scoreText: {
    ...Typography.heading2,
  },
  progressText: {
    ...Typography.bodySm,
    color: Colors.text.secondary,
  },
});

export default BattleLiveScore;
