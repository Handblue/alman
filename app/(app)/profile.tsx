import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';

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

export default function ProfileScreen() {
  const { xp, streak, selectedLevel, badges } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;

  const earnedCount = BADGE_DEFS.filter(b => badges.includes(b.id)).length;

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
