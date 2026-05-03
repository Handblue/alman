import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/colors';
import { WKText } from '@/components/ui';

export default function Index() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(
          () => setDone(true),
        );
      }, 900);
    });
  }, []);

  if (done) {
    return <Redirect href={hasOnboarded ? '/(app)/dashboard' : '/(onboarding)/welcome'} />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { opacity, transform: [{ scale }] }]}>
        <WKText style={styles.sword}>⚔️</WKText>
        <WKText style={styles.title}>WortKrieg</WKText>
        <WKText style={styles.sub}>Almanca Savaş Alanı</WKText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    gap: 12,
  },
  sword: {
    fontSize: 64,
    lineHeight: 80,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 36,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
});
