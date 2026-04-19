import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';

export function DailyChallengeCard() {
  const todayChallenge = useDailyChallengeStore((s) => s.todayChallenge);
  const isCompleted = todayChallenge?.completed ?? false;
  const correctCount = todayChallenge?.correctCount ?? 0;
  const xpEarned = todayChallenge?.xpEarned ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/daily-challenge')}
      accessibilityRole="button"
      accessibilityLabel="Günlük Meydan Okuma"
      style={styles.touchable}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={Colors.gradient.dailyChallenge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <WKText variant="heading2" color={Colors.text.primaryDark}>
            Günlük Meydan Okuma 🎯
          </WKText>
          {isCompleted && (
            <View style={styles.badge}>
              <WKText variant="caption" color={Colors.text.primaryDark}>
                ✅ TAMAM
              </WKText>
            </View>
          )}
        </View>

        {isCompleted ? (
          <View style={styles.completedRow}>
            <WKText variant="body" color={Colors.text.primaryDark}>
              Skor: {correctCount}/5 doğru
            </WKText>
            <WKText variant="body" color={Colors.accent.gold}>
              +{xpEarned} XP kazandın!
            </WKText>
          </View>
        ) : (
          <>
            <WKText variant="bodySm" color={Colors.text.primaryDark} style={styles.subtitle}>
              Bugünün soruları seni bekliyor!
            </WKText>
            <View style={styles.buttonRow}>
              <WKButton
                label="Başla"
                variant="ghost"
                onPress={() => router.push('/(app)/daily-challenge')}
                style={styles.button}
              />
            </View>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: Spacing.s16,
    borderRadius: Radius.card,
  },
  gradient: {
    borderRadius: Radius.card,
    padding: Spacing.s16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s8,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
  },
  subtitle: {
    marginBottom: Spacing.s12,
    opacity: 0.9,
  },
  completedRow: {
    gap: Spacing.s4,
  },
  buttonRow: {
    alignItems: 'flex-start',
  },
  button: {
    minHeight: 44,
  },
});
