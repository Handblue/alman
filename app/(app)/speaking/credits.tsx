import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKButton, WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { speakingService } from '@/services/speakingService';
import { authService } from '@/services/authService';

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
    hero: { gap: Spacing.s8 },
    summaryRow: { flexDirection: 'row', gap: Spacing.s12 },
    summaryCard: { flex: 1, gap: Spacing.s4 },
    sessionCard: { gap: Spacing.s8 },
  });
}

export default function SpeakingCreditsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [credits, setCredits] = useState(() => speakingService.getCredits());
  const isPremium = authService.isPremium();
  const recentSessions = speakingService.getRecentSessions();

  useEffect(() => {
    setCredits(speakingService.ensurePremiumDailyBonus(isPremium));
  }, [isPremium]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">Konuşma Kredileri</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              7 dakika birikince partner arama akışını başlatabilirsin.
            </WKText>
          </View>
        </View>

        <WKCard style={styles.hero}>
          <WKText variant="heading2">Kalan kredi</WKText>
          <WKText variant="score" color={Colors.brand.primary}>{credits}</WKText>
          <WKText variant="bodySm" color={colors.textSecondary}>
            Battle galibiyeti +3 dk, challenge 5/5 +1 dk, Premium günlük bonus +3 dk.
          </WKText>
          <WKButton
            label={credits >= 7 ? 'Partner Ara' : 'Kredi Topla'}
            onPress={() => (credits >= 7 ? router.push('/(app)/speaking/matching') : router.push('/(app)/battle/lobby'))}
          />
        </WKCard>

        <View style={styles.summaryRow}>
          <WKCard style={styles.summaryCard}>
            <WKText variant="caption" color={colors.textSecondary}>Başlatma eşiği</WKText>
            <WKText variant="heading2">7 dk</WKText>
          </WKCard>
          <WKCard style={styles.summaryCard}>
            <WKText variant="caption" color={colors.textSecondary}>Seans süresi</WKText>
            <WKText variant="heading2">7 dk</WKText>
          </WKCard>
        </View>

        {recentSessions.length === 0 ? (
          <WKCard>
            <WKText variant="bodySm" color={colors.textSecondary}>
              İlk konuşma oturumun tamamlandığında değerlendirme geçmişi burada görünecek.
            </WKText>
          </WKCard>
        ) : (
          recentSessions.map(session => (
            <WKCard key={session.sessionId} style={styles.sessionCard}>
              <WKText variant="heading2">{session.partnerName} • {session.level}</WKText>
              <WKText variant="bodySm" color={colors.textSecondary}>{session.topic}</WKText>
              <WKText variant="caption" color={colors.textSecondary}>
                {new Date(session.completedAt ?? session.startedAt).toLocaleString('tr-TR')} • XP +{session.xpEarned ?? 0}
              </WKText>
            </WKCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
