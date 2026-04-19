import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { WKCard, WKText, WKChip } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Unit } from '@/data/units';
import { useProgressStore } from '@/store/useProgressStore';

export function RecentUnitCard({ unit }: { unit: Unit }) {
  const progress = useProgressStore((s) => s.unitProgress[unit.id]);
  const modesCompleted = progress?.completedModes.length ?? 0;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${unit.title} ünitesi, ${modesCompleted} mod tamamlandı`}
      onPress={() =>
        router.push({ pathname: '/(app)/unit/[id]', params: { id: unit.id } })
      }
      style={styles.wrapper}
    >
      <WKCard style={styles.card}>
        <WKText variant="heading2">{unit.title}</WKText>
        <WKText variant="bodySm" color={Colors.text.secondary}>
          {unit.wordCount} kelime
        </WKText>
        <View style={styles.row}>
          <WKChip
            label={`${modesCompleted}/5 mod`}
            color={Colors.brand.primary + '20'}
            textColor={Colors.brand.primary}
          />
          {progress?.isCompleted && (
            <WKChip
              label="✓ Tamamlandı"
              color={Colors.status.success + '20'}
              textColor={Colors.status.success}
            />
          )}
        </View>
      </WKCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginRight: Spacing.s12 },
  card: { width: 200 },
  row: {
    flexDirection: 'row',
    gap: Spacing.s8,
    marginTop: Spacing.s12,
    flexWrap: 'wrap',
  },
});
