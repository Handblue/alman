import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WKText, WKCard, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useAudioCache } from '@/hooks/useAudioCache';
import { useState, useEffect } from 'react';

interface CacheManagementCardProps {
  onCacheCleared?: () => void;
}

export function CacheManagementCard({ onCacheCleared }: CacheManagementCardProps) {
  const { cacheStats, getCacheSizeInMB, clearCache, clearCacheByPrefix, updateCacheStats } = useAudioCache();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    updateCacheStats();
  }, [updateCacheStats]);

  const handleClearAll = async () => {
    Alert.alert(
      'Önbelleği Temizle',
      `${getCacheSizeInMB()} MB veri silinecek. Emin misin?`,
      [
        { text: 'İptal', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sil',
          onPress: async () => {
            setIsClearing(true);
            const success = await clearCache();
            setIsClearing(false);
            if (success) {
              Alert.alert('Başarılı', 'Önbellek temizlendi');
              onCacheCleared?.();
            } else {
              Alert.alert('Hata', 'Önbellek temizlenemedi');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearTTS = async () => {
    Alert.alert(
      'TTS Önbelleğini Temizle',
      'Text-to-speech sesler silinecek',
      [
        { text: 'İptal', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sil',
          onPress: async () => {
            setIsClearing(true);
            const success = await clearCacheByPrefix('tts');
            setIsClearing(false);
            if (success) {
              await updateCacheStats();
              Alert.alert('Başarılı', 'TTS önbelleği temizlendi');
              onCacheCleared?.();
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearAudio = async () => {
    Alert.alert(
      'Ses Dosyaları Önbelleğini Temizle',
      'İndirilen ses dosyaları silinecek',
      [
        { text: 'İptal', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sil',
          onPress: async () => {
            setIsClearing(true);
            const success = await clearCacheByPrefix('audio');
            setIsClearing(false);
            if (success) {
              await updateCacheStats();
              Alert.alert('Başarılı', 'Ses dosyaları önbelleği temizlendi');
              onCacheCleared?.();
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <WKCard style={styles.container}>
      <View style={styles.header}>
        <WKText variant="bodySm" color={Colors.text.secondary}>
          Ses Önbelleği
        </WKText>
        <WKText variant="bodySm" color={Colors.status.warning}>
          💾 {getCacheSizeInMB()} MB
        </WKText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <WKText variant="caption" color={Colors.text.secondary}>
            Dosya Sayısı
          </WKText>
          <WKText variant="bodySm" style={{ fontWeight: '600', marginTop: Spacing.s4 }}>
            {cacheStats.fileCount}
          </WKText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <WKText variant="caption" color={Colors.text.secondary}>
            Toplam Boyut
          </WKText>
          <WKText variant="bodySm" style={{ fontWeight: '600', marginTop: Spacing.s4 }}>
            {(cacheStats.totalSize / 1024).toFixed(0)} KB
          </WKText>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.clearButton, styles.clearTTS]}
          onPress={handleClearTTS}
          disabled={isClearing}
        >
          <WKText variant="bodySm" color={Colors.text.primaryDark} style={{ fontWeight: '600' }}>
            TTS Temizle
          </WKText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearButton, styles.clearAudio]}
          onPress={handleClearAudio}
          disabled={isClearing}
        >
          <WKText variant="bodySm" color={Colors.text.primaryDark} style={{ fontWeight: '600' }}>
            Ses Temizle
          </WKText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.clearAllButton, isClearing && styles.disabled]}
        onPress={handleClearAll}
        disabled={isClearing}
      >
        <WKText variant="bodySm" color={Colors.text.primaryDark} style={{ fontWeight: '600' }}>
          {isClearing ? 'Temizleniyor...' : 'Tümünü Sil'}
        </WKText>
      </TouchableOpacity>
    </WKCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.s16,
    marginBottom: Spacing.s16,
    backgroundColor: Colors.bg.cardDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.s16,
    paddingBottom: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.primaryDark,
  },
  statItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.bg.primaryDark,
    marginHorizontal: Spacing.s12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.s8,
    marginBottom: Spacing.s12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.s10,
    paddingHorizontal: Spacing.s12,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearTTS: {
    backgroundColor: Colors.accent.orange + '80',
  },
  clearAudio: {
    backgroundColor: Colors.accent.gold + '80',
  },
  clearAllButton: {
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    borderRadius: Radius.button,
    backgroundColor: Colors.status.error + '90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
