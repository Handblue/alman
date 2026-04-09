import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKButton, WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { speakingService } from '@/services/speakingService';
import { useUserStore } from '@/store/useUserStore';

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
    starsRow: { flexDirection: 'row', gap: Spacing.s12, marginTop: Spacing.s12 },
    star: {
      width: 52,
      height: 52,
      borderRadius: Radius.avatar,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? Colors.border.primary : `${Colors.text.secondaryLight}22`,
      backgroundColor: colors.card,
    },
    starActive: {
      borderColor: Colors.accent.gold,
      backgroundColor: `${Colors.accent.gold}22`,
    },
    input: {
      minHeight: 120,
      borderRadius: Radius.input,
      borderWidth: 1,
      borderColor: isDark ? Colors.border.primary : `${Colors.text.secondaryLight}22`,
      backgroundColor: colors.card,
      color: colors.textPrimary,
      padding: Spacing.s12,
      textAlignVertical: 'top',
    },
  });
}

export default function SpeakingReviewScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const addXP = useUserStore(state => state.addXP);
  const [selfRating, setSelfRating] = useState(4);
  const [partnerRating, setPartnerRating] = useState(4);
  const [notes, setNotes] = useState('');

  const submit = () => {
    speakingService.completeSession({ selfRating, partnerRating, notes });
    addXP(300);
    router.replace('/(app)/speaking/credits');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">Konuşma Değerlendirmesi</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Karşılıklı puanlama tamamlandığında +300 XP verilir.
            </WKText>
          </View>
        </View>

        <WKCard>
          <WKText variant="heading2">Kendi performansın</WKText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable
                key={`self-${star}`}
                style={[styles.star, selfRating === star && styles.starActive]}
                onPress={() => setSelfRating(star)}
                accessibilityRole="button"
                accessibilityLabel={`Kendine ${star} yıldız ver`}
              >
                <WKText>{star}★</WKText>
              </Pressable>
            ))}
          </View>
        </WKCard>

        <WKCard>
          <WKText variant="heading2">Partner değerlendirmesi</WKText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable
                key={`partner-${star}`}
                style={[styles.star, partnerRating === star && styles.starActive]}
                onPress={() => setPartnerRating(star)}
                accessibilityRole="button"
                accessibilityLabel={`Partnere ${star} yıldız ver`}
              >
                <WKText>{star}★</WKText>
              </Pressable>
            ))}
          </View>
        </WKCard>

        <WKCard>
          <WKText variant="heading2">Kısa not</WKText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Hangi kelimelerde zorlandın, hangi konu iyiydi?"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={styles.input}
            accessibilityLabel="Konuşma notu"
          />
        </WKCard>

        <WKButton label="Değerlendirmeyi Tamamla" onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}
