import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { speakingService } from '@/services/speakingService';
import { useUserStore } from '@/store/useUserStore';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: Spacing.s20, justifyContent: 'center' },
    backButton: {
      position: 'absolute',
      top: Spacing.s32,
      left: Spacing.s20,
      width: 44,
      height: 44,
      borderRadius: Radius.chip,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: { gap: Spacing.s16, alignItems: 'center' },
  });
}

export default function SpeakingMatchingScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const selectedLevel = useUserStore(state => state.selectedLevel) ?? 'A2';
  const [status, setStatus] = useState('Seviye eşleşmesi hazırlanıyor...');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('Partner bulundu, ses odası açılıyor...');
      const session = speakingService.startMatch(selectedLevel);
      setTimeout(() => {
        router.replace('/(app)/speaking/session');
      }, 900);
      return session;
    }, 1600);

    return () => clearTimeout(timer);
  }, [selectedLevel]);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => { speakingService.cancelActiveSession(); router.back(); }} accessibilityRole="button" accessibilityLabel="Geri dön">
        <WKText>←</WKText>
      </Pressable>
      <WKCard style={styles.card}>
        <WKText variant="hero">🎙️</WKText>
        <WKText variant="heading1">Partner aranıyor</WKText>
        <WKText variant="bodySm" color={colors.textSecondary}>
          WebRTC benzeri basit eşleşme simülasyonu: sinyalleme, partner bulma ve oturum başlatma.
        </WKText>
        <WKText variant="body" color={Colors.brand.primary}>{status}</WKText>
      </WKCard>
    </SafeAreaView>
  );
}
