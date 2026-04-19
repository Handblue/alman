import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { PronunciationStarRating } from '@/components/pronunciation/PronunciationStarRating';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';

type PronunciationScore = 1 | 2 | 3 | 4 | 5;
type RecorderState = 'idle' | 'recording' | 'processing' | 'result';
type CountdownValue = 1 | 2 | 3;

const RECORDING_DURATION_SECONDS = 3;

interface PronunciationRecorderProps {
  isPremium: boolean;
  onRecord: () => Promise<PronunciationScore>;
  onResult: (score: PronunciationScore) => void;
  onPremiumPress: () => void;
}

export function PronunciationRecorder({
  isPremium,
  onRecord,
  onResult,
  onPremiumPress,
}: PronunciationRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [countdown, setCountdown] = useState<CountdownValue>(RECORDING_DURATION_SECONDS);
  const [pronScore, setPronScore] = useState<PronunciationScore | null>(null);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(RECORDING_DURATION_SECONDS);
  const isMountedRef = useRef(true);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMountedRef.current) {
          setReducedMotionEnabled(enabled);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
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
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (state === 'recording' && !reducedMotionEnabled) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500 }),
          withTiming(1.0, { duration: 500 }),
        ),
        -1,
        true,
      );
      return;
    }

    pulseScale.value = withTiming(1, { duration: 150 });
  }, [pulseScale, reducedMotionEnabled, state]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const clearCountdownInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetToIdle = () => {
    clearCountdownInterval();
    countdownRef.current = RECORDING_DURATION_SECONDS;
    setCountdown(RECORDING_DURATION_SECONDS);
    setPronScore(null);
    setState('idle');
  };

  const finishRecording = async () => {
    if (!isMountedRef.current) {
      return;
    }

    setState('processing');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    try {
      const score = await onRecord();

      if (!isMountedRef.current) {
        return;
      }

      setPronScore(score);
      setState('result');
      onResult(score);
    } catch {
      if (!isMountedRef.current) {
        return;
      }

      resetToIdle();
    }
  };

  const startCountdown = () => {
    countdownRef.current = RECORDING_DURATION_SECONDS;
    setCountdown(RECORDING_DURATION_SECONDS);
    setState('recording');

    intervalRef.current = setInterval(() => {
      countdownRef.current -= 1;

      if (countdownRef.current > 0) {
        setCountdown(countdownRef.current as CountdownValue);
        return;
      }

      clearCountdownInterval();
      void finishRecording();
    }, 1000);
  };

  const handleMainPress = async () => {
    if (state !== 'idle') {
      return;
    }

    if (!isPremium) {
      onPremiumPress();
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    startCountdown();
  };

  const accessibilityLabel =
    state === 'recording'
      ? `Kaydediliyor, ${countdown} saniye kaldı`
      : state === 'processing'
        ? 'Değerlendiriliyor'
        : 'Telaffuz kaydı başlat';

  return (
    <View style={styles.container}>
      {state === 'recording' ? (
        <WKText
          variant="heading2"
          color={Colors.text.primaryDark}
          style={styles.countdownText}
        >
          {countdown}
        </WKText>
      ) : (
        <View style={styles.countdownSpacer} />
      )}

      {state === 'result' && pronScore ? (
        <View style={styles.resultContainer}>
          <PronunciationStarRating animate score={pronScore} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tekrar Dene"
            activeOpacity={0.8}
            onPress={resetToIdle}
            style={styles.retryButton}
          >
            <WKText variant="caption" color={Colors.brand.primary}>
              Tekrar Dene
            </WKText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="button"
              activeOpacity={0.85}
              disabled={state !== 'idle'}
              onPress={() => {
                void handleMainPress();
              }}
              style={[
                styles.mainButton,
                state === 'recording' && styles.recordingButton,
                state === 'processing' && styles.processingButton,
                state === 'idle' && !isPremium && styles.lockedButton,
              ]}
            >
              {state === 'processing' ? (
                <ActivityIndicator color={Colors.text.primaryDark} size="small" />
              ) : (
                <WKText
                  accessibilityElementsHidden
                  color={Colors.text.primaryDark}
                  importantForAccessibility="no"
                  style={[
                    styles.microphoneIcon,
                    state === 'idle' && !isPremium && styles.lockedMicrophoneIcon,
                  ]}
                >
                  🎙️
                </WKText>
              )}
            </TouchableOpacity>
          </Animated.View>

          {state === 'processing' ? (
            <WKText
              variant="bodySm"
              color={Colors.text.secondary}
              style={styles.processingText}
            >
              Değerlendiriliyor...
            </WKText>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
  },
  countdownSpacer: {
    height: 0,
  },
  countdownText: {
    marginBottom: Spacing.s4,
  },
  resultContainer: {
    alignItems: 'center',
    gap: Spacing.s8,
  },
  mainButton: {
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: Spacing.s32,
    height: Spacing.s64,
    justifyContent: 'center',
    width: Spacing.s64,
    ...Shadows.level2,
  },
  lockedButton: {
    backgroundColor: Colors.bg.cardDark,
  },
  recordingButton: {
    backgroundColor: Colors.status.error,
  },
  processingButton: {
    backgroundColor: Colors.brand.dark,
  },
  microphoneIcon: {
    fontSize: 28,
    lineHeight: 32,
  },
  lockedMicrophoneIcon: {
    opacity: 0.4,
  },
  processingText: {
    marginTop: Spacing.s8,
  },
  retryButton: {
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
  },
});

export type { PronunciationRecorderProps };
