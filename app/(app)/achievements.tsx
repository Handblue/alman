import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { achievementService, ACHIEVEMENT_DEFS } from '@/services/achievementService';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSocialStore } from '@/store/useSocialStore';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }, isDark: boolean) {
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
    achievementCard: {
      gap: Spacing.s12,
      borderWidth: 1,
      borderColor: isDark ? Colors.border.primary : `${Colors.text.secondaryLight}22`,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.s12 },
    progressTrack: {
      height: 8,
      borderRadius: Radius.chip,
      backgroundColor: isDark ? Colors.bg.primaryDark : `${Colors.text.secondaryLight}22`,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: Colors.brand.primary,
      borderRadius: Radius.chip,
    },
  });
}

export default function AchievementsScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { xp, streak, badges } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const { friends } = useSocialStore();
  const battleStats = achievementService.getBattleStats();
  const pronStats = achievementService.getPronunciationStats();
  const knownWords = Object.values(wordProgress).filter(word => word.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(unit => unit.isCompleted).length;
  const earnedIds = new Set([...badges, ...achievementService.getEarned()]);

  const achievementCtx = {
    xp,
    streak,
    knownWords,
    completedUnits,
    battleWins: battleStats.wins,
    battleCount: battleStats.total,
    pronunciationFourPlus: pronStats.fourPlus,
    folders: 0,
    friends: friends.length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">Başarımlar</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              {earnedIds.size}/{ACHIEVEMENT_DEFS.length} rozet açıldı
            </WKText>
          </View>
        </View>

        {ACHIEVEMENT_DEFS.map(def => {
          const earned = earnedIds.has(def.id);
          const progress = achievementService.getProgress(def.id, achievementCtx);
          return (
            <WKCard key={def.id} style={styles.achievementCard}>
              <View style={styles.topRow}>
                <View style={{ flex: 1, gap: Spacing.s4 }}>
                  <WKText variant="heading2">{def.emoji} {def.name}</WKText>
                  <WKText variant="bodySm" color={colors.textSecondary}>{def.desc}</WKText>
                </View>
                <WKText variant="bodySm" color={earned ? Colors.status.success : Colors.brand.primary}>
                  {earned ? 'Tamamlandı' : `%${Math.round(progress * 100)}`}
                </WKText>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(progress * 100, earned ? 100 : 4)}%` }]} />
              </View>
              <WKText variant="caption" color={colors.textSecondary}>
                Ödül: +{def.xpReward} XP
              </WKText>
            </WKCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
