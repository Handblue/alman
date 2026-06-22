import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { WKText, WKCard } from '@/components/ui';
import { ThemeProvider } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useUserStore } from '@/store/useUserStore';
import { leaderboardService, LeaderboardEntry } from '@/services/leaderboardService';
import { achievementService } from '@/services/achievementService';
import { authService } from '@/services/authService';

type Tab = 'weekly' | 'allTime' | 'elo';

interface EloEntry {
  rank: number;
  displayName: string;
  elo: number;
  wins: number;
  total: number;
  isMe?: boolean;
}

function buildLocalEloBoard(myElo: number, myWins: number, myTotal: number): EloEntry[] {
  const bots: EloEntry[] = [
    { rank: 0, displayName: 'WortMeister',  elo: 1850, wins: 234, total: 280 },
    { rank: 0, displayName: 'DeutschFan99', elo: 1720, wins: 189, total: 240 },
    { rank: 0, displayName: 'GrammarKing',  elo: 1640, wins: 155, total: 210 },
    { rank: 0, displayName: 'AlphaLerner',  elo: 1580, wins: 140, total: 195 },
    { rank: 0, displayName: 'SprachProfi',  elo: 1510, wins: 120, total: 175 },
    { rank: 0, displayName: 'VokabelHero',  elo: 1460, wins: 110, total: 165 },
    { rank: 0, displayName: 'B2Beast',      elo: 1380, wins: 95,  total: 150 },
    { rank: 0, displayName: 'GoetheJäger',  elo: 1320, wins: 82,  total: 135 },
    { rank: 0, displayName: 'UmlauthLord',  elo: 1250, wins: 70,  total: 120 },
  ];
  const me: EloEntry = {
    rank: 0, displayName: 'Sen', elo: myElo, wins: myWins, total: myTotal, isMe: true,
  };
  const all = [...bots, me].sort((a, b) => b.elo - a.elo);
  return all.map((e, i) => ({ ...e, rank: i + 1 }));
}

const MEDALS = ['🥇', '🥈', '🥉'];
function getMedal(rank: number): string {
  return rank <= 3 ? MEDALS[rank - 1] : `${rank}.`;
}

function ChangeIndicator({ change }: { change: string }) {
  const up = change.startsWith('+');
  const neutral = change === '0';
  return (
    <WKText style={[styles.changeText, up ? styles.changeUp : neutral ? styles.changeNeutral : styles.changeDown]}>
      {neutral ? '—' : change}
    </WKText>
  );
}

export default function LeaderboardScreen() {
  return (
    <ThemeProvider initialDark>
      <LeaderboardScreenInner />
    </ThemeProvider>
  );
}

