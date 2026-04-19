import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useAnalyticsStore, useTodayMetrics, useWeeklyProgress } from '@/store/useAnalyticsStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';
import { battleHistoryService } from '@/services/battleHistoryService';
import { speakingService } from '@/services/speakingService';
import { offlineContentService } from '@/services/offlineContentService';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: Spacing.s20, paddingBottom: Spacing.s32, gap: Spacing.s16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s12 },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: Radius.chip,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', gap: Spacing.s12 },
    statCard: { flex: 1, gap: Spacing.s4 },
    listRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.s8,
    },
  });
}

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const todayMetrics = useTodayMetrics();
  const weeklyProgress = useWeeklyProgress();
  const learningSessions = useAnalyticsStore(state => state.learningSessions);
  const { xp, streak } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const battleHistory = battleHistoryService.getHistory();
  const speakingHistory = speakingService.getRecentSessions();
  const offlineStats = offlineContentService.getStats();
  const knownWords = Object.values(wordProgress).filter(word => word.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(unit => unit.isCompleted).length;
  const winCount = battleHistory.filter(entry => entry.didWin).length;

  const summaryRows = [
    ['Toplam XP', `${xp}`],
    ['Güncel streak', `🔥 ${streak}`],
    ['Öğrenilen kelime', `${knownWords}`],
    ['Tamamlanan ünite', `${completedUnits}`],
    ['Bu hafta kelime', `${weeklyProgress.totalWords}`],
    ['Ortalama doğruluk', `%${Math.round(weeklyProgress.averageAccuracy)}`],
    ['Battle galibiyeti', `${winCount}/${battleHistory.length || 0}`],
    ['Speaking seansı', `${speakingHistory.length}`],
    ['Offline kelime', `${offlineStats.totalWords}`],
    ['Bugün öğrenilen', `${todayMetrics?.wordsLearnedToday ?? 0}`],
    ['Oturum sayısı', `${learningSessions.length}`],
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">İstatistikler</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Analytics, battle, speaking ve offline mod özetleri
            </WKText>
          </View>
        </View>

        <View style={styles.row}>
          <WKCard style={styles.statCard}>
            <WKText variant="caption" color={colors.textSecondary}>Haftalık kelime</WKText>
            <WKText variant="heading2">{weeklyProgress.totalWords}</WKText>
          </WKCard>
          <WKCard style={styles.statCard}>
            <WKText variant="caption" color={colors.textSecondary}>Ortalama oturum</WKText>
            <WKText variant="heading2">{Math.round(weeklyProgress.averageSessionLength)} dk</WKText>
          </WKCard>
        </View>

        <View style={styles.row}>
          <WKCard style={styles.statCard}>
            <WKText variant="caption" color={colors.textSecondary}>Bugünkü doğruluk</WKText>
            <WKText variant="heading2">%{Math.round(todayMetrics?.accuracyRate ?? 0)}</WKText>
          </WKCard>
          <WKCard style={styles.statCard}>
            <WKText variant="caption" color={colors.textSecondary}>Speaking kredi</WKText>
            <WKText variant="heading2">{speakingService.getCredits()} dk</WKText>
          </WKCard>
        </View>

        <WKCard>
          <WKText variant="heading2">Detaylı Özet</WKText>
          <View style={{ marginTop: Spacing.s12 }}>
            {summaryRows.map(([label, value], index) => (
              <View key={label} style={[styles.listRow, index === summaryRows.length - 1 && { paddingBottom: 0 }]}>
                <WKText variant="bodySm" color={colors.textSecondary}>{label}</WKText>
                <WKText variant="bodySm">{value}</WKText>
              </View>
            ))}
          </View>
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}
