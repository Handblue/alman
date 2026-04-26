import { useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { DailyChallengeCard } from '@/components/dashboard/DailyChallengeCard';
import { RecentUnitCard } from '@/components/dashboard/RecentUnitCard';
import { AchievementToast } from '@/components/ui';
import { useAchievementCheck } from '@/hooks/useAchievementCheck';
import { UNITS } from '@/data/units';
import { useUserStore } from '@/store/useUserStore';
import { auth } from '@/firebase';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useAnalyticsStore, useTodayMetrics } from '@/store/useAnalyticsStore';
import { useProgressStore } from '@/store/useProgressStore';

const DAILY_GOAL_XP = 100;

export default function DashboardScreen() {
  const { xp, streak, level } = useUserStore();
  const initToday = useDailyChallengeStore((s) => s.initToday);
  const checkAndUpdateStreak = useUserStore((s) => s.checkAndUpdateStreak);
  const { friends } = useSocialStore();
  const { loadAnalyticsData, loadAIData } = useAnalyticsStore();
  const todayMetrics = useTodayMetrics();
  const { currentToast, check, dismiss } = useAchievementCheck();
  const getDueWords = useProgressStore(s => s.getDueWords);
  const dueCount = getDueWords().length;

  const todayXP  = xp % DAILY_GOAL_XP;
  const goalPct  = Math.min(todayXP / DAILY_GOAL_XP, 1);
  const accuracy = todayMetrics?.avgAccuracy ?? 86;

  useEffect(() => {
    initToday();
    checkAndUpdateStreak();
    const userId = auth?.currentUser?.uid;
    if (userId) {
      loadAnalyticsData(userId).catch(console.error);
      loadAIData(userId).catch(console.error);
    }
    check();
  }, [check, checkAndUpdateStreak, initToday, loadAIData, loadAnalyticsData]);

  return (
    <SafeAreaView style={styles.container}>
      <AchievementToast toast={currentToast} onDismiss={dismiss} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <WKText style={styles.heroTitle}>WortKrieg</WKText>
            <WKText style={styles.heroSub}>Bugün ne öğreniyoruz?</WKText>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.levelBadge}>
              <WKText style={styles.levelText}>Seviye {level}</WKText>
            </View>
            <WKText style={styles.streakText}>🔥 {streak}</WKText>
            <WKText style={styles.xpText}>{xp.toLocaleString()} XP</WKText>
          </View>
        </View>

        {/* ── Hero "Devam Et" Card ── */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/categories')}
          accessibilityRole="button"
          accessibilityLabel="Kaldığın yerden devam et"
          activeOpacity={0.88}
          style={styles.heroCard}
        >
          <LinearGradient
            colors={Colors.gradient.heroCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroBubble} />
            <WKText style={styles.heroCardLabel}>Kaldığın yerden devam et</WKText>
            <WKText style={styles.heroCardTitle}>Seyahat Kelimeleri</WKText>
            <WKText style={styles.heroCardSub}>Ders 6 · 12 dk kaldı</WKText>
            <View style={styles.heroCardRow}>
              <View style={styles.heroBtn}>
                <WKText style={styles.heroBtnText}>▶ Devam Et</WKText>
              </View>
              <View style={styles.heroProgress}>
                <View style={[styles.heroProgressFill, { width: '67%' }]} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── 2×2 Stat Grid ── */}
        <View style={styles.statGrid}>
          {[
            { icon: '🔥', val: streak.toString(), label: 'Streak · gün',     bg: Colors.accent.peach },
            { icon: '⚡', val: todayXP.toString(), label: 'XP · bugün',       bg: Colors.accent.butter },
            { icon: '🎯', val: `${accuracy}%`,   label: 'Doğruluk · son',   bg: Colors.accent.sky },
            { icon: '👥', val: friends.length.toString(), label: 'Arkadaş', bg: Colors.brand.violetSoft },
          ].map((s, i) => (
            <WKCard key={i} style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: s.bg }]}>
                <WKText style={styles.statIcon}>{s.icon}</WKText>
              </View>
              <WKText style={styles.statVal}>{s.val}</WKText>
              <WKText style={styles.statLabel}>{s.label}</WKText>
            </WKCard>
          ))}
        </View>

        {/* ── Daily Challenge ── */}
        <DailyChallengeCard />

        {/* ── SRS Tekrar ── */}
        {dueCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(app)/study/review')}
            accessibilityRole="button"
            accessibilityLabel="SRS tekrar ekranına git"
            activeOpacity={0.85}
            style={styles.mb12}
          >
            <WKCard style={styles.srsCard}>
              <WKText style={styles.srsIcon}>🧠</WKText>
              <View style={styles.srsInfo}>
                <WKText style={styles.srsTitle}>Tekrar Zamanı!</WKText>
                <WKText style={styles.srsSub}>{dueCount} kelime seni bekliyor</WKText>
              </View>
              <View style={styles.srsBadge}>
                <WKText style={styles.srsBadgeText}>{dueCount}</WKText>
              </View>
            </WKCard>
          </TouchableOpacity>
        )}

        {/* ── Battle Promo ── */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/battle/lobby')}
          accessibilityRole="button"
          accessibilityLabel="Savaş moduna git"
          activeOpacity={0.85}
          style={styles.mb12}
        >
          <LinearGradient
            colors={Colors.gradient.battle}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.battleCard}
          >
            <WKText style={styles.battleEmoji}>⚔️</WKText>
            <View style={styles.battleInfo}>
              <WKText style={styles.battleTitle}>WortKampf</WKText>
              <WKText style={styles.battleSub}>Canlı savaş · ELO kazan!</WKText>
            </View>
            <WKText style={styles.battleArrow}>→</WKText>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Günlük Hedef Progress ── */}
        <WKCard style={styles.mb12}>
          <View style={styles.goalRow}>
            <WKText style={styles.goalTitle}>Günlük Hedef</WKText>
            <WKText style={styles.goalXP}>🔥 {todayXP} / {DAILY_GOAL_XP} XP</WKText>
          </View>
          <View
            style={styles.goalBarBg}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: DAILY_GOAL_XP, now: todayXP }}
          >
            <View style={[styles.goalBarFill, { width: `${goalPct * 100}%` as `${number}%` }]} />
          </View>
        </WKCard>

        {/* ── Son Çalışılan ── */}
        <WKText style={styles.sectionTitle}>Son Çalışılan</WKText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentScroll}
          contentContainerStyle={{ paddingRight: Spacing.s20 }}
        >
          {UNITS.filter((u) => u.wordCount > 0).slice(0, 6).map((unit, i) => (
            <RecentUnitCard key={unit.id} unit={unit} index={i} />
          ))}
        </ScrollView>

        {/* ── Tüm Kategoriler ── */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/categories')}
          accessibilityRole="button"
          accessibilityLabel="Tüm kategorilere git"
          activeOpacity={0.82}
          style={styles.allCatsBtn}
        >
          <WKText style={styles.allCatsBtnText}>Tüm Kategoriler</WKText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(app)/settings')}
          accessibilityRole="button"
          accessibilityLabel="Ayarlara git"
          activeOpacity={0.82}
          style={[styles.allCatsBtn, styles.settingsBtn]}
        >
          <WKText style={styles.settingsBtnText}>Ayarlar</WKText>
        </TouchableOpacity>

        <View style={{ height: Spacing.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
  },
  scroll: {
    paddingHorizontal: Spacing.s20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.s20,
    paddingBottom: Spacing.s12,
  },
  heroTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 28,
    color: Colors.text.primary,
    lineHeight: 34,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 2,
  },
  headerRight: { alignItems: 'flex-end', gap: 5 },
  levelBadge: {
    backgroundColor: Colors.text.primary,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.s8,
    paddingVertical: 4,
  },
  levelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.accent.gold,
  },
  streakText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.primary,
  },
  xpText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.accent.peach,
  },

  // Hero card
  heroCard: { marginBottom: Spacing.s12, borderRadius: Radius.card + 8 },
  heroGradient: {
    borderRadius: Radius.card + 8,
    padding: 22,
    overflow: 'hidden',
  },
  heroBubble: {
    position: 'absolute',
    right: -24, top: -32,
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroCardLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  heroCardTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: '#fff',
    lineHeight: 27,
    marginBottom: 4,
  },
  heroCardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 16,
  },
  heroCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroBtn: {
    backgroundColor: '#fff',
    borderRadius: Radius.chip,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  heroBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text.primary,
  },
  heroProgress: {
    flex: 1, height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.chip,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: Radius.chip,
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.s12,
  },
  statCard: {
    width: '47.5%',
    gap: 10,
    padding: 16,
  },
  statIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  statIcon: { fontSize: 16 },
  statVal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.text.primary,
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },

  // SRS card
  mb12: { marginBottom: 12 },
  srsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    paddingVertical: 14,
  },
  srsIcon: { fontSize: 22 },
  srsInfo: { flex: 1 },
  srsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
  srsSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  srsBadge: {
    backgroundColor: Colors.brand.violet,
    borderRadius: 16,
    minWidth: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  srsBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#fff',
  },

  // Battle card
  battleCard: {
    borderRadius: Radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  battleEmoji: { fontSize: 26 },
  battleInfo:  { flex: 1 },
  battleTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: '#fff',
  },
  battleSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  battleArrow: { color: '#fff', fontSize: 20 },

  // Daily goal
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s12,
  },
  goalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
  goalXP: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.accent.orange,
  },
  goalBarBg: {
    height: 6,
    backgroundColor: Colors.border.primary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: 6,
    backgroundColor: Colors.brand.violet,
    borderRadius: 3,
  },

  // Section / bottom
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.text.primary,
    marginBottom: 10,
  },
  recentScroll: { marginBottom: Spacing.s16 },

  allCatsBtn: {
    backgroundColor: Colors.brand.violet,
    borderRadius: Radius.chip,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  allCatsBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  settingsBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
  },
  settingsBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.muted,
  },
});
