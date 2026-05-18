import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKButton, WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { offlineContentService } from '@/services/offlineContentService';
import { authService } from '@/services/authService';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: Spacing.s20, paddingBottom: Spacing.s32, gap: Spacing.s16 },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: Radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s12 },
    summaryRow: { flexDirection: 'row', gap: Spacing.s12 },
    summaryCard: { flex: 1, gap: Spacing.s4 },
    packRow: { gap: Spacing.s12 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    premiumBadge: {
      alignSelf: 'flex-start',
      borderRadius: Radius.chip,
      paddingHorizontal: Spacing.s8,
      paddingVertical: Spacing.s4,
      backgroundColor: isDark ? `${Colors.accent.gold}22` : `${Colors.accent.gold}18`,
    },
  });
}

export default function OfflineDownloadScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [downloadsVersion, setDownloadsVersion] = useState(0);
  const [busyPackId, setBusyPackId] = useState<string | null>(null);
  const isPremium = authService.isPremium();

  const stats = useMemo(() => offlineContentService.getStats(), [downloadsVersion]);
  const downloadedIds = useMemo(
    () => new Set(offlineContentService.getDownloadedPacks().map(pack => pack.id)),
    [downloadsVersion]
  );
  const packs = offlineContentService.getAvailablePacks();

  const refresh = () => setDownloadsVersion(value => value + 1);

  const handleDownload = async (packId: string) => {
    setBusyPackId(packId);
    try {
      await offlineContentService.downloadPack(packId);
      refresh();
    } finally {
      setBusyPackId(null);
    }
  };

  const handleRemove = (packId: string) => {
    offlineContentService.removePack(packId);
    refresh();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">Offline İndirme</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Basit paket indirme mantığı MMKV üzerinde kalıcı olarak hazır.
            </WKText>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <WKCard style={styles.summaryCard}>
            <WKText variant="caption" color={colors.textSecondary}>İndirilen paket</WKText>
            <WKText variant="heading2">{stats.totalPacks}</WKText>
          </WKCard>
          <WKCard style={styles.summaryCard}>
            <WKText variant="caption" color={colors.textSecondary}>Toplam kelime</WKText>
            <WKText variant="heading2">{stats.totalWords}</WKText>
          </WKCard>
          <WKCard style={styles.summaryCard}>
            <WKText variant="caption" color={colors.textSecondary}>Tahmini alan</WKText>
            <WKText variant="heading2">{stats.usedMB} MB</WKText>
          </WKCard>
        </View>

        {packs.map(pack => {
          const downloaded = downloadedIds.has(pack.id);
          const locked = pack.premium && !isPremium;

          return (
            <WKCard key={pack.id} style={styles.packRow}>
              <View style={styles.metaRow}>
                <View style={{ flex: 1, gap: Spacing.s4 }}>
                  <WKText variant="heading2">{pack.title}</WKText>
                  <WKText variant="bodySm" color={colors.textSecondary}>{pack.description}</WKText>
                </View>
                <WKText variant="bodySm" color={Colors.brand.primary}>{pack.estimatedSizeMB} MB</WKText>
              </View>

              {pack.premium && (
                <View style={styles.premiumBadge}>
                  <WKText variant="caption" color={Colors.accent.gold}>
                    {locked ? 'Premium gerekli' : 'Premium içerik'}
                  </WKText>
                </View>
              )}

              <View style={styles.metaRow}>
                <WKText variant="caption" color={colors.textSecondary}>
                  {pack.itemCount} kelime
                </WKText>
                {downloaded && (
                  <WKText variant="caption" color={Colors.status.success}>Cihaza indirildi</WKText>
                )}
              </View>

              {downloaded ? (
                <WKButton label="İndirilen Paketi Kaldır" variant="ghost" onPress={() => handleRemove(pack.id)} />
              ) : (
                <WKButton
                  label={busyPackId === pack.id ? 'İndiriliyor...' : locked ? 'Premium ile Aç' : 'Paketi İndir'}
                  onPress={() => (locked ? router.push('/(app)/premium') : handleDownload(pack.id))}
                  disabled={busyPackId === pack.id}
                />
              )}
            </WKCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
