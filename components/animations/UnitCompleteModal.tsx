import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  AccessibilityInfo,
  Modal,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import ConfettiOverlay from '@/components/animations/ConfettiOverlay';
import XPAnimatedCounter from '@/components/animations/XPAnimatedCounter';
import { WKButton } from '@/components/ui/WKButton';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

const AUTO_CONTINUE_DELAY_MS = 8_000;
const TROPHY_SIZE = 80;
const TROPHY_RADIUS = TROPHY_SIZE / 2;
const COUNTDOWN_HEIGHT = 2;

function withAlpha(hexColor: string, opacity: number) {
  const normalized = hexColor.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export interface UnitCompleteModalProps {
  visible: boolean;
  unitName: string;
  xpEarned: number;
  onContinue: () => void;
}

export function UnitCompleteModal({
  visible,
  unitName,
  xpEarned,
  onContinue,
}: UnitCompleteModalProps): ReactElement {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState<boolean | null>(null);
  const [shouldShowCountdown, setShouldShowCountdown] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);

  const autoContinueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasContinuedRef = useRef(false);

  const trophyScale = useSharedValue(0);
  const countdownProgress = useSharedValue(1);

  const clearAutoContinueTimeout = useCallback(() => {
    if (autoContinueTimeoutRef.current !== null) {
      clearTimeout(autoContinueTimeoutRef.current);
      autoContinueTimeoutRef.current = null;
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (hasContinuedRef.current) {
      return;
    }

    hasContinuedRef.current = true;
    setShouldShowCountdown(false);
    clearAutoContinueTimeout();
    countdownProgress.value = 0;
    onContinue();
  }, [clearAutoContinueTimeout, countdownProgress, onContinue]);

  const handleButtonLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setButtonWidth((currentWidth) => (
      currentWidth === nextWidth ? currentWidth : nextWidth
    ));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReduceMotionPreference = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();

        if (isMounted) {
          setIsReduceMotionEnabled(isEnabled);
        }
      } catch {
        if (isMounted) {
          setIsReduceMotionEnabled(false);
        }
      }
    };

    void loadReduceMotionPreference();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled,
    );

    return () => {
      isMounted = false;
      subscription.remove();
      clearAutoContinueTimeout();
    };
  }, [clearAutoContinueTimeout]);

  useEffect(() => {
    if (!visible) {
      hasContinuedRef.current = false;
      setShouldShowCountdown(false);
      countdownProgress.value = 1;
      trophyScale.value = 0;
      clearAutoContinueTimeout();
      return;
    }

    hasContinuedRef.current = false;
    setShouldShowCountdown(true);
    countdownProgress.value = 1;
    countdownProgress.value = withTiming(0, { duration: AUTO_CONTINUE_DELAY_MS });

    clearAutoContinueTimeout();
    autoContinueTimeoutRef.current = setTimeout(() => {
      handleContinue();
    }, AUTO_CONTINUE_DELAY_MS);

    return () => {
      clearAutoContinueTimeout();
    };
  }, [clearAutoContinueTimeout, countdownProgress, handleContinue, trophyScale, visible]);

  useEffect(() => {
    if (!visible || isReduceMotionEnabled === null) {
      return;
    }

    if (isReduceMotionEnabled) {
      trophyScale.value = 1;
      return;
    }

    trophyScale.value = 0;
    trophyScale.value = withDelay(
      100,
      withSpring(1, {
        damping: 10,
        stiffness: 120,
      }),
    );
  }, [isReduceMotionEnabled, trophyScale, visible]);

  const trophyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    width: buttonWidth * countdownProgress.value,
    opacity: countdownProgress.value,
  }));

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleContinue}
    >
      <View style={styles.backdrop}>
        <ConfettiOverlay visible={visible} />

        <LinearGradient
          colors={Colors.gradient.quizResult}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Animated.View style={[styles.trophyCircle, trophyAnimatedStyle]}>
            <WKText
              variant="hero"
              color={Colors.text.primaryDark}
              style={styles.trophyEmoji}
            >
              {'🏆'}
            </WKText>
          </Animated.View>

          <WKText
            variant="heading1"
            color={Colors.text.primaryDark}
            style={styles.title}
          >
            Ünite Tamamlandı!
          </WKText>

          <WKText
            variant="body"
            color={Colors.text.secondary}
            style={styles.unitName}
          >
            {unitName}
          </WKText>

          <XPAnimatedCounter
            from={0}
            to={xpEarned}
            style={styles.xpCounter}
          />

          <View style={styles.buttonWrapper} onLayout={handleButtonLayout}>
            {shouldShowCountdown ? (
              <View pointerEvents="none" style={styles.countdownTrack}>
                <Animated.View
                  style={[styles.countdownFill, countdownAnimatedStyle]}
                />
              </View>
            ) : null}

            <WKButton
              label="Devam Et"
              variant="primary"
              style={styles.button}
              onPress={handleContinue}
            />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha(Colors.bg.primaryDark, 0.6),
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s24,
  },
  card: {
    width: '85%',
    alignItems: 'center',
    borderRadius: Radius.modal,
    padding: Spacing.s32,
    ...Shadows.level4,
  },
  trophyCircle: {
    width: TROPHY_SIZE,
    height: TROPHY_SIZE,
    borderRadius: TROPHY_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.2),
  },
  trophyEmoji: {
    fontFamily: Typography.hero.fontFamily,
    fontSize: Typography.hero.fontSize,
    lineHeight: Typography.hero.fontSize + Spacing.s8,
    textAlign: 'center',
  },
  title: {
    marginTop: Spacing.s16,
    textAlign: 'center',
  },
  unitName: {
    marginTop: Spacing.s8,
    textAlign: 'center',
  },
  xpCounter: {
    marginTop: Spacing.s16,
  },
  buttonWrapper: {
    alignSelf: 'stretch',
    marginTop: Spacing.s32,
    borderRadius: Radius.button,
    overflow: 'hidden',
    backgroundColor: withAlpha(Colors.bg.cardDark, 0.14),
  },
  button: {
    alignSelf: 'stretch',
  },
  countdownTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: COUNTDOWN_HEIGHT,
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.16),
    zIndex: 1,
  },
  countdownFill: {
    height: COUNTDOWN_HEIGHT,
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.8),
  },
});

export default UnitCompleteModal;
