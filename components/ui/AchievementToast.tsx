import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WKText } from './WKText';
import { Colors } from '@/constants/colors';

export interface AchievementToastData {
  id: string;
  emoji: string;
  name: string;
  xpReward: number;
}

interface Props {
  toast: AchievementToastData | null;
  onDismiss: () => void;
}

const TOAST_DURATION_MS = 3500;

export function AchievementToast({ toast, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;

    // Haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    timerRef.current = setTimeout(() => dismiss(), TOAST_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast?.id]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!toast) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }], opacity }]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.card} onPress={dismiss}>
        <View style={styles.iconCircle}>
          <WKText style={styles.emoji}>{toast.emoji}</WKText>
        </View>
        <View style={styles.info}>
          <WKText style={styles.label}>🏅 Yeni Rozet Kazandın!</WKText>
          <WKText style={styles.name}>{toast.name}</WKText>
          {toast.xpReward > 0 && (
            <WKText style={styles.xp}>+{toast.xpReward} XP</WKText>
          )}
        </View>
        <WKText style={styles.dismiss}>✕</WKText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent.gold + '99',
    shadowColor: Colors.accent.gold,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.gold + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: Colors.accent.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  xp: {
    color: Colors.status.success,
    fontSize: 12,
    fontWeight: '700',
  },
  dismiss: {
    color: Colors.text.secondary,
    fontSize: 14,
    padding: 4,
  },
});
