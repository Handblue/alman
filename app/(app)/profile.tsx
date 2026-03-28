import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';

export default function ProfileScreen() {
  const { xp, streak, selectedLevel } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.avatar}>
        <WKText style={{ fontSize: 48 }} accessibilityLabel="Kullanıcı avatarı">🧑‍💻</WKText>
        <WKText variant="heading1">Savaşçı</WKText>
        <WKText variant="body" color={Colors.brand.primary}>{selectedLevel ?? 'A1'} Seviyesi</WKText>
      </View>

      <View style={styles.statsRow}>
        <WKCard style={styles.statCard}>
          <WKText variant="score" color={Colors.accent.orange}>{xp}</WKText>
          <WKText variant="caption" color={Colors.text.secondary}>Toplam XP</WKText>
        </WKCard>
        <WKCard style={styles.statCard}>
          <WKText variant="score" color={Colors.status.warning}>🔥 {streak}</WKText>
          <WKText variant="caption" color={Colors.text.secondary}>Gün Serisi</WKText>
        </WKCard>
      </View>

      <View style={styles.statsRow}>
        <WKCard style={styles.statCard}>
          <WKText variant="score" color={Colors.status.success}>{knownWords}</WKText>
          <WKText variant="caption" color={Colors.text.secondary}>Öğrenilen Kelime</WKText>
        </WKCard>
        <WKCard style={styles.statCard}>
          <WKText variant="score" color={Colors.brand.primary}>{completedUnits}</WKText>
          <WKText variant="caption" color={Colors.text.secondary}>Tamamlanan Ünite</WKText>
        </WKCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark, paddingHorizontal: Spacing.s20, paddingTop: Spacing.s32 },
  avatar: { alignItems: 'center', marginBottom: Spacing.s32, gap: Spacing.s8 },
  statsRow: { flexDirection: 'row', gap: Spacing.s12, marginBottom: Spacing.s12 },
  statCard: { flex: 1, alignItems: 'center', gap: Spacing.s4, padding: Spacing.s20 },
});
