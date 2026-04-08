import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useBattleStore } from '@/store/useBattleStore';
import { useUserStore } from '@/store/useUserStore';

export default function BattlelobbyScreen() {
  const router = useRouter();
  const { xp } = useUserStore();
  const { isSearching, searchError, battle, battleId, startSearch, cancelSearch } = useBattleStore();

  // Pulse animation for searching state
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isSearching) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isSearching]);

  // Navigate to VS screen once a 2nd player joins
  useEffect(() => {
    if (!battle) return;
    if ((battle.status === 'countdown' || battle.status === 'question') && battleId) {
      router.replace('/battle/vs');
    }
  }, [battle?.status]);

  const handleFind = () => startSearch(xp);
  const handleCancel = () => {
    cancelSearch();
  };

  return (
    <LinearGradient colors={Colors.gradient.battle as any} style={styles.container}>
      {/* Header */}
      <Pressable onPress={() => { cancelSearch(); router.back(); }} style={styles.back}>
        <WKText style={styles.backText}>← Geri</WKText>
      </Pressable>

      <WKText style={styles.title}>⚔️ WortKampf</WKText>
      <WKText style={styles.subtitle}>5 soruluk hız savaşı — en hızlı doğru cevap kazanır!</WKText>

      {/* Stats card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <WKText style={styles.statValue}>{xp}</WKText>
          <WKText style={styles.statLabel}>XP</WKText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <WKText style={styles.statValue}>⚔️</WKText>
          <WKText style={styles.statLabel}>Savaş Modu</WKText>
        </View>
      </View>

      {/* Main action */}
      {!isSearching ? (
        <Pressable style={styles.findBtn} onPress={handleFind}>
          <WKText style={styles.findBtnText}>Rakip Bul</WKText>
        </Pressable>
      ) : (
        <View style={styles.searchingContainer}>
          <Animated.View style={[styles.searchCircle, { transform: [{ scale: pulse }] }]}>
            <WKText style={styles.searchEmoji}>🔍</WKText>
          </Animated.View>
          <WKText style={styles.searchingText}>Rakip aranıyor…</WKText>
          <WKText style={styles.searchHint}>Kimse bulunamazsa bot gelir (8sn)</WKText>
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <WKText style={styles.cancelText}>İptal</WKText>
          </Pressable>
        </View>
      )}

      {searchError ? (
        <WKText style={styles.errorText}>{searchError}</WKText>
      ) : null}

      {/* How to play */}
      <View style={styles.rules}>
        <WKText style={styles.rulesTitle}>Nasıl Oynanır?</WKText>
        {[
          '🇩🇪 Almanca kelimeyi gör, Türkçesini seç',
          '⚡ 12 saniye içinde cevapla',
          '✅ Doğru cevap = 100 puan',
          '🏆 5 soruda en yüksek puan kazanır',
          '📈 ELO puanın güncellenir',
        ].map((rule, i) => (
          <WKText key={i} style={styles.ruleItem}>{rule}</WKText>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 20,
    padding: 8,
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  findBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderRadius: 32,
    marginTop: 36,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  findBtnText: {
    color: Colors.battle.purple,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchingContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  searchCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchEmoji: {
    fontSize: 36,
  },
  searchingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  searchHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  rules: {
    marginTop: 32,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  rulesTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  ruleItem: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
});
