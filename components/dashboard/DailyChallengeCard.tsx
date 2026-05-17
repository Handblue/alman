import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';

export function DailyChallengeCard() {
  const todayChallenge = useDailyChallengeStore((s) => s.todayChallenge);
  const isCompleted  = todayChallenge?.completed ?? false;
  const correctCount = todayChallenge?.correctCount ?? 3;
  const xpEarned     = todayChallenge?.xpEarned ?? 0;
  const total = 10;

  const progress = Math.min(correctCount / total, 1);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/daily-challenge')}
      accessibilityRole="button"
      accessibilityLabel="Günlük Meydan Okuma"
      activeOpacity={0.85}
      style={styles.card}
    >
      {/* Dark mint background */}
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View>
            <WKText style={styles.label}>GÜNLÜK GÖREV</WKText>
            <WKText style={styles.title}>
              {isCompleted ? 'Tamamlandı! 🎉' : 'B1 Kelime Savaşı'}
            </WKText>
            <WKText style={styles.sub}>
              {isCompleted
                ? `Skor: ${correctCount}/${total} · +${xpEarned} XP`
                : '⏱ 3:42 kaldı · +50 XP'}
            </WKText>
          </View>
          <View style={styles.badge}>
            <WKText style={styles.badgeText}>{isCompleted ? '✅' : 'YENİ'}</WKText>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={styles.barBg}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: correctCount }}
        >
          <View style={[styles.barFill, { width: `${progress * 100}%` as `${number}%` }]} />
        </View>
        <WKText style={styles.progressLabel}>{correctCount} / {total} tamamlandı</WKText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.s12, borderRadius: Radius.card + 8 },
  inner: {
    backgroundColor: Colors.accent.mintDark,
    borderRadius: Radius.card + 8,
    padding: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.accent.mint,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
    lineHeight: 24,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(191,239,216,0.2)',
    borderRadius: Radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.accent.mint,
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: Colors.accent.mint,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: -8,
  },
});
