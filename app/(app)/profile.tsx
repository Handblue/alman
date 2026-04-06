import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { CacheManagementCard } from '@/components/profile/CacheManagementCard';
import { NotificationService, NotificationPreferences } from '@/services/notificationService';
import { OfflineQueueService } from '@/services/offlineQueueService';

const BADGE_DEFS = [
  { id: 'first_step',           emoji: '👟', name: 'İlk Adım',           desc: 'İlk üniteyi tamamla',              xp: 50 },
  { id: 'word_hunter_100',      emoji: '🎯', name: 'Kelime Avcısı',       desc: '100 kelime öğren',                 xp: 200 },
  { id: 'folder_master',        emoji: '📁', name: 'Liste Ustası',         desc: '3 klasör oluştur ve paylaş',       xp: 150 },
  { id: 'social_warrior',       emoji: '🤝', name: 'Sosyal Savaşçı',      desc: '5 arkadaş ekle',                   xp: 100 },
  { id: 'challenge_champion',   emoji: '🏆', name: 'Challenge Şampiyonu', desc: '7 gün üst üste Meydan Okuma',      xp: 400 },
  { id: 'week_warrior',         emoji: '🔥', name: 'Hafta Savaşçısı',     desc: '7 gün ard arda giriş',             xp: 300 },
  { id: 'battle_master',        emoji: '⚔️', name: 'Battle Master',       desc: '10 battle kazan',                  xp: 500 },
  { id: 'pronunciation_master', emoji: '🎙️', name: 'Telaffuz Ustası',     desc: '50 kelime 4+ yıldız telaffuz',     xp: 350 },
  { id: 'polyglot',             emoji: '🌍', name: 'Poliglot',             desc: 'Tüm A1 ünitelerini tamamla',       xp: 1000 },
  { id: 'legend',               emoji: '👑', name: 'Efsane',               desc: 'Tüm kategoriler tamamlandı',       xp: 5000 },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 0–23

export default function ProfileScreen() {
  const { xp, streak, selectedLevel, badges } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;

  const earnedCount = BADGE_DEFS.filter(b => badges.includes(b.id)).length;

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    () => NotificationService.getInstance().getPreferences()
  );
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    NotificationService.getInstance()
      .requestPermissions()
      .then(setPermissionGranted)
      .catch(() => setPermissionGranted(false));
    setQueueSize(OfflineQueueService.getInstance().getStats().total);
  }, []);

  const updatePref = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    await NotificationService.getInstance().savePreferences(updated);
  };

  // Build rows of 2 for the badge grid
  const badgeRows: (typeof BADGE_DEFS)[] = [];
  for (let i = 0; i < BADGE_DEFS.length; i += 2) {
    badgeRows.push(BADGE_DEFS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <WKText style={{ fontSize: 48 }} accessibilityLabel="Kullanıcı avatarı">🧑‍💻</WKText>
          <WKText variant="heading1">Savaşçı</WKText>
          <WKText variant="body" color={Colors.brand.primary}>{selectedLevel ?? 'A1'} Seviyesi</WKText>
        </View>

        {/* Stats */}
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

        {/* Cache Management */}
        <CacheManagementCard />

        {/* Notification Settings */}
        <WKCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <WKText variant="heading2">🔔 Bildirimler</WKText>
            {permissionGranted === false && (
              <View style={styles.warnBadge}>
                <WKText variant="caption" color={Colors.status.warning}>İzin Gerekli</WKText>
              </View>
            )}
          </View>

          {permissionGranted === false && (
            <WKText variant="caption" color={Colors.status.warning} style={{ marginBottom: Spacing.s12 }}>
              Bildirimler için cihaz ayarlarından izin ver.
            </WKText>
          )}

          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <WKText variant="bodySm">Günlük Hatırlatıcı</WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                Her gün çalışmayı hatırlat
              </WKText>
            </View>
            <Switch
              value={notifPrefs.dailyReminder}
              onValueChange={(v) => updatePref('dailyReminder', v)}
              trackColor={{ false: Colors.bg.cardDark, true: Colors.brand.primary }}
              thumbColor="#fff"
            />
          </View>

          {notifPrefs.dailyReminder && (
            <View style={styles.timeRow}>
              <WKText variant="caption" color={Colors.text.secondary}>Saat:</WKText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: Spacing.s8 }}>
                <View style={styles.hourList}>
                  {[8, 9, 10, 12, 14, 18, 19, 20, 21, 22].map((h) => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => updatePref('reminderHour', h)}
                      style={[
                        styles.hourChip,
                        notifPrefs.reminderHour === h && styles.hourChipActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Saat ${h}:00`}
                    >
                      <WKText
                        variant="caption"
                        color={notifPrefs.reminderHour === h ? Colors.brand.primary : Colors.text.secondary}
                      >
                        {String(h).padStart(2, '0')}:00
                      </WKText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={[styles.prefRow, { marginTop: Spacing.s8 }]}>
            <View style={{ flex: 1 }}>
              <WKText variant="bodySm">Seri Uyarısı</WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                Serin tehlikedeyse bildir
              </WKText>
            </View>
            <Switch
              value={notifPrefs.streakAlert}
              onValueChange={(v) => updatePref('streakAlert', v)}
              trackColor={{ false: Colors.bg.cardDark, true: Colors.brand.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.prefRow, { marginTop: Spacing.s8 }]}>
            <View style={{ flex: 1 }}>
              <WKText variant="bodySm">Challenge Bildirimleri</WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                Challenge tamamlandığında bildir
              </WKText>
            </View>
            <Switch
              value={notifPrefs.challengeUpdates}
              onValueChange={(v) => updatePref('challengeUpdates', v)}
              trackColor={{ false: Colors.bg.cardDark, true: Colors.brand.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.prefRow, { marginTop: Spacing.s8 }]}>
            <View style={{ flex: 1 }}>
              <WKText variant="bodySm">Rozet Bildirimleri</WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                Yeni rozet kazanıldığında bildir
              </WKText>
            </View>
            <Switch
              value={notifPrefs.badgeAlerts}
              onValueChange={(v) => updatePref('badgeAlerts', v)}
              trackColor={{ false: Colors.bg.cardDark, true: Colors.brand.primary }}
              thumbColor="#fff"
            />
          </View>
        </WKCard>

        {/* Offline Queue Status */}
        {queueSize > 0 && (
          <WKCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <WKText variant="heading2">📶 Çevrimdışı Kuyruk</WKText>
              <View style={styles.queueBadge}>
                <WKText variant="caption" color={Colors.status.warning}>{queueSize}</WKText>
              </View>
            </View>
            <WKText variant="caption" color={Colors.text.secondary}>
              {queueSize} işlem internet bağlantısı bekleniyor. Bağlandığında otomatik eşitlenecek.
            </WKText>
          </WKCard>
        )}

        {/* Achievements section */}
        <View style={styles.badgesSection}>
          <WKText variant="heading2">Başarımlar 🏅</WKText>
          <WKText variant="bodySm" color={Colors.text.secondary} style={styles.badgeSub}>
            {earnedCount}/{BADGE_DEFS.length} rozet kazanıldı
          </WKText>

          {badgeRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.badgeRow}>
              {row.map((badge) => {
                const earned = badges.includes(badge.id);
                return (
                  <WKCard
                    key={badge.id}
                    style={styles.badgeCard}
                    accessibilityLabel={`${badge.name}: ${badge.desc}`}
                  >
                    {/* Emoji */}
                    <View style={styles.emojiContainer}>
                      <WKText
                        style={[
                          styles.badgeEmoji,
                          !earned && styles.lockedEmoji,
                        ]}
                      >
                        {badge.emoji}
                      </WKText>
                      {!earned && (
                        <WKText style={styles.lockOverlay}>🔒</WKText>
                      )}
                    </View>

                    {/* Name */}
                    <WKText
                      variant="caption"
                      style={styles.badgeName}
                      color={earned ? undefined : Colors.text.secondary}
                      numberOfLines={1}
                    >
                      {badge.name}
                    </WKText>

                    {/* Desc */}
                    <WKText
                      variant="bodySm"
                      color={Colors.text.secondary}
                      style={[styles.badgeDesc, !earned && styles.lockedDesc]}
                      numberOfLines={2}
                    >
                      {badge.desc}
                    </WKText>

                    {/* XP chip */}
                    <WKText
                      variant="caption"
                      color={earned ? Colors.accent.gold : Colors.text.secondary}
                      style={styles.badgeXp}
                    >
                      +{badge.xp} XP
                    </WKText>
                  </WKCard>
                );
              })}
              {/* Fill empty slot if last row has only 1 badge */}
              {row.length === 1 && <View style={styles.badgeCardPlaceholder} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
  },
  scrollContent: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s32,
    paddingBottom: Spacing.s32,
  },
  avatar: {
    alignItems: 'center',
    marginBottom: Spacing.s32,
    gap: Spacing.s8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginBottom: Spacing.s12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.s4,
    padding: Spacing.s20,
  },

  // Notification / queue cards
  sectionCard: {
    marginBottom: Spacing.s12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s12,
  },
  warnBadge: {
    backgroundColor: Colors.status.warning + '22',
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.status.warning,
  },
  queueBadge: {
    backgroundColor: Colors.status.warning + '22',
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.s8,
    marginBottom: Spacing.s4,
  },
  hourList: {
    flexDirection: 'row',
    gap: Spacing.s4,
  },
  hourChip: {
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
    backgroundColor: Colors.bg.primaryDark,
    borderWidth: 1,
    borderColor: Colors.bg.cardDark,
  },
  hourChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '22',
  },

  // Badges section
  badgesSection: {
    marginTop: Spacing.s24,
  },
  badgeSub: {
    marginTop: Spacing.s4,
    marginBottom: Spacing.s16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginBottom: Spacing.s12,
  },
  badgeCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.s16,
    gap: Spacing.s8,
    borderRadius: 16,
  },
  badgeCardPlaceholder: {
    flex: 1,
  },

  // Emoji area
  emojiContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  badgeEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  lockedEmoji: {
    opacity: 0.35,
  },
  lockOverlay: {
    position: 'absolute',
    fontSize: 14,
    bottom: 0,
    right: 0,
  },

  // Text
  badgeName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDesc: {
    textAlign: 'center',
  },
  lockedDesc: {
    opacity: 0.6,
  },
  badgeXp: {
    textAlign: 'center',
  },
});
