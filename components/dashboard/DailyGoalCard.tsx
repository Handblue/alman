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
        <WKText variant="heading2">Günlük Hedef</WKText>
        <WKText variant="body" color={Colors.accent.orange}>
          🔥 {todayXP} / {DAILY_GOAL_XP} XP
        </WKText>
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
  card: { marginBottom: Spacing.s16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.s12,
  },
  barBg: {
    height: 8,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 4,
  },
  barFill: {
    height: 8,
    backgroundColor: Colors.brand.primary,
    borderRadius: 4,
  },
});
