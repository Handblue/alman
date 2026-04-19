import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKButton, WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { battleHistoryService } from '@/services/battleHistoryService';

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
    card: { gap: Spacing.s8 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  });
}

export default function BattleHistoryScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [version, setVersion] = useState(0);
  const history = battleHistoryService.getHistory();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <WKText variant="heading1">Battle Geçmişi</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Son 50 maç saklanır ve battle sonucu ekranından otomatik yazılır.
            </WKText>
          </View>
        </View>

        {history.length === 0 ? (
          <WKCard>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Henüz battle geçmişi yok. İlk maçını oynadığında burada görünür.
            </WKText>
          </WKCard>
        ) : (
          <>
            {history.map(entry => (
              <WKCard key={entry.id} style={styles.card}>
                <View style={styles.metaRow}>
                  <WKText variant="heading2">
                    {entry.didWin ? '🏆' : entry.isDraw ? '🤝' : '⚔️'} {entry.opponentName}
                  </WKText>
                  <WKText variant="bodySm" color={entry.eloChange >= 0 ? Colors.status.success : Colors.status.error}>
                    {entry.eloChange >= 0 ? '+' : ''}{entry.eloChange} ELO
                  </WKText>
                </View>
                <WKText variant="bodySm" color={colors.textSecondary}>
                  Skor {entry.myScore} - {entry.opponentScore} • XP +{entry.xpEarned} • {entry.questionCount} soru
                </WKText>
                <WKText variant="caption" color={colors.textSecondary}>
                  {new Date(entry.playedAt).toLocaleString('tr-TR')}
                  {entry.opponentIsBot ? ' • Bot rakip' : ''}
                </WKText>
              </WKCard>
            ))}

            <WKButton
              label="Geçmişi Temizle"
              variant="ghost"
              onPress={() => {
                battleHistoryService.clear();
                setVersion(version + 1);
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
