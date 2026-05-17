import { View, StyleSheet } from 'react-native';
import { WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useUserStore } from '@/store/useUserStore';

const DAILY_GOAL_XP = 100;

export function DailyGoalCard() {
  const xp = useUserStore((s) => s.xp);
  const todayXP = xp % DAILY_GOAL_XP;
  const progress = Math.min(todayXP / DAILY_GOAL_XP, 1);

  return (
    <WKCard style={styles.card}>
      <View style={styles.row}>
        <WKText style={styles.title}>Günlük Hedef</WKText>
        <WKText style={styles.xp}>🔥 {todayXP} / {DAILY_GOAL_XP} XP</WKText>
      </View>
      <View
        style={styles.barBg}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: DAILY_GOAL_XP, now: todayXP }}
      >
        <View style={[styles.barFill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>
    </WKCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.s12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s12,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
  xp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.accent.orange,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.border.primary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: Colors.brand.violet,
    borderRadius: 3,
  },
});
