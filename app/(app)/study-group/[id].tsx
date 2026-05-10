import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { WKText, WKCard, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GroupLeaderboard } from '@/components/social/GroupLeaderboard';
import { useStudyGroupStore } from '@/store/useStudyGroupStore';
import { StudyGroup, studyGroupService } from '@/services/studyGroupService';
import { authService } from '@/services/authService';
import type { Unsubscribe } from 'firebase/firestore';

const LEVEL_COLORS: Record<StudyGroup['level'], string> = {
  A1: '#4CAF50',
  A2: '#8BC34A',
  B1: '#FFC107',
  B2: '#FF9800',
  C1: '#F44336',
  mixed: '#00BCD4',
};

export default function StudyGroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leaveGroup, error, clearError } = useStudyGroupStore();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const currentUid = authService.getCurrentUser()?.uid ?? '';
  const isMember = group?.members.includes(currentUid) ?? false;
  const isCreator = group?.creatorUid === currentUid;

  useEffect(() => {
    if (!id) return;

    // Subscribe to realtime updates
    unsubscribeRef.current = studyGroupService.subscribeToGroup(id, updatedGroup => {
      setGroup(updatedGroup);
      setLoading(false);
    });

    // Fallback: load once in case snapshot is slow
    studyGroupService.getGroup(id).then(g => {
      if (g) setGroup(g);
      setLoading(false);
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [id]);

  useEffect(() => {
    if (error) {
      Alert.alert('Hata', error, [{ text: 'Tamam', onPress: clearError }]);
    }
  }, [error]);

  const handleLeave = () => {
    if (!group) return;
    Alert.alert(
      'Gruptan Ayrıl',
      `"${group.name}" grubundan ayrılmak istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            await leaveGroup(group.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `WortKrieg'de "${group.name}" Almanca çalışma grubuna katıl! Davet kodu: ${group.inviteCode}`,
        title: `${group.name} - WortKrieg Çalışma Grubu`,
      });
    } catch {
      // User cancelled share
    }
  };

  if (loading || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <WKText style={styles.loadingText}>Yükleniyor...</WKText>
        </View>
      </SafeAreaView>
    );
  }

  const memberCount = group.members.length;
  const levelColor = LEVEL_COLORS[group.level];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradient.cta as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backButton}
        >
          <WKText style={styles.backText}>← Geri</WKText>
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <View style={styles.headerNameBlock}>
            <WKText style={styles.headerTitle} numberOfLines={1}>
              {group.name}
            </WKText>
            <View style={styles.headerMeta}>
              <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
                <WKText style={styles.levelBadgeText}>{group.level}</WKText>
              </View>
              {group.isPrivate && (
                <WKText style={styles.privateBadge}>🔒 Gizli</WKText>
              )}
              <WKText style={styles.memberCount}>
                👥 {memberCount}/{group.maxMembers}
              </WKText>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel="Grubu paylaş"
          >
            <WKText style={styles.shareBtnText}>Paylaş</WKText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Description */}
          {group.description ? (
            <WKCard style={styles.descCard}>
              <WKText style={styles.descText}>{group.description}</WKText>
            </WKCard>
          ) : null}

          {/* Invite Code */}
          {isMember && (
            <WKCard style={styles.codeCard}>
              <WKText style={styles.codeLabel}>Davet Kodu</WKText>
              <WKText style={styles.codeValue}>{group.inviteCode}</WKText>
              <WKText style={styles.codeHint}>
                Bu kodu arkadaşlarınla paylaşarak gruba davet edebilirsin
              </WKText>
            </WKCard>
          )}

          {/* Leaderboard */}
          <WKText style={styles.sectionTitle}>Bu Hafta Sıralaması</WKText>
          <GroupLeaderboard
            weeklyXP={group.weeklyXP}
            members={group.members}
          />

          {/* Actions */}
          {isMember && !isCreator && (
            <Pressable
              onPress={handleLeave}
              android_ripple={null}
              accessibilityRole="button"
              accessibilityLabel="Gruptan ayrıl"
              style={({ pressed }) => [styles.leaveBtn, { opacity: pressed ? 0.82 : 1 }]}
            >
              <WKText style={styles.leaveBtnText}>Gruptan Ayrıl</WKText>
            </Pressable>
          )}
        </View>
        <View style={{ height: Spacing.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s20,
  },
  backButton: {
    paddingVertical: Spacing.s12,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    color: Colors.text.primaryDark,
    fontSize: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.s12,
  },
  headerNameBlock: {
    flex: 1,
    gap: Spacing.s8,
  },
  headerTitle: {
    color: Colors.text.primaryDark,
    fontSize: 24,
    fontWeight: '800',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  privateBadge: {
    fontSize: 12,
    color: Colors.text.primaryDark,
    opacity: 0.8,
  },
  memberCount: {
    fontSize: 13,
    color: Colors.text.primaryDark,
    opacity: 0.9,
  },
  shareBtn: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: Radius.button,
    backgroundColor: 'rgba(255,255,255,0.25)',
    minHeight: 44,
    justifyContent: 'center',
  },
  shareBtnText: {
    color: Colors.text.primaryDark,
    fontWeight: '600',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.s20,
    gap: Spacing.s16,
  },
  descCard: {
    padding: Spacing.s16,
  },
  descText: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  codeCard: {
    alignItems: 'center',
    gap: Spacing.s8,
    paddingVertical: Spacing.s20,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.brand.primary,
    letterSpacing: 6,
  },
  codeHint: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primaryDark,
  },
  leaveBtn: {
    paddingVertical: Spacing.s16,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.status.error,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    marginTop: Spacing.s16,
  },
  leaveBtnText: {
    color: Colors.status.error,
    fontWeight: '600',
    fontSize: 15,
  },
});
