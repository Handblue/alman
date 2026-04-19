import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useUserStore } from '@/store/useUserStore';
import { leaderboardService, LeaderboardEntry } from '@/services/leaderboardService';
import { achievementService } from '@/services/achievementService';
import { auth } from '@/firebase';

type Tab = 'weekly' | 'allTime' | 'elo';

// Local ELO leaderboard — reads from achievementService (local-only until backend sync)
interface EloEntry {
  rank: number;
  displayName: string;
  elo: number;
  wins: number;
  total: number;
  isMe?: boolean;
}

function buildLocalEloBoard(myElo: number, myWins: number, myTotal: number): EloEntry[] {
  // Seed a fun static list plus the user
  const bots: EloEntry[] = [
    { rank: 0, displayName: 'WortMeister', elo: 1850, wins: 234, total: 280 },
    { rank: 0, displayName: 'DeutschFan99', elo: 1720, wins: 189, total: 240 },
    { rank: 0, displayName: 'GrammarKing', elo: 1640, wins: 155, total: 210 },
    { rank: 0, displayName: 'AlphaLerner', elo: 1580, wins: 140, total: 195 },
    { rank: 0, displayName: 'SprachProfi', elo: 1510, wins: 120, total: 175 },
    { rank: 0, displayName: 'VokabelHero', elo: 1460, wins: 110, total: 165 },
    { rank: 0, displayName: 'B2Beast', elo: 1380, wins: 95, total: 150 },
    { rank: 0, displayName: 'GoetheJäger', elo: 1320, wins: 82, total: 135 },
    { rank: 0, displayName: 'UmlauthLord', elo: 1250, wins: 70, total: 120 },
  ];
  const me: EloEntry = {
    rank: 0, displayName: 'Sen', elo: myElo, wins: myWins, total: myTotal, isMe: true,
  };
  const all = [...bots, me].sort((a, b) => b.elo - a.elo);
  return all.map((e, i) => ({ ...e, rank: i + 1 }));
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

export default function LeaderboardScreen() {
  const userXP = useUserStore((s) => s.xp);
  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const battleStats = achievementService.getBattleStats();
  const eloBoard = buildLocalEloBoard(battleStats.elo, battleStats.wins, battleStats.total);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let data: LeaderboardEntry[];
      if (activeTab === 'weekly') {
        data = await leaderboardService.getWeeklyLeaderboard();
      } else {
        data = await leaderboardService.getTopUsers();
      }
      setLeaderboardData(data);

      // Get user's rank
      const user = await leaderboardService.getUserRank(auth?.currentUser?.uid || '');
      setUserRank(user?.rank || null);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Fallback to empty array
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  // Create user entry for display
  const userEntry: LeaderboardEntry = {
    uid: 'current-user',
    displayName: 'Sen',
    xp: userXP,
    level: Math.floor(userXP / 500) + 1,
    avatar: '🎮',
    rank: userRank || 0,
  };

  const allEntries = [...leaderboardData];
  const top3 = allEntries.slice(0, 3);
  const rest = allEntries.slice(3);

  // Check if user is in top 10
  const userInTop10 = userRank && userRank <= 10;

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
          <TouchableOpacity
            onPress={() => setActiveTab('elo')}
            accessibilityRole="tab"
            accessibilityLabel="Battle ELO"
            accessibilityState={{ selected: activeTab === 'elo' }}
            style={[styles.tab, activeTab === 'elo' && styles.tabActive]}
          >
            <WKText variant="caption" color={Colors.text.primaryDark}>
              ⚔️ ELO
            </WKText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* ELO tab */}
        {activeTab === 'elo' && (
          <View style={styles.listContainer}>
            <View style={styles.eloHeader}>
              <WKText style={styles.eloHeaderTitle}>⚔️ Battle ELO Sıralaması</WKText>
              <WKText style={styles.eloHeaderSub}>Senin ELO'n: {battleStats.elo}</WKText>
            </View>
            {eloBoard.map((entry) => (
              <WKCard
                key={entry.rank}
                style={[styles.rankRow, entry.isMe && styles.userRow]}
              >
                <View style={styles.rankLeft}>
                  <WKText variant="body" color={Colors.text.secondary} style={styles.rankNum}>
                    {getMedalEmoji(entry.rank)}
                  </WKText>
                  <WKText variant="body">{entry.isMe ? '🎮' : '👤'}</WKText>
                  <View>
                    <WKText variant="body" color={entry.isMe ? Colors.brand.primary : Colors.text.primaryDark}>
                      {entry.displayName}
                    </WKText>
                    <WKText variant="caption" color={Colors.text.secondary}>
                      {entry.wins}G / {entry.total}O
                    </WKText>
                  </View>
                </View>
                <View style={styles.eloRight}>
                  <WKText style={[styles.eloNum, entry.isMe && { color: Colors.battle.purple }]}>
                    {entry.elo}
                  </WKText>
                  <WKText style={styles.eloLabel}>ELO</WKText>
                </View>
              </WKCard>
            ))}
            <View style={{ height: Spacing.s32 }} />
          </View>
        )}

        {activeTab !== 'elo' && loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <WKText variant="body" color={Colors.text.secondary} style={styles.loadingText}>
              Sıralama yükleniyor...
            </WKText>
          </View>
        ) : activeTab !== 'elo' ? (
          <>
            {/* Podium: top 3 */}
            {top3.length >= 3 && (
              <View style={styles.podium}>
                {/* 2nd place */}
                <View style={[styles.podiumItem, styles.podiumSecond]}>
                  <WKText variant="heading1">{top3[1].avatar || '👤'}</WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>🥈</WKText>
                  <WKText variant="caption" color={Colors.text.primaryDark} numberOfLines={1}>
                    {top3[1].displayName}
                  </WKText>
                  <WKText variant="caption" color={Colors.accent.orange}>
                    {top3[1].xp.toLocaleString()} XP
                  </WKText>
                </View>

                {/* 1st place */}
                <View style={[styles.podiumItem, styles.podiumFirst]}>
                  <WKText variant="hero">{top3[0].avatar || '👤'}</WKText>
                  <WKText variant="heading2">🥇</WKText>
                  <WKText variant="caption" color={Colors.text.primaryDark} numberOfLines={1}>
                    {top3[0].displayName}
                  </WKText>
                  <WKText variant="caption" color={Colors.accent.gold}>
                    {top3[0].xp.toLocaleString()} XP
                  </WKText>
                </View>

                {/* 3rd place */}
                <View style={[styles.podiumItem, styles.podiumThird]}>
                  <WKText variant="heading1">{top3[2].avatar || '👤'}</WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>🥉</WKText>
                  <WKText variant="caption" color={Colors.text.primaryDark} numberOfLines={1}>
                    {top3[2].displayName}
                  </WKText>
                  <WKText variant="caption" color={Colors.accent.orange}>
                    {top3[2].xp.toLocaleString()} XP
                  </WKText>
                </View>
              </View>
            )}

            {/* Ranks 4-10 */}
            <View style={styles.listContainer}>
              {rest.map((entry) => (
                <WKCard key={entry.uid} style={styles.rankRow}>
                  <View style={styles.rankLeft}>
                    <WKText variant="body" color={Colors.text.secondary} style={styles.rankNum}>
                      {getMedalEmoji(entry.rank || 0)}
                    </WKText>
                    <WKText variant="body">{entry.avatar || '👤'}</WKText>
                    <WKText variant="body" color={Colors.text.primaryDark}>
                      {entry.displayName}
                    </WKText>
                  </View>
                  <WKText variant="body" color={Colors.accent.orange}>
                    {entry.xp.toLocaleString()} XP
                  </WKText>
                </WKCard>
              ))}

              {/* User entry */}
              {!userInTop10 && userRank && (
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
                        {userEntry.displayName}
                      </WKText>
                    </View>
                    <WKText variant="body" color={Colors.accent.orange}>
                      {userEntry.xp.toLocaleString()} XP
                    </WKText>
                  </WKCard>
                </>
              )}
            </View>
          </>
        ) : null}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.s64,
  },
  loadingText: {
    marginTop: Spacing.s16,
  },
  eloHeader: {
    paddingVertical: Spacing.s16,
    alignItems: 'center',
    gap: 4,
  },
  eloHeaderTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  eloHeaderSub: {
    color: Colors.battle.purple,
    fontSize: 14,
    fontWeight: '700',
  },
  eloRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  eloNum: {
    color: Colors.accent.gold,
    fontWeight: '900',
    fontSize: 20,
  },
  eloLabel: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
});
