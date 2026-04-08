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
import { WordOfTheDay } from '@/components/dashboard/WordOfTheDay';
import { AchievementToast } from '@/components/ui';
import { useAchievementCheck } from '@/hooks/useAchievementCheck';
import { UNITS } from '@/data/units';
import { useUserStore } from '@/store/useUserStore';
import { auth } from '@/firebase';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useAnalyticsStore, useTodayMetrics, useTopRecommendations } from '@/store/useAnalyticsStore';

export default function DashboardScreen() {
  const { xp, streak, level } = useUserStore();
  const initToday = useDailyChallengeStore((s) => s.initToday);
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak);
  const { friends, challenges, friendRequests } = useSocialStore();
  const { loadAnalyticsData, loadAIData } = useAnalyticsStore();
  const todayMetrics = useTodayMetrics();
  const topRecommendations = useTopRecommendations();
  const { currentToast, check, dismiss } = useAchievementCheck();

  useEffect(() => {
    initToday();
    checkAndUpdateStreak();

    // Load analytics data
    const userId = auth.currentUser?.uid;
    if (userId) {
      loadAnalyticsData(userId);
      loadAIData(userId);
    }

    // Check achievements on mount (streak, XP, etc.)
    check();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AchievementToast toast={currentToast} onDismiss={dismiss} />
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

        <WordOfTheDay />

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

        {/* Social Features */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/friends')}
            accessibilityRole="button"
            accessibilityLabel="Arkadaşlar ekranına git"
            style={[styles.socialButton, { flex: 1 }]}
            activeOpacity={0.8}
          >
            <WKCard style={styles.socialCard}>
              <WKText variant="heading2">👥</WKText>
              <WKText variant="body" color={Colors.text.primaryDark}>
                Arkadaşlar
              </WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                {friends.length} arkadaş
                {friendRequests.length > 0 && ` • ${friendRequests.length} istek`}
              </WKText>
            </WKCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(app)/challenges')}
            accessibilityRole="button"
            accessibilityLabel="Challenges ekranına git"
            style={[styles.socialButton, { flex: 1 }]}
            activeOpacity={0.8}
          >
            <WKCard style={styles.socialCard}>
              <WKText variant="heading2">🏆</WKText>
              <WKText variant="body" color={Colors.text.primaryDark}>
                Challenges
              </WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                {challenges.length} aktif
              </WKText>
            </WKCard>
          </TouchableOpacity>
        </View>

        {/* Battle Button */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/battle/lobby')}
          accessibilityRole="button"
          accessibilityLabel="Savaş moduna git"
          activeOpacity={0.85}
          style={styles.battleButton}
        >
          <View style={styles.battleCard}>
            <WKText style={styles.battleEmoji}>⚔️</WKText>
            <View style={styles.battleInfo}>
              <WKText style={styles.battleTitle}>WortKampf</WKText>
              <WKText style={styles.battleSub}>Canlı savaş — ELO kazan!</WKText>
            </View>
            <WKText style={styles.battleArrow}>→</WKText>
          </View>
        </TouchableOpacity>

        {/* Analytics & AI Features */}
        <View style={styles.analyticsRow}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/analytics')}
            accessibilityRole="button"
            accessibilityLabel="Analytics ekranına git"
            style={[styles.analyticsButton, { flex: 1 }]}
            activeOpacity={0.8}
          >
            <WKCard style={styles.analyticsCard}>
              <WKText variant="heading2">📊</WKText>
              <WKText variant="body" color={Colors.text.primaryDark}>
                Analytics
              </WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                {todayMetrics?.wordsLearnedToday || 0} kelime bugün
              </WKText>
            </WKCard>
          </TouchableOpacity>

          {topRecommendations.length > 0 && (
            <View style={[styles.analyticsButton, { flex: 1 }]}>
              <WKCard style={styles.analyticsCard}>
                <WKText variant="heading2">🤖</WKText>
                <WKText variant="body" color={Colors.text.primaryDark}>
                  AI Öneri
                </WKText>
                <WKText variant="caption" color={Colors.text.secondary}>
                  {topRecommendations[0].title}
                </WKText>
              </WKCard>
            </View>
          )}
        </View>

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
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginBottom: Spacing.s24,
  },
  socialButton: {
    flex: 1,
  },
  socialCard: {
    alignItems: 'center',
    paddingVertical: Spacing.s16,
    gap: Spacing.s4,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginBottom: Spacing.s24,
  },
  analyticsButton: {
    flex: 1,
  },
  analyticsCard: {
    alignItems: 'center',
    paddingVertical: Spacing.s16,
    gap: Spacing.s4,
  },
  battleButton: {
    marginBottom: Spacing.s16,
  },
  battleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.battle.purple,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  battleEmoji: {
    fontSize: 32,
  },
  battleInfo: {
    flex: 1,
  },
  battleTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  battleSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  battleArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
