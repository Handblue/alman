import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  ImageStyle,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface PlayerInfo {
  username: string;
  avatarUrl?: string;
  elo: number;
}

interface BattleVSScreenProps {
  player: PlayerInfo;
  opponent: PlayerInfo;
  onCountdownEnd: () => void;
}

const COUNTDOWN_VALUES = [3, 2, 1] as const;
const AVATAR_SIZE = 64;
const CENTER_BADGE_SIZE = 80;

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

function getInitial(username: string) {
  const trimmed = username.trim();
  return (trimmed.charAt(0) || '?').toLocaleUpperCase();
}

interface PlayerPanelProps {
  align: 'left' | 'right';
  player: PlayerInfo;
}

function PlayerPanel({ align, player }: PlayerPanelProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(player.avatarUrl) && !imageFailed;
  const isLeft = align === 'left';

  return (
    <View style={[styles.side, isLeft ? styles.leftSide : styles.rightSide]}>
      <View
        accessibilityRole="none"
        style={[
          styles.sideGlow,
          isLeft ? styles.leftGlow : styles.rightGlow,
        ]}
      />

      <View
        style={[
          styles.playerContent,
          isLeft ? styles.leftContent : styles.rightContent,
        ]}
      >
        <View style={styles.avatarShell}>
          <View style={styles.avatar}>
            {showImage ? (
              <Image
                source={{ uri: player.avatarUrl }}
                style={styles.avatarImage}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <WKText
                variant="heading1"
                color={Colors.text.primaryDark}
                style={styles.avatarPlaceholder}
              >
                {getInitial(player.username)}
              </WKText>
            )}
          </View>
        </View>

        <WKText
          variant="heading1"
          color={Colors.text.primaryDark}
          numberOfLines={1}
          style={styles.username}
        >
          {player.username}
        </WKText>

        <WKText
          variant="bodySm"
          color={Colors.text.secondary}
          style={styles.elo}
        >
          ELO {player.elo}
        </WKText>
      </View>
    </View>
  );
}

export default function BattleVSScreen({
  player,
  opponent,
  onCountdownEnd,
}: BattleVSScreenProps) {
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean | null>(null);

  const countdownOpacity = useSharedValue(0);
  const countdownScale = useSharedValue(1.5);

  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasEndedRef = useRef(false);

  const announcement = useMemo(
    () => `Battle başlıyor, ${player.username} vs ${opponent.username}`,
    [opponent.username, player.username]
  );

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((timer) => clearTimeout(timer));
    countdownTimersRef.current = [];
  }, []);

  const finishCountdown = useCallback(() => {
    if (hasEndedRef.current) return;

    hasEndedRef.current = true;
    onCountdownEnd();
  }, [onCountdownEnd]);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.announceForAccessibility(announcement);

    const initializeCountdown = async () => {
      let shouldReduceMotion = false;

      try {
        shouldReduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        shouldReduceMotion = false;
      }

      if (!isMounted) return;

      setReduceMotionEnabled(shouldReduceMotion);

      if (shouldReduceMotion) {
        setCountdownValue(null);
        countdownTimersRef.current.push(setTimeout(finishCountdown, 3000));
        return;
      }

      COUNTDOWN_VALUES.forEach((value, index) => {
        countdownTimersRef.current.push(
          setTimeout(() => {
            setCountdownValue(value);
          }, index * 1000)
        );
      });

      countdownTimersRef.current.push(
        setTimeout(() => {
          setCountdownValue(null);
          finishCountdown();
        }, COUNTDOWN_VALUES.length * 1000)
      );
    };

    void initializeCountdown();

    return () => {
      isMounted = false;
      clearCountdownTimers();
    };
  }, [announcement, clearCountdownTimers, finishCountdown]);

  useEffect(() => {
    if (reduceMotionEnabled || countdownValue === null) return;

    countdownScale.value = 1.5;
    countdownOpacity.value = 0;

    countdownScale.value = withSpring(1, {
      damping: 14,
      stiffness: 220,
      mass: 0.8,
    });
    countdownOpacity.value = withTiming(1, { duration: 180 });

    const fadeOutTimer = setTimeout(() => {
      countdownOpacity.value = withTiming(0, { duration: 300 });
    }, 700);

    return () => clearTimeout(fadeOutTimer);
  }, [countdownOpacity, countdownScale, countdownValue, reduceMotionEnabled]);

  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: countdownOpacity.value,
    transform: [{ scale: countdownScale.value }],
  }));

  return (
    <LinearGradient
      colors={[Colors.gradient.battle[0], Colors.gradient.battle[1]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View accessibilityRole="none" style={styles.backdrop}>
        <View accessibilityRole="none" style={[styles.backdropOrb, styles.backdropOrbTop]} />
        <View accessibilityRole="none" style={[styles.backdropOrb, styles.backdropOrbBottom]} />
      </View>

      <View style={styles.splitLayout}>
        <PlayerPanel align="left" player={player} />
        <PlayerPanel align="right" player={opponent} />
      </View>

      <View accessibilityRole="none" pointerEvents="none" style={styles.centerOverlay}>
        <View accessibilityRole="none" style={styles.centerBadge}>
          <WKText
            color={Colors.text.primaryDark}
            style={styles.vsText}
          >
            VS
          </WKText>
          <WKText
            color={Colors.text.primaryDark}
            style={styles.boltText}
          >
            ⚡
          </WKText>
        </View>
      </View>

      {!reduceMotionEnabled && countdownValue !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.countdownOverlay, countdownAnimatedStyle]}
        >
          <WKText color={Colors.text.primaryDark} style={styles.countdownText}>
            {countdownValue}
          </WKText>
        </Animated.View>
      ) : null}
    </LinearGradient>
  );
}

