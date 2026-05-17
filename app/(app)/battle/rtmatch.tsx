import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useRealtimeBattleStore } from '@/store/useRealtimeBattleStore';

export default function RTMatchScreen() {
  const router = useRouter();
  const { phase, opponentName, error, findMatch, cancelSearch, reset } = useRealtimeBattleStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    findMatch();
    return () => {
      // Don't reset on unmount if playing — let the game screen take over
    };
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      router.replace('/(app)/battle/rtquestion');
    }
    if (phase === 'error' && error) {
      Alert.alert('Bağlantı Hatası', error, [
        { text: 'Tamam', onPress: () => { reset(); router.back(); } },
      ]);
    }
  }, [phase, error]);

  // Pulse animation for searching state
  useEffect(() => {
    if (phase !== 'searching') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  const handleCancel = () => {
    cancelSearch();
    reset();
    router.back();
  };

  const statusLabel =
    phase === 'connecting' ? 'Sunucuya bağlanılıyor...' :
    phase === 'searching'  ? 'Rakip aranıyor...' :
    phase === 'playing'    ? `${opponentName} bulundu! Başlıyor...` :
    'Bekleniyor...';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradient.battle as any} style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.cancelBtn}>
          <WKText style={styles.cancelText}>✕ İptal</WKText>
        </Pressable>
        <WKText style={styles.headerTitle}>⚡ Canlı Battle</WKText>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
          <WKText style={styles.orbIcon}>⚔️</WKText>
        </Animated.View>

        <WKText style={styles.statusText}>{statusLabel}</WKText>

        {phase === 'searching' && (
          <WKText style={styles.subText}>
            Aynı seviyede bir rakip aranıyor.{'\n'}Bu birkaç saniye sürebilir.
          </WKText>
        )}

        {phase === 'playing' && (
          <WKText style={[styles.subText, { color: Colors.status.success }]}>
            {opponentName} bulundu! Hazırlanıyor...
          </WKText>
        )}

        <Pressable style={styles.cancelBtnBottom} onPress={handleCancel}>
          <WKText style={styles.cancelBtnText}>Aramayı İptal Et</WKText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark },

  header: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: Spacing.s20,
    gap: 6,
  },
  cancelBtn: { paddingVertical: 4 },
  cancelText: { color: 'rgba(255,255,255,0.75)', fontSize: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: Spacing.s20,
  },

  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.battle.purple + '33',
    borderWidth: 2,
    borderColor: Colors.battle.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbIcon: { fontSize: 48 },

  statusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  cancelBtnBottom: {
    marginTop: 16,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cancelBtnText: { color: Colors.text.secondary, fontWeight: '600', fontSize: 15 },
});
