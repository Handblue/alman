import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useUserStore } from '@/store/useUserStore';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'AlmanKralı', xp: 12400, avatar: '👑' },
  { rank: 2, name: 'DeutschProfi', xp: 9800, avatar: '🦅' },
  { rank: 3, name: 'GoetheUstası', xp: 8200, avatar: '📚' },
  { rank: 4, name: 'BerlinBoss', xp: 6100, avatar: '🏙️' },
  { rank: 5, name: 'WortMeister', xp: 5400, avatar: '⚔️' },
  { rank: 6, name: 'SprachNinja', xp: 4200, avatar: '🥷' },
  { rank: 7, name: 'GruppeSieben', xp: 3800, avatar: '🎯' },
  { rank: 8, name: 'LernBär', xp: 2900, avatar: '🐻' },
  { rank: 9, name: 'DeutschFan', xp: 2100, avatar: '⭐' },
  { rank: 10, name: 'NeuAnfänger', xp: 1400, avatar: '🌱' },
];

type Tab = 'weekly' | 'allTime';

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

export default function LeaderboardScreen() {
  const userXP = useUserStore((s) => s.xp);
  const [activeTab, setActiveTab] = useState<Tab>('weekly');

  // Inject user entry into the list at correct rank
  const userEntry = { rank: 0, name: 'Sen', xp: userXP, avatar: '🎮' };
  const allEntries = [...MOCK_LEADERBOARD];

  // Find user rank among mock entries
  const userRank = allEntries.filter((e) => e.xp > userXP).length + 1;
  userEntry.rank = userRank;

  const top3 = allEntries.slice(0, 3);
  const rest = allEntries.slice(3);

  // Check if user is in top 10
  const userInTop10 = userXP > allEntries[allEntries.length - 1].xp;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradient.leaderboard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backButton}
        >
          <WKText variant="body" color={Colors.text.primaryDark}>← Geri</WKText>
        </TouchableOpacity>
        <WKText variant="hero" color={Colors.text.primaryDark} style={styles.headerTitle}>
          Sıralama 🏆
        </WKText>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('weekly')}
            accessibilityRole="tab"
            accessibilityLabel="Bu Hafta"
            accessibilityState={{ selected: activeTab === 'weekly' }}
            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          >
            <WKText variant="caption" color={Colors.text.primaryDark}>
              Bu Hafta
            </WKText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('allTime')}
            accessibilityRole="tab"
            accessibilityLabel="Tüm Zamanlar"
            accessibilityState={{ selected: activeTab === 'allTime' }}
            style={[styles.tab, activeTab === 'allTime' && styles.tabActive]}
          >
            <WKText variant="caption" color={Colors.text.primaryDark}>
              Tüm Zamanlar
            </WKText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Podium: top 3 */}
        <View style={styles.podium}>
          {/* 2nd place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <WKText variant="heading1">{top3[1].avatar}</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>🥈</WKText>
            <WKText variant="caption" color={Colors.text.primaryDark} numberOfLines={1}>
              {top3[1].name}
            </WKText>
            <WKText variant="caption" color={Colors.accent.orange}>
              {top3[1].xp.toLocaleString()} XP
            </WKText>
          </View>

          {/* 1st place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <WKText variant="hero">{top3[0].avatar}</WKText>
            <WKText variant="heading2">🥇</WKText>
            <WKText variant="caption" color={Colors.text.primaryDark} numberOfLines={1}>
              {top3[0].name}
            </WKText>
            <WKText variant="caption" color={Colors.accent.gold}>
              {top3[0].xp.toLocaleString()} XP
            </WKText>
          </View>

          {/* 3rd place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <WKText variant="heading1">{top3[2].avatar}</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>🥉</WKText>
            <WKText variant="caption" color={Colors.text.primaryDark} numberOfLines={1}>
              {top3[2].name}
            </WKText>
            <WKText variant="caption" color={Colors.accent.orange}>
              {top3[2].xp.toLocaleString()} XP
            </WKText>
          </View>
        </View>

        {/* Ranks 4-10 */}
        <View style={styles.listContainer}>
          {rest.map((entry) => (
            <WKCard key={entry.rank} style={styles.rankRow}>
              <View style={styles.rankLeft}>
                <WKText variant="body" color={Colors.text.secondary} style={styles.rankNum}>
                  {getMedalEmoji(entry.rank)}
                </WKText>
                <WKText variant="body">{entry.avatar}</WKText>
                <WKText variant="body" color={Colors.text.primaryDark}>
                  {entry.name}
                </WKText>
              </View>
              <WKText variant="body" color={Colors.accent.orange}>
                {entry.xp.toLocaleString()} XP
              </WKText>
            </WKCard>
          ))}

          {/* User entry */}
          {!userInTop10 && (
            <>
              <View style={styles.divider}>
                <WKText variant="caption" color={Colors.text.secondary}>• • •</WKText>
              </View>
              <WKCard style={[styles.rankRow, styles.userRow]}>
                <View style={styles.rankLeft}>
                  <WKText variant="body" color={Colors.text.secondary} style={styles.rankNum}>
                    {userEntry.rank}.
                  </WKText>
                  <WKText variant="body">{userEntry.avatar}</WKText>
                  <WKText variant="body" color={Colors.brand.primary}>
                    {userEntry.name}
                  </WKText>
                </View>
                <WKText variant="body" color={Colors.accent.orange}>
                  {userEntry.xp.toLocaleString()} XP
                </WKText>
              </WKCard>
            </>
          )}
        </View>

        <View style={{ height: Spacing.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
  },
  gradientHeader: {
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s24,
  },
  backButton: {
    paddingVertical: Spacing.s12,
    paddingRight: Spacing.s16,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    marginBottom: Spacing.s16,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.s8,
  },
  tab: {
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s16,
    borderRadius: Radius.chip,
    backgroundColor: 'rgba(255,255,255,0.15)',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  scroll: {
    flex: 1,
  },
  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s24,
    gap: Spacing.s8,
  },
  podiumItem: {
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.card,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s8,
    flex: 1,
    gap: Spacing.s4,
  },
  podiumFirst: {
    paddingVertical: Spacing.s20,
    borderWidth: 2,
    borderColor: Colors.accent.gold,
  },
  podiumSecond: {
    marginBottom: Spacing.s8,
  },
  podiumThird: {
    marginBottom: Spacing.s16,
  },
  // Rank list
  listContainer: {
    paddingHorizontal: Spacing.s20,
    gap: Spacing.s8,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    flex: 1,
  },
  rankNum: {
    width: 32,
  },
  userRow: {
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: Spacing.s4,
  },
});
