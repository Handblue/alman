import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/store/useUserStore';
import { widgetService } from '@/services/widgetService';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: Spacing.s20,
      paddingBottom: Spacing.s32,
      gap: Spacing.s16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.s12,
      marginBottom: Spacing.s8,
    },
    backButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.chip,
      backgroundColor: colors.card,
    },
    sectionTitle: {
      marginBottom: Spacing.s8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.s12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.border.primary : `${Colors.text.secondaryLight}22`,
    },
    lastRow: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    rowMeta: {
      flex: 1,
      marginRight: Spacing.s12,
      gap: Spacing.s4,
    },
    chevron: {
      fontSize: 20,
      color: Colors.text.secondary,
    },
    widgetHero: {
      backgroundColor: isDark ? `${Colors.brand.primary}18` : `${Colors.brand.primary}10`,
      borderWidth: 1,
      borderColor: `${Colors.brand.primary}40`,
    },
    widgetStats: {
      flexDirection: 'row',
      gap: Spacing.s12,
      marginTop: Spacing.s12,
    },
    widgetStat: {
      flex: 1,
      borderRadius: Radius.card,
      padding: Spacing.s12,
      backgroundColor: colors.card,
      gap: Spacing.s4,
    },
  });
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = createStyles(colors, isDark);
  const { selectedLevel } = useUserStore();
  const widgetSnapshot = widgetService.getSnapshot();

  const navItems = [
    {
      label: 'Bildirim Tercihleri',
      description: 'Günlük hatırlatıcı, challenge ve rozet bildirimlerini düzenle.',
      href: '/(app)/notification-preferences',
    },
    {
      label: 'Offline İndirme',
      description: 'İnternetsiz kullanım için içerik paketlerini indir veya kaldır.',
      href: '/(app)/offline-download',
    },
    {
      label: 'İstatistikler',
      description: 'Battle, speaking ve çalışma özetlerini tek ekranda incele.',
      href: '/(app)/statistics',
    },
    {
      label: 'Başarımlar',
      description: 'Tüm rozet ilerlemelerini ve kilitli başarımları görüntüle.',
      href: '/(app)/achievements',
    },
    {
      label: 'Battle Geçmişi',
      description: 'Son maçların skorlarını, ELO değişimlerini ve rakiplerini gör.',
      href: '/(app)/battle/history',
    },
    {
      label: 'Konuşma Merkezi',
      description: 'Konuşma kredilerini yönet ve partner arama akışını başlat.',
      href: '/(app)/speaking/credits',
    },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">Ayarlar</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Seviye: {selectedLevel ?? 'A1'} • Görünüm ve yardımcı özellikler
            </WKText>
          </View>
        </View>

        <WKCard style={styles.widgetHero}>
          <WKText variant="heading2">Widget Hazır</WKText>
          <WKText variant="bodySm" color={colors.textSecondary}>
            Small, medium ve large widget veri anlık görüntüsü oluşturuluyor.
          </WKText>
          <View style={styles.widgetStats}>
            <View style={styles.widgetStat}>
              <WKText variant="caption" color={colors.textSecondary}>Kelime</WKText>
              <WKText variant="body">{widgetSnapshot.wordOfTheDay.german}</WKText>
            </View>
            <View style={styles.widgetStat}>
              <WKText variant="caption" color={colors.textSecondary}>Streak</WKText>
              <WKText variant="body">🔥 {widgetSnapshot.streak}</WKText>
            </View>
            <View style={styles.widgetStat}>
              <WKText variant="caption" color={colors.textSecondary}>Challenge</WKText>
              <WKText variant="body">
                {widgetSnapshot.dailyChallenge.correctCount}/{widgetSnapshot.dailyChallenge.totalCount}
              </WKText>
            </View>
          </View>
        </WKCard>

        <WKCard>
          <WKText variant="heading2" style={styles.sectionTitle}>Görünüm</WKText>
          <View style={[styles.row, styles.lastRow]}>
            <View style={styles.rowMeta}>
              <WKText variant="bodySm">Koyu tema</WKText>
              <WKText variant="caption" color={colors.textSecondary}>
                Tasarım sistemi token’larıyla çalışan açık/koyu görünüm geçişi.
              </WKText>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.text.secondaryLight, true: Colors.brand.primary }}
              thumbColor={Colors.text.primary}
            />
          </View>
        </WKCard>

        <WKCard>
          <WKText variant="heading2" style={styles.sectionTitle}>Kısayollar</WKText>
          {navItems.map((item, index) => (
            <Pressable
              key={item.href}
              style={[styles.row, index === navItems.length - 1 && styles.lastRow]}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.rowMeta}>
                <WKText variant="bodySm">{item.label}</WKText>
                <WKText variant="caption" color={colors.textSecondary}>
                  {item.description}
                </WKText>
              </View>
              <WKText style={styles.chevron}>›</WKText>
            </Pressable>
          ))}
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}
