import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKCard, WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { NotificationPreferences, NotificationService } from '@/services/notificationService';

function createStyles(colors: { bg: string; card: string; textPrimary: string; textSecondary: string }) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: Spacing.s20, paddingBottom: Spacing.s32, gap: Spacing.s16 },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: Radius.chip,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s12 },
    prefRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.s12,
      paddingVertical: Spacing.s12,
    },
    prefMeta: { flex: 1, gap: Spacing.s4 },
    hourRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s8, marginTop: Spacing.s12 },
    hourChip: {
      minWidth: 68,
      minHeight: 44,
      borderRadius: Radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border.primary,
      backgroundColor: colors.card,
      paddingHorizontal: Spacing.s12,
    },
    hourChipActive: {
      borderColor: Colors.brand.primary,
      backgroundColor: `${Colors.brand.primary}18`,
    },
  });
}

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => NotificationService.getInstance().getPreferences());
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    NotificationService.getInstance().requestPermissions().then(setPermissionGranted).catch(() => setPermissionGranted(false));
  }, []);

  const updatePref = async <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    const nextValue = { ...prefs, [key]: value };
    setPrefs(nextValue);
    await NotificationService.getInstance().savePreferences(nextValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Geri dön">
            <WKText>←</WKText>
          </Pressable>
          <View>
            <WKText variant="heading1">Bildirim Tercihleri</WKText>
            <WKText variant="bodySm" color={colors.textSecondary}>
              Günlük ritmine göre akıllı hatırlatıcıları yapılandır.
            </WKText>
          </View>
        </View>

        <WKCard>
          <WKText variant="heading2">Bildirim Durumu</WKText>
          <WKText variant="bodySm" color={permissionGranted ? Colors.status.success : Colors.status.warning} style={{ marginTop: Spacing.s8 }}>
            {permissionGranted ? 'İzin verildi' : 'Cihaz izni gerekiyor'}
          </WKText>
        </WKCard>

        <WKCard>
          <View style={styles.prefRow}>
            <View style={styles.prefMeta}>
              <WKText variant="bodySm">Günlük hatırlatıcı</WKText>
              <WKText variant="caption" color={colors.textSecondary}>
                Her gün seçtiğin saatte çalışma hatırlatması gönder.
              </WKText>
            </View>
            <Switch
              value={prefs.dailyReminder}
              onValueChange={(value) => updatePref('dailyReminder', value)}
              trackColor={{ false: Colors.text.secondaryLight, true: Colors.brand.primary }}
              thumbColor={Colors.text.primaryDark}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefMeta}>
              <WKText variant="bodySm">Seri uyarısı</WKText>
              <WKText variant="caption" color={colors.textSecondary}>
                Akşam saatlerinde streak risk altına girerse uyar.
              </WKText>
            </View>
            <Switch
              value={prefs.streakAlert}
              onValueChange={(value) => updatePref('streakAlert', value)}
              trackColor={{ false: Colors.text.secondaryLight, true: Colors.brand.primary }}
              thumbColor={Colors.text.primaryDark}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefMeta}>
              <WKText variant="bodySm">Challenge bildirimi</WKText>
              <WKText variant="caption" color={colors.textSecondary}>
                Günlük challenge tamamlandığında sonuç bildirimi göster.
              </WKText>
            </View>
            <Switch
              value={prefs.challengeUpdates}
              onValueChange={(value) => updatePref('challengeUpdates', value)}
              trackColor={{ false: Colors.text.secondaryLight, true: Colors.brand.primary }}
              thumbColor={Colors.text.primaryDark}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefMeta}>
              <WKText variant="bodySm">Başarım bildirimi</WKText>
              <WKText variant="caption" color={colors.textSecondary}>
                Yeni rozet açıldığında anlık bildirim gönder.
              </WKText>
            </View>
            <Switch
              value={prefs.badgeAlerts}
              onValueChange={(value) => updatePref('badgeAlerts', value)}
              trackColor={{ false: Colors.text.secondaryLight, true: Colors.brand.primary }}
              thumbColor={Colors.text.primaryDark}
            />
          </View>
        </WKCard>

        {prefs.dailyReminder && (
          <WKCard>
            <WKText variant="heading2">Hatırlatma Saati</WKText>
            <View style={styles.hourRow}>
              {[8, 9, 12, 18, 19, 20, 21, 22].map(hour => (
                <Pressable
                  key={hour}
                  style={[styles.hourChip, prefs.reminderHour === hour && styles.hourChipActive]}
                  onPress={() => updatePref('reminderHour', hour)}
                  accessibilityRole="button"
                  accessibilityLabel={`Saat ${hour}:00`}
                >
                  <WKText variant="caption" color={prefs.reminderHour === hour ? Colors.brand.primary : colors.textSecondary}>
                    {String(hour).padStart(2, '0')}:00
                  </WKText>
                </Pressable>
              ))}
            </View>
          </WKCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