type NamedStyles = {
  avatar: ViewStyle;
  avatarImage: ImageStyle;
  avatarPlaceholder: TextStyle;
  avatarShell: ViewStyle;
  backdrop: ViewStyle;
  backdropOrb: ViewStyle;
  backdropOrbBottom: ViewStyle;
  backdropOrbTop: ViewStyle;
  boltText: TextStyle;
  centerBadge: ViewStyle;
  centerOverlay: ViewStyle;
  container: ViewStyle;
  countdownOverlay: ViewStyle;
  countdownText: TextStyle;
  elo: TextStyle;
  leftContent: ViewStyle;
  leftGlow: ViewStyle;
  leftSide: ViewStyle;
  playerContent: ViewStyle;
  rightContent: ViewStyle;
  rightGlow: ViewStyle;
  rightSide: ViewStyle;
  side: ViewStyle;
  sideGlow: ViewStyle;
  splitLayout: ViewStyle;
  username: TextStyle;
  vsText: TextStyle;
};

const styles = StyleSheet.create<NamedStyles>({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.08),
  },
  backdropOrbTop: {
    width: 240,
    height: 240,
    top: -40,
    left: -60,
  },
  backdropOrbBottom: {
    width: 280,
    height: 280,
    right: -100,
    bottom: -60,
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  side: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leftSide: {
    alignItems: 'flex-start',
    backgroundColor: withAlpha(Colors.bg.secondary, 0.22),
    paddingRight: CENTER_BADGE_SIZE / 2 + Spacing.s20,
  },
  rightSide: {
    alignItems: 'flex-end',
    backgroundColor: withAlpha(Colors.bg.secondary, 0.12),
    paddingLeft: CENTER_BADGE_SIZE / 2 + Spacing.s20,
  },
  sideGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.06),
  },
  leftGlow: {
    left: -60,
    top: 96,
  },
  rightGlow: {
    right: -60,
    bottom: 96,
  },
  playerContent: {
    width: '100%',
    paddingHorizontal: Spacing.s24,
    alignItems: 'center',
  },
  leftContent: {
    paddingLeft: Spacing.s24,
  },
  rightContent: {
    paddingRight: Spacing.s24,
  },
  avatarShell: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: withAlpha(Colors.text.primaryDark, 0.4),
    backgroundColor: withAlpha(Colors.bg.secondary, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s16,
    overflow: 'hidden',
    ...Shadows.level2,
  },
  avatar: {
    width: AVATAR_SIZE - 6,
    height: AVATAR_SIZE - 6,
    borderRadius: (AVATAR_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.12),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    textAlign: 'center',
  },
  username: {
    textAlign: 'center',
    marginBottom: Spacing.s8,
  },
  elo: {
    textAlign: 'center',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    width: CENTER_BADGE_SIZE,
    height: CENTER_BADGE_SIZE,
    borderRadius: CENTER_BADGE_SIZE / 2,
    backgroundColor: withAlpha(Colors.text.primaryDark, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  vsText: {
    ...Typography.hero,
    lineHeight: 38,
    textAlign: 'center',
  },
  boltText: {
    fontFamily: Typography.hero.fontFamily,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -Spacing.s8,
    textAlign: 'center',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontFamily: Typography.hero.fontFamily,
    fontSize: 80,
    lineHeight: 88,
    textAlign: 'center',
  },
});
