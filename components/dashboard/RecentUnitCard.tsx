import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Unit } from '@/data/units';
import { useProgressStore } from '@/store/useProgressStore';

const CARD_COLORS = [
  Colors.accent.sky,
  Colors.accent.mint,
  Colors.brand.violetSoft,
  Colors.accent.butter,
  Colors.accent.peach,
  Colors.accent.blush,
];

export function RecentUnitCard({ unit, index = 0 }: { unit: Unit; index?: number }) {
  const progress = useProgressStore((s) => s.unitProgress[unit.id]);
  const modesCompleted = progress?.completedModes.length ?? 0;
  const pct = modesCompleted / 5;
  const accentColor = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${unit.title} ünitesi`}
      onPress={() => router.push({ pathname: '/(app)/unit/[id]', params: { id: unit.id } })}
      style={styles.wrapper}
      activeOpacity={0.82}
    >
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: accentColor }]} />
        <WKText style={styles.title} numberOfLines={1}>{unit.title}</WKText>
        <WKText style={styles.sub}>{unit.wordCount} kelime</WKText>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct * 100}%` as `${number}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginRight: Spacing.s10 },
  card: {
    width: 130,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 32, height: 32,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 8,
  },
  barBg: {
    height: 4,
    backgroundColor: Colors.border.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    backgroundColor: Colors.brand.violet,
    borderRadius: 2,
  },
});
