import React, { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { WKButton } from '@/components/ui/WKButton';
import { WKCard } from '@/components/ui/WKCard';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface BattleResultScreenProps {
  isWinner: boolean;
  xpEarned: number;
  eloChange: number;
  hasSpeakingBonus: boolean;
  onRematch: () => void;
  onHome: () => void;
}

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

export default function BattleResultScreen({
  isWinner,
  xpEarned,
  eloChange,
  hasSpeakingBonus,
  onRematch,
  onHome,
}: BattleResultScreenProps) {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);
  const [displayXp, setDisplayXp] = useState(0);

  const headerScale = useSharedValue(0.5);
  const animatedXpValue = useSharedValue(0);

  const roundedXp = useDerivedValue(() => Math.round(animatedXpValue.value));

  useAnimatedReaction(
    () => roundedXp.value,
    (value, previousValue) => {
      if (value !== previousValue) {
        runOnJS(setDisplayXp)(value);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadReduceMotion = async () => {
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

    void loadReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    headerScale.value = 0.5;
    animatedXpValue.value = 0;
    setDisplayXp(0);

    headerScale.value = withSpring(1, {
      duration: 500,
      dampingRatio: 0.72,
    });

    animatedXpValue.value = withTiming(xpEarned, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    return () => {
      cancelAnimation(headerScale);
      cancelAnimation(animatedXpValue);
    };
  }, [animatedXpValue, headerScale, xpEarned]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const eloPresentation = useMemo(() => {
    if (eloChange > 0) {
      return {
        icon: '↑',
        text: `+${eloChange}`,
        color: Colors.status.success,
      };
    }

    if (eloChange < 0) {
      return {
        icon: '↓',
        text: `${eloChange}`,
        color: Colors.status.error,
      };
    }

    return {
      icon: '',
      text: '=',
      color: Colors.text.secondary,
    };
  }, [eloChange]);

  const confettiColors = useMemo(
    () => [
      Colors.gradient.quizResult[0],
      Colors.brand.primary,
      Colors.accent.gold,
      Colors.status.success,
      Colors.accent.orange,
    ],
    [],
  );

  return (
    <LinearGradient
      colors={Colors.gradient.quizResult}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {isWinner && reduceMotionEnabled === false ? (
        <View pointerEvents="none" style={styles.confettiLayer}>
          <ConfettiCannon
            autoStart
            count={400}
            origin={{ x: -10, y: 0 }}
            colors={confettiColors}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={headerAnimatedStyle}>
          <WKText
            variant="hero"
            color={Colors.text.primaryDark}
            style={styles.resultHeader}
          >
            {isWinner ? 'Zafer! 🏆' : 'Yenildin 😤'}
          </WKText>
        </Animated.View>

        <WKCard style={styles.xpCard}>
          <WKText
            variant="bodySm"
            color={Colors.text.secondary}
            style={styles.sectionLabel}
          >
            Kazanılan XP
          </WKText>

          <Animated.Text style={styles.xpValue}>
            {displayXp} XP
          </Animated.Text>
        </WKCard>

        <View style={styles.eloRow}>
          <WKText
            variant="body"
            color={Colors.text.primaryDark}
          >
            ELO Değişimi
          </WKText>

          <View style={styles.eloValueRow}>
            {eloPresentation.icon ? (
              <WKText
                variant="bodySm"
                color={eloPresentation.color}
                style={styles.eloIcon}
              >
                {eloPresentation.icon}
              </WKText>
            ) : null}

            <WKText
              variant="heading2"
              color={eloPresentation.color}
            >
              {eloPresentation.text}
            </WKText>
          </View>
        </View>

        {hasSpeakingBonus ? (
          <View style={styles.speakingBanner}>
            <WKText
              variant="body"
              color={Colors.accent.gold}
              style={styles.speakingBannerText}
            >
              🎙️ +3 dk konuşma hakkı kazandın!
            </WKText>
          </View>
        ) : null}

        <View style={styles.buttonsRow}>
          <WKButton
            label="Tekrar Oyna"
            variant="primary"
            style={styles.primaryButton}
            onPress={onRematch}
          />

          <WKButton
            label="Ana Menü"
            variant="ghost"
            style={styles.secondaryButton}
            onPress={onHome}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

type Styles = {
  container: ViewStyle;
  confettiLayer: ViewStyle;
  content: ViewStyle;
  resultHeader: TextStyle;
  xpCard: ViewStyle;
  sectionLabel: TextStyle;
  xpValue: TextStyle;
  eloRow: ViewStyle;
  eloValueRow: ViewStyle;
  eloIcon: TextStyle;
  speakingBanner: ViewStyle;
  speakingBannerText: TextStyle;
  buttonsRow: ViewStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.s24,
    paddingTop: Spacing.s48,
    paddingBottom: Spacing.s32,
    gap: Spacing.s20,
  },
  resultHeader: {
    ...Typography.hero,
    textAlign: 'center',
  },
  xpCard: {
    backgroundColor: Colors.bg.cardDark,
    alignItems: 'center',
    padding: Spacing.s24,
    gap: Spacing.s8,
    ...Shadows.level4,
  },
  sectionLabel: {
    textAlign: 'center',
  },
  xpValue: {
    ...Typography.score,
    color: Colors.accent.orange,
    textAlign: 'center',
  },
  eloRow: {
    backgroundColor: withAlpha(Colors.bg.cardDark, 0.92),
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level2,
  },
  eloValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  eloIcon: {
    ...Typography.bodySm,
  },
  speakingBanner: {
    backgroundColor: withAlpha(Colors.accent.gold, 0.13),
    borderWidth: 1,
    borderColor: Colors.accent.gold,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s16,
    ...Shadows.level2,
  },
  speakingBannerText: {
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    width: '100%',
    marginTop: Spacing.s12,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: withAlpha(Colors.text.primaryDark, 0.28),
    backgroundColor: withAlpha(Colors.bg.cardDark, 0.24),
  },
});
