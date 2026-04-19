import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { WKCard } from '@/components/ui/WKCard';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';

const QUESTION_DURATION_MS = 10000;
const ANSWER_DELAY_MS = 400;
const TIMEOUT_DELAY_MS = 800;
const TIMER_TICK_MS = 100;
const CRITICAL_THRESHOLD_SECONDS = 3;
const REDUCE_MOTION_TIMER_DURATION = 1; // instant for reduced motion

export interface BattleQuestionCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onTimeout: () => void;
}

function FeedbackIcon({ type }: { type: 'correct' | 'wrong' }) {
  const stroke = Colors.text.primaryDark;

  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      {type === 'correct' ? (
        <Path
          d="M3.75 9.5L7.25 13L14.25 5.5"
          stroke={stroke}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <Path
            d="M5 5L13 13"
            stroke={stroke}
            strokeWidth={2.25}
            strokeLinecap="round"
          />
          <Path
            d="M13 5L5 13"
            stroke={stroke}
            strokeWidth={2.25}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}

export function BattleQuestionCard({
  question,
  options,
  correctIndex,
  onAnswer,
  onTimeout,
}: BattleQuestionCardProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);
  const progress = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const lockRef = useRef(false);
  const onAnswerRef = useRef(onAnswer);
  const onTimeoutRef = useRef(onTimeout);

  const [remainingMs, setRemainingMs] = useState(QUESTION_DURATION_MS);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const optionsKey = JSON.stringify(options);
  const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
  const isCritical = secondsLeft <= CRITICAL_THRESHOLD_SECONDS;
  const progressColor = isCritical ? Colors.status.error : Colors.status.warning;

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (isMounted) setReduceMotionEnabled(v); })
      .catch(() => { if (isMounted) setReduceMotionEnabled(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      cancelAnimation(progress);
    };
  }, [progress]);

  useEffect(() => {
    lockRef.current = false;
    setSelectedIndex(null);
    setHasTimedOut(false);
    setRemainingMs(QUESTION_DURATION_MS);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    cancelAnimation(progress);
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: reduceMotionEnabled ? REDUCE_MOTION_TIMER_DURATION : QUESTION_DURATION_MS,
    });

    const startedAt = Date.now();

    intervalRef.current = setInterval(() => {
      const nextRemainingMs = Math.max(0, QUESTION_DURATION_MS - (Date.now() - startedAt));

      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs > 0) {
        return;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (lockRef.current) {
        return;
      }

      lockRef.current = true;
      setHasTimedOut(true);
      cancelAnimation(progress);
      progress.value = 0;

      const timeoutId = setTimeout(() => {
        onTimeoutRef.current();
      }, TIMEOUT_DELAY_MS);

      timeoutsRef.current.push(timeoutId);
    }, TIMER_TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      cancelAnimation(progress);
    };
  }, [correctIndex, optionsKey, progress, question, reduceMotionEnabled]);

  const handleSelect = (index: number) => {
    if (lockRef.current || hasTimedOut) {
      return;
    }

    lockRef.current = true;
    setSelectedIndex(index);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    cancelAnimation(progress);

    const isCorrect = index === correctIndex;

    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => undefined);

    const timeoutId = setTimeout(() => {
      onAnswerRef.current(index, isCorrect);
    }, ANSWER_DELAY_MS);

    timeoutsRef.current.push(timeoutId);
  };

  return (
    <WKCard style={styles.card}>
      <View style={styles.topSection}>
        <WKText
          variant="timer"
          color={isCritical ? Colors.status.error : Colors.text.primaryDark}
          style={styles.timerText}
        >
          {secondsLeft}
        </WKText>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: progressColor },
              progressStyle,
            ]}
          />
        </View>
      </View>

      <View style={styles.middleSection}>
        <WKText variant="heading2" color={Colors.text.primaryDark} style={styles.questionText}>
          {question}
        </WKText>
      </View>

      <View style={styles.optionsList}>
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectSelection = isSelected && index === correctIndex;
          const isWrongSelection = isSelected && index !== correctIndex;
          const isDimmed = hasTimedOut || (selectedIndex !== null && !isSelected);

          return (
            <TouchableOpacity
              key={`${index}-${option}`}
              accessibilityRole="button"
              activeOpacity={0.88}
              disabled={lockRef.current || hasTimedOut}
              onPress={() => handleSelect(index)}
              style={[
                styles.optionButton,
                isCorrectSelection && styles.correctOption,
                isWrongSelection && styles.wrongOption,
                isDimmed && styles.dimmedOption,
              ]}
            >
              <WKText variant="body" color={Colors.text.primaryDark} style={styles.optionText}>
                {option}
              </WKText>

              {isCorrectSelection ? <FeedbackIcon type="correct" /> : null}
              {isWrongSelection ? <FeedbackIcon type="wrong" /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </WKCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: Spacing.s20,
    backgroundColor: Colors.bg.secondary,
    ...Shadows.level2,
  },
  topSection: {
    gap: Spacing.s12,
  },
  timerText: {
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: Radius.card,
    backgroundColor: Colors.bg.cardDark,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.card,
  },
  middleSection: {
    marginVertical: Spacing.s24,
  },
  questionText: {
    textAlign: 'center',
  },
  optionsList: {
    gap: Spacing.s12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    borderRadius: Radius.card,
    backgroundColor: Colors.bg.cardDark,
    ...Shadows.level1,
  },
  optionText: {
    flex: 1,
    paddingRight: Spacing.s12,
  },
  correctOption: {
    backgroundColor: Colors.status.success,
  },
  wrongOption: {
    backgroundColor: Colors.status.error,
  },
  dimmedOption: {
    opacity: 0.4,
  },
});
