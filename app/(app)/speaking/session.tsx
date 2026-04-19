import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKButton, WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { speakingService } from '@/services/speakingService';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: Spacing.s20, justifyContent: 'center', gap: Spacing.s16 },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: Radius.chip,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    card: { gap: Spacing.s16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  });
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

export default function SpeakingSessionScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const activeSession = speakingService.getActiveSession();
  const [timeLeft, setTimeLeft] = useState(7 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/(app)/speaking/review');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const connectionLabel = useMemo(() => (
    timeLeft > 6 * 60 ? 'STUN/TURN bağlantısı kuruldu' : 'P2P ses akışı stabil'
  ), [timeLeft]);

  if (!activeSession) {
    router.replace('/(app)/speaking/credits');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
        <WKText>←</WKText>
      </Pressable>
      <WKCard style={styles.card}>
        <WKText variant="heading1">{activeSession.partnerName}</WKText>
        <WKText variant="bodySm" color={colors.textSecondary}>{activeSession.topic}</WKText>
        <WKText variant="score" color={Colors.brand.primary}>{formatTime(timeLeft)}</WKText>
        <View style={styles.infoRow}>
          <WKText variant="caption" color={colors.textSecondary}>Seviye {activeSession.level}</WKText>
          <WKText variant="caption" color={Colors.status.success}>{connectionLabel}</WKText>
        </View>
        <WKText variant="bodySm" color={colors.textSecondary}>
          Bu ekran WebRTC P2P akışını basit biçimde simüle eder. Konu kartı ve süre yönetimi hazırdır.
        </WKText>
        <WKButton label="Oturumu Bitir" onPress={() => router.replace('/(app)/speaking/review')} />
      </WKCard>
    </SafeAreaView>
  );
}