function LeaderboardScreenInner() {
  const userXP = useUserStore((s) => s.xp);
  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const battleStats = achievementService.getBattleStats();
  const eloBoard = buildLocalEloBoard(battleStats.elo, battleStats.wins, battleStats.total);

  useEffect(() => { loadLeaderboard(); }, [activeTab]);

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
      const user = await leaderboardService.getUserRank(authService.getCurrentUser()?.id || '');
      setUserRank(user?.rank || null);
    } catch {
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const userEntry: LeaderboardEntry = {
    uid: 'current-user',
    displayName: 'Sen',
    xp: userXP,
    level: Math.floor(userXP / 500) + 1,
    avatar: '🎮',
    rank: userRank || 0,
  };

  const top3 = leaderboardData.slice(0, 3);
  const rest  = leaderboardData.slice(3);
  const userInTop10 = userRank && userRank <= 10;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backBtn}
        >
          <WKText style={styles.backText}>← Geri</WKText>
        </TouchableOpacity>
        <WKText style={styles.headerTitle}>Sıralama</WKText>
        <WKText style={styles.headerSub}>Haftanın en iyileri</WKText>
      </View>

      {/* My Rank Card */}
      <LinearGradient
        colors={['#512DA8', '#7C6CFF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.myRankCard}
      >
        <WKText style={styles.myRankLabel}>SENİN SIRALAMAN</WKText>
        <View style={styles.myRankRow}>
          <View style={styles.myRankAvatar}>
            <WKText style={{ fontSize: 22 }}>🙂</WKText>
          </View>
          <View style={{ flex: 1 }}>
            <WKText style={styles.myRankName}>Sen</WKText>
            <WKText style={styles.myRankXP}>{userXP.toLocaleString()} XP bu hafta</WKText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <WKText style={styles.myRankNum}>#{userRank ?? '—'}</WKText>
            <WKText style={styles.myRankChange}>↑ +5 bu hafta</WKText>
          </View>
        </View>
        <View style={styles.myRankBarBg}>
          <View style={[styles.myRankBarFill, { width: `${Math.min((userXP / 4820) * 100, 100)}%` as `${number}%` }]} />
        </View>
        <WKText style={styles.myRankHint}>
          {Math.max(0, 4820 - userXP).toLocaleString()} XP sonra #1 olursun
        </WKText>
      </LinearGradient>

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        {(['weekly', 'allTime', 'elo'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === t }}
            style={[styles.tab, activeTab === t && styles.tabActive]}
          >
            <WKText style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'weekly' ? 'Bu Hafta' : t === 'allTime' ? 'Tüm Zamanlar' : '⚔️ ELO'}
            </WKText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ELO Tab */}
        {activeTab === 'elo' && (
          <View style={styles.list}>
            <View style={styles.eloHeader}>
              <WKText style={styles.eloTitle}>⚔️ Battle ELO Sıralaması</WKText>
              <WKText style={styles.eloSub}>Senin ELO'n: {battleStats.elo}</WKText>
            </View>
            {eloBoard.map((entry) => (
              <View
                key={entry.rank}
                style={[styles.rankRow, entry.isMe && styles.rankRowMe]}
              >
                <WKText style={[styles.rankNum, entry.rank <= 3 && styles.rankNumMedal]}>
                  {getMedal(entry.rank)}
                </WKText>
                <View style={styles.rankAvatar}>
                  <WKText style={{ fontSize: 18 }}>{entry.isMe ? '🎮' : '👤'}</WKText>
                </View>
                <View style={{ flex: 1 }}>
                  <WKText style={[styles.rankName, entry.isMe && styles.rankNameMe]}>
                    {entry.displayName}
                  </WKText>
                  <WKText style={styles.rankMeta}>{entry.wins}G / {entry.total}O</WKText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <WKText style={[styles.eloNum, entry.isMe && { color: Colors.brand.violet }]}>
                    {entry.elo}
                  </WKText>
                  <WKText style={styles.eloLabel}>ELO</WKText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weekly / AllTime */}
        {activeTab !== 'elo' && loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.brand.violet} />
            <WKText style={styles.loadingText}>Sıralama yükleniyor…</WKText>
          </View>
        )}

        {activeTab !== 'elo' && !loading && (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <View style={styles.podium}>
                {/* 2nd */}
                <View style={[styles.podiumItem, styles.podiumSecond]}>
                  <WKText style={{ fontSize: 28 }}>{top3[1].avatar || '👤'}</WKText>
                  <WKText style={{ fontSize: 18 }}>🥈</WKText>
                  <WKText style={styles.podiumName} numberOfLines={1}>{top3[1].displayName}</WKText>
                  <WKText style={styles.podiumXP}>{top3[1].xp.toLocaleString()} XP</WKText>
                </View>
                {/* 1st */}
                <View style={[styles.podiumItem, styles.podiumFirst]}>
                  <WKText style={{ fontSize: 36 }}>{top3[0].avatar || '👤'}</WKText>
                  <WKText style={{ fontSize: 22 }}>🥇</WKText>
                  <WKText style={styles.podiumName} numberOfLines={1}>{top3[0].displayName}</WKText>
                  <WKText style={[styles.podiumXP, { color: Colors.accent.gold }]}>
                    {top3[0].xp.toLocaleString()} XP
                  </WKText>
                </View>
                {/* 3rd */}
                <View style={[styles.podiumItem, styles.podiumThird]}>
                  <WKText style={{ fontSize: 24 }}>{top3[2].avatar || '👤'}</WKText>
                  <WKText style={{ fontSize: 18 }}>🥉</WKText>
                  <WKText style={styles.podiumName} numberOfLines={1}>{top3[2].displayName}</WKText>
                  <WKText style={styles.podiumXP}>{top3[2].xp.toLocaleString()} XP</WKText>
                </View>
              </View>
            )}

            {/* Rest */}
            <View style={styles.list}>
              {rest.map((entry) => (
                <View key={entry.uid} style={styles.rankRow}>
                  <WKText style={styles.rankNum}>{getMedal(entry.rank || 0)}</WKText>
                  <View style={styles.rankAvatar}>
                    <WKText style={{ fontSize: 18 }}>{entry.avatar || '👤'}</WKText>
                  </View>
                  <WKText style={[styles.rankName, { flex: 1 }]}>{entry.displayName}</WKText>
                  <WKText style={styles.rankXP}>{entry.xp.toLocaleString()} XP</WKText>
                </View>
              ))}

              {!userInTop10 && userRank && (
                <>
                  <View style={styles.divider}><WKText style={styles.dividerDots}>• • •</WKText></View>
                  <View style={[styles.rankRow, styles.rankRowMe]}>
                    <WKText style={styles.rankNum}>{userEntry.rank}.</WKText>
                    <View style={styles.rankAvatar}>
                      <WKText style={{ fontSize: 18 }}>{userEntry.avatar}</WKText>
                    </View>
                    <WKText style={[styles.rankName, styles.rankNameMe, { flex: 1 }]}>
                      {userEntry.displayName}
                    </WKText>
                    <WKText style={styles.rankXP}>{userEntry.xp.toLocaleString()} XP</WKText>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        <View style={{ height: Spacing.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark },

  header: { paddingHorizontal: Spacing.s20, paddingBottom: 4 },
  backBtn: { paddingVertical: Spacing.s12, alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text.mutedDark },
  headerTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, color: Colors.text.primaryDark, lineHeight: 34 },
  headerSub:   { fontFamily: 'Inter_400Regular',   fontSize: 13, color: Colors.text.mutedDark,   marginTop: 2, marginBottom: 14 },

  // My rank card
  myRankCard: {
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s16,
    borderRadius: Radius.card + 8,
    padding: 18,
  },
  myRankLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11, letterSpacing: 1,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  myRankRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  myRankAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  myRankName:   { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' },
  myRankXP:     { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  myRankNum:    { fontFamily: 'Inter_800ExtraBold', fontSize: 32, color: '#fff', lineHeight: 36 },
  myRankChange: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  myRankBarBg:  {
    height: 5, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3, marginTop: 14, overflow: 'hidden',
  },
  myRankBarFill: { height: 5, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 3 },
  myRankHint: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: 'rgba(255,255,255,0.5)', marginTop: 6,
  },

  // Tab toggle
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.s16,
    marginBottom: Spacing.s16,
    backgroundColor: Colors.bg.cardDark2,
    borderRadius: Radius.chip,
    padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: Radius.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { backgroundColor: Colors.brand.violet },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12, color: Colors.text.mutedDark,
  },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1 },

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
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  podiumFirst: {
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: Colors.accent.gold,
  },
  podiumSecond: { marginBottom: 8 },
  podiumThird:  { marginBottom: 16 },
  podiumName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11, color: Colors.text.primaryDark,
    textAlign: 'center',
  },
  podiumXP: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11, color: Colors.accent.peach,
  },

  // Rank list
  list: { paddingHorizontal: Spacing.s20, gap: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rankRowMe: {
    backgroundColor: `${Colors.brand.violet}22`,
    borderColor: `${Colors.brand.violet}60`,
    borderWidth: 1.5,
  },
  rankNum: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14, color: Colors.text.mutedDark,
    width: 32, textAlign: 'center',
  },
  rankNumMedal: { color: '#fff' },
  rankAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bg.cardDark2,
    alignItems: 'center', justifyContent: 'center',
  },
  rankName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14, color: Colors.text.primaryDark,
  },
  rankNameMe: { fontFamily: 'Inter_700Bold', color: '#fff' },
  rankMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11, color: Colors.text.mutedDark,
  },
  rankXP: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12, color: Colors.accent.peach,
  },
  changeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  changeUp:      { color: Colors.status.success },
  changeDown:    { color: Colors.status.error },
  changeNeutral: { color: Colors.text.mutedDark },

  // ELO
  eloHeader: { paddingVertical: 16, alignItems: 'center', gap: 4 },
  eloTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18, color: '#fff',
  },
  eloSub: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14, color: Colors.brand.violet,
  },
  eloNum: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20, color: Colors.accent.gold,
  },
  eloLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11, color: Colors.text.mutedDark,
  },

  divider: { alignItems: 'center', paddingVertical: 4 },
  dividerDots: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.text.mutedDark },

  loadingBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.s64,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14, color: Colors.text.mutedDark,
    marginTop: 16,
  },
});
