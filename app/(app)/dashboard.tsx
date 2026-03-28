import { useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKText, WKButton, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { DailyGoalCard } from '@/components/dashboard/DailyGoalCard';
import { DailyChallengeCard } from '@/components/dashboard/DailyChallengeCard';
import { RecentUnitCard } from '@/components/dashboard/RecentUnitCard';
import { UNITS } from '@/data/units';
import { useUserStore } from '@/store/useUserStore';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';

export default function DashboardScreen() {
  const { xp, streak, level } = useUserStore();
  const initToday = useDailyChallengeStore((s) => s.initToday);
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak);

  useEffect(() => {
    initToday();
    checkAndUpdateStreak();
  }, []);

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
            <View style={styles.levelBadge}>
              <WKText variant="caption" color={Colors.accent.gold}>
                Seviye {level}
              </WKText>
            </View>
            <WKText variant="body">🔥 {streak}</WKText>
            <WKText variant="body" color={Colors.accent.orange}>
              {xp} XP
            </WKText>
          </View>
        </View>

        <DailyChallengeCard />

        <DailyGoalCard />

        <TouchableOpacity
          onPress={() => router.push('/(app)/leaderboard')}
          accessibilityRole="button"
          accessibilityLabel="Sıralama ekranına git"
          style={styles.leaderboardButton}
          activeOpacity={0.8}
        >
          <WKCard style={styles.leaderboardCard}>
            <WKText variant="heading2">🏆 Sıralama</WKText>
            <WKText variant="bodySm" color={Colors.text.secondary}>
              Haftanın en iyileri →
            </WKText>
          </WKCard>
        </TouchableOpacity>

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
  levelBadge: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderWidth: 1,
    borderColor: Colors.accent.gold,
  },
  leaderboardButton: {
    marginBottom: Spacing.s16,
  },
  leaderboardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
