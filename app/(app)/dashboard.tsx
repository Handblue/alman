import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { DailyGoalCard } from '@/components/dashboard/DailyGoalCard';
import { RecentUnitCard } from '@/components/dashboard/RecentUnitCard';
import { UNITS } from '@/data/units';
import { useUserStore } from '@/store/useUserStore';

export default function DashboardScreen() {
  const { xp, streak } = useUserStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <WKText variant="hero">WortKrieg</WKText>
            <WKText variant="bodySm" color={Colors.text.secondary}>
              Bugün ne öğreniyoruz?
            </WKText>
          </View>
          <View style={styles.stats}>
            <WKText variant="body">🔥 {streak}</WKText>
            <WKText variant="body" color={Colors.accent.orange}>
              {xp} XP
            </WKText>
          </View>
        </View>

        <DailyGoalCard />

        <WKText variant="heading2" style={{ marginBottom: Spacing.s12 }}>
          Son Çalışılan
        </WKText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Spacing.s24 }}
          contentContainerStyle={{ paddingRight: Spacing.s20 }}
        >
          {UNITS.filter((u) => u.wordCount > 0).map((unit) => (
            <RecentUnitCard key={unit.id} unit={unit} />
          ))}
        </ScrollView>

        <WKButton
          label="Tüm Kategoriler"
          variant="secondary"
          onPress={() => router.push('/(app)/categories')}
          style={{ marginBottom: Spacing.s24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
    paddingHorizontal: Spacing.s20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.s24,
  },
  stats: { alignItems: 'flex-end', gap: Spacing.s4 },
});
