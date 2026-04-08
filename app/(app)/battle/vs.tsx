import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useBattleStore } from '@/store/useBattleStore';
import { battleService } from '@/services/battleService';

const COUNTDOWN_FROM = 3;

export default function BattleVsScreen() {
  const router = useRouter();
  const { battle, battleId, myUid, me, opponent } = useBattleStore();
  const [count, setCount] = useState(COUNTDOWN_FROM);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animate VS cards in
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Countdown then start first question
  useEffect(() => {
    if (count <= 0) {
      // The creator (player1) drives question advancement
      if (battle && myUid === battle.player1.uid && battleId) {
        battleService.startQuestion(battleId, 0);
      }
      router.replace('/battle/question');
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  // Also watch for status changes (in case opponent navigates us)
  useEffect(() => {
    if (battle?.status === 'question') {
      router.replace('/battle/question');
    }
  }, [battle?.status]);

  return (
    <LinearGradient colors={Colors.gradient.battle as any} style={styles.container}>
      <WKText style={styles.vsLabel}>⚔️ SAVAŞ BAŞLIYOR</WKText>

      <Animated.View style={[styles.playersRow, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Player 1 */}
        <View style={styles.playerCard}>
          <WKText style={styles.playerEmoji}>🧑</WKText>
          <WKText style={styles.playerName} numberOfLines={1}>
            {me?.displayName ?? '—'}
          </WKText>
          <WKText style={styles.playerElo}>ELO {me?.elo ?? 1200}</WKText>
        </View>

        <WKText style={styles.vs}>VS</WKText>

        {/* Player 2 */}
        <View style={[styles.playerCard, styles.opponentCard]}>
          <WKText style={styles.playerEmoji}>{opponent?.isBot ? '🤖' : '👤'}</WKText>
          <WKText style={styles.playerName} numberOfLines={1}>
            {opponent?.displayName ?? '…'}
          </WKText>
          <WKText style={styles.playerElo}>ELO {opponent?.elo ?? 1200}</WKText>
        </View>
      </Animated.View>

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <Animated.Text style={styles.countdown}>
          {count > 0 ? count : '🚀'}
        </Animated.Text>
      </View>

      <WKText style={styles.hint}>5 soru • 12 saniye / soru • En hızlı doğru kazanır</WKText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 32,
  },
  vsLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 3,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playerCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  opponentCard: {
    borderColor: Colors.accent.orange,
  },
  playerEmoji: {
    fontSize: 40,
  },
  playerName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  playerElo: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  vs: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  countdownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  countdown: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
});
