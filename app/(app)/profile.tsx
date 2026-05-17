import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WKText, WKCard, Avatar } from '@/components/ui';
import { authService } from '@/services/authService';
import { Flame, Swords, BarChart2, Lock } from '@/constants/icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSocialStore } from '@/store/useSocialStore';
import { CacheManagementCard } from '@/components/profile/CacheManagementCard';
import { NotificationService, NotificationPreferences } from '@/services/notificationService';
import { OfflineQueueService } from '@/services/offlineQueueService';
import { achievementService, ACHIEVEMENT_DEFS } from '@/services/achievementService';
import { createStorage } from '@/utils/storage';

const premiumStorage = createStorage('premium');

// Use centralized ACHIEVEMENT_DEFS from achievementService
const BADGE_DEFS = ACHIEVEMENT_DEFS.map(a => ({
  id: a.id, emoji: a.emoji, name: a.name, desc: a.desc, xp: a.xpReward,
}));

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 0–23

export default function ProfileScreen() {
  const { xp, streak, selectedLevel, badges } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const { friends } = useSocialStore();
  const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;
  const isPremium = premiumStorage.getBoolean('isPremium') ?? false;

  const battleStats = achievementService.getBattleStats();
  const pronStats = achievementService.getPronunciationStats();

  const achievementCtx = {
    xp, streak, knownWords, completedUnits,
    battleWins: battleStats.wins,
    battleCount: battleStats.total,
    pronunciationFourPlus: pronStats.fourPlus,
    folders: 0,
    friends: friends.length,
  };

  const earnedIds = new Set([...badges, ...achievementService.getEarned()]);
  const earnedCount = BADGE_DEFS.filter(b => earnedIds.has(b.id)).length;

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
          <Avatar
            name={authService.getCurrentUser()?.displayName ?? 'Savaşçı'}
            size={80}
            imageUri={authService.getCurrentUser()?.avatar ?? undefined}
          />
          <WKText variant="heading1">
            {authService.getCurrentUser()?.displayName ?? 'Savaşçı'}
          </WKText>
          <View style={styles.levelRow}>
            <WKText variant="body" color={Colors.brand.primary}>{selectedLevel ?? 'A1'} Seviyesi</WKText>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <WKText style={styles.premiumBadgeText}>👑 Premium</WKText>
              </View>
            )}
          </View>
        </View>

        {/* Premium CTA */}
        {!isPremium && (
          <Pressable style={styles.premiumCta} onPress={() => router.push('/(app)/premium')}>
            <WKText style={styles.premiumCtaText}>👑 Premium'a Geç — Tüm özellikleri aç →</WKText>
          </Pressable>
        )}

        {/* Battle Stats */}
        <WKCard style={styles.battleCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.s12 }}>
            <Swords size={18} color={Colors.battle.purple} />
            <WKText variant="heading2">Battle İstatistikleri</WKText>
          </View>
          <View style={styles.battleRow}>
            <View style={styles.battleStat}>
              <WKText style={[styles.battleNum, { color: Colors.battle.purple }]}>{battleStats.elo}</WKText>
              <WKText style={styles.battleLbl}>ELO</WKText>
            </View>
            <View style={styles.battleDivider} />
            <View style={styles.battleStat}>
              <WKText style={[styles.battleNum, { color: Colors.accent.gold }]}>{battleStats.wins}</WKText>
              <WKText style={styles.battleLbl}>Galibiyet</WKText>
            </View>
            <View style={styles.battleDivider} />
            <View style={styles.battleStat}>
              <WKText style={[styles.battleNum, { color: Colors.text.secondary }]}>{battleStats.total}</WKText>
              <WKText style={styles.battleLbl}>Toplam</WKText>
            </View>
            <View style={styles.battleDivider} />
            <View style={styles.battleStat}>
              <WKText style={[styles.battleNum, { color: Colors.status.success }]}>
                {battleStats.total > 0 ? Math.round((battleStats.wins / battleStats.total) * 100) : 0}%
              </WKText>
              <WKText style={styles.battleLbl}>Kazanma</WKText>
            </View>
          </View>
          <Pressable style={styles.battlePlayBtn} onPress={() => router.push('/(app)/battle/lobby')}>
            <WKText style={styles.battlePlayText}>Savaşa Git →</WKText>
          </Pressable>
        </WKCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <WKCard style={styles.statCard}>
            <WKText variant="score" color={Colors.accent.orange}>{xp}</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>Toplam XP</WKText>
          </WKCard>
          <WKCard style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flame size={18} color={Colors.accent.orange} />
              <WKText variant="score" color={Colors.status.warning}>{streak}</WKText>
            </View>
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

        <WKCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <WKText variant="heading2">Hızlı Erişim</WKText>
          </View>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(app)/settings')}>
            <WKText variant="bodySm">⚙️ Ayarlar</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>Görünüm, widget ve sistem kısayolları</WKText>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(app)/statistics')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={15} color={Colors.text.secondary} />
              <WKText variant="bodySm">İstatistikler</WKText>
            </View>
            <WKText variant="caption" color={Colors.text.secondary}>Öğrenme, battle ve speaking özetleri</WKText>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(app)/achievements')}>
            <WKText variant="bodySm">🏅 Başarımlar</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>Rozet ilerlemeleri ve eksik hedefler</WKText>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(app)/battle/history')}>
            <WKText variant="bodySm">🧾 Battle Geçmişi</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>Maç kayıtları ve ELO değişimleri</WKText>
          </Pressable>
          <Pressable style={[styles.quickLink, styles.quickLinkLast]} onPress={() => router.push('/(app)/speaking/credits')}>
            <WKText variant="bodySm">🎙️ Konuşma Merkezi</WKText>
            <WKText variant="caption" color={Colors.text.secondary}>Kredi, partner eşleşme ve değerlendirme</WKText>
          </Pressable>
        </WKCard>

        {/* Achievements section */}
        <View style={styles.badgesSection}>
          <WKText variant="heading2">Başarımlar 🏅</WKText>
          <WKText variant="bodySm" color={Colors.text.secondary} style={styles.badgeSub}>
            {earnedCount}/{BADGE_DEFS.length} rozet kazanıldı
          </WKText>

          {badgeRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.badgeRow}>
              {row.map((badge) => {
                const earned = earnedIds.has(badge.id);
                const progress = achievementService.getProgress(badge.id, achievementCtx);
                const pct = Math.round(progress * 100);
                return (
                  <WKCard
                    key={badge.id}
                    style={[styles.badgeCard, earned && styles.badgeCardEarned]}
                    accessibilityLabel={`${badge.name}: ${badge.desc}`}
                  >
                    {/* Emoji */}
                    <View style={styles.emojiContainer}>
                      <WKText style={[styles.badgeEmoji, !earned && styles.lockedEmoji]}>
                        {badge.emoji}
                      </WKText>
                      {!earned && <Lock size={16} color="rgba(255,255,255,0.7)" style={styles.lockOverlay} />}
                    </View>

                    <WKText
                      variant="caption"
                      style={styles.badgeName}
                      color={earned ? undefined : Colors.text.secondary}
                      numberOfLines={1}
                    >
                      {badge.name}
                    </WKText>

                    <WKText
                      variant="bodySm"
                      color={Colors.text.secondary}
                      style={[styles.badgeDesc, !earned && styles.lockedDesc]}
                      numberOfLines={2}
                    >
                      {badge.desc}
                    </WKText>

                    {/* Progress bar (only when not earned) */}
                    {!earned && pct > 0 && (
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
                      </View>
                    )}

                    <WKText
                      variant="caption"
                      color={earned ? Colors.accent.gold : Colors.text.secondary}
                      style={styles.badgeXp}
                    >
                      {earned ? `+${badge.xp} XP ✓` : `${pct}% • +${badge.xp} XP`}
                    </WKText>
                  </WKCard>
                );
              })}
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
    marginBottom: Spacing.s16,
    gap: Spacing.s8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: Colors.accent.gold + '22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.accent.gold,
  },
  premiumBadgeText: {
    color: Colors.accent.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  premiumCta: {
    backgroundColor: Colors.accent.gold + '22',
    borderRadius: 14,
    padding: 14,
    marginBottom: Spacing.s16,
    borderWidth: 1,
    borderColor: Colors.accent.gold + '66',
    alignItems: 'center',
  },
  premiumCtaText: {
    color: Colors.accent.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  battleCard: {
    marginBottom: Spacing.s12,
  },
  battleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  battleStat: {
    alignItems: 'center',
    gap: 4,
  },
  battleNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  battleLbl: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
  battleDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.bg.primaryDark,
  },
  battlePlayBtn: {
    marginTop: Spacing.s12,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.battle.purple + '22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.battle.purple + '66',
  },
  battlePlayText: {
    color: Colors.battle.purple,
    fontWeight: '700',
    fontSize: 13,
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
  quickLink: {
    paddingVertical: Spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.primaryDark,
    gap: Spacing.s4,
  },
  quickLinkLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
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
  badgeCardEarned: {
    borderWidth: 1,
    borderColor: Colors.accent.gold + '55',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.bg.primaryDark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: 2,
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
