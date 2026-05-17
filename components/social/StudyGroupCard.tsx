import React from 'react';
import { Pressable, TouchableOpacity, View, StyleSheet } from 'react-native';
import { WKText, WKCard } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/colors';
import { StudyGroup } from '@/services/studyGroupService';

interface StudyGroupCardProps {
  group: StudyGroup;
  isMember: boolean;
  onPress: () => void;
  onJoin?: () => void;
}

const LEVEL_COLORS: Record<StudyGroup['level'], string> = {
  A1: '#4CAF50',
  A2: '#8BC34A',
  B1: '#FFC107',
  B2: '#FF9800',
  C1: '#F44336',
  mixed: '#00BCD4',
};

export function StudyGroupCard({ group, isMember, onPress, onJoin }: StudyGroupCardProps) {
  const { colors } = useTheme();
  const memberCount = group.members.length;
  const topXP = Math.max(...Object.values(group.weeklyXP), 0);
  const levelColor = LEVEL_COLORS[group.level];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${group.name} çalışma grubu, ${memberCount} üye`}
      android_ripple={null}
      style={({ pressed }) => [styles.touchable, { opacity: pressed ? 0.82 : 1 }]}
    >
      <WKCard>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <WKText style={styles.name} numberOfLines={1}>
              {group.name}
            </WKText>
            {group.isPrivate && (
              <WKText style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.textSecondary }]}>
                🔒
              </WKText>
            )}
          </View>
          <View style={[styles.levelChip, { backgroundColor: levelColor }]}>
            <WKText style={styles.levelText}>{group.level}</WKText>
          </View>
        </View>

        {group.description ? (
          <WKText style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {group.description}
          </WKText>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.stats}>
            <WKText style={[styles.statText, { color: colors.textSecondary }]}>
              👥 {memberCount}/{group.maxMembers}
            </WKText>
            {topXP > 0 && (
              <WKText style={[styles.statText, { color: Colors.accent.orange }]}>
                ⚡ {topXP} XP bu hafta
              </WKText>
            )}
          </View>

          {!isMember && onJoin && (
            <TouchableOpacity
              onPress={onJoin}
              style={[styles.joinBtn, { backgroundColor: Colors.brand.primary }]}
              accessibilityRole="button"
              accessibilityLabel={`${group.name} grubuna katıl`}
            >
              <WKText style={styles.joinBtnText}>Katıl</WKText>
            </TouchableOpacity>
          )}

          {isMember && (
            <View style={[styles.memberBadge, { backgroundColor: Colors.status.success }]}>
              <WKText style={styles.memberBadgeText}>✓ Üye</WKText>
            </View>
          )}
        </View>
      </WKCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: Spacing.s12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.s4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chip: {
    fontSize: 12,
    padding: Spacing.s4,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelChip: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: 20,
    marginLeft: Spacing.s8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    marginBottom: Spacing.s8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.s4,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.s12,
    flex: 1,
  },
  statText: {
    fontSize: 13,
  },
  joinBtn: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  memberBadge: {
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
    borderRadius: 20,
  },
  memberBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
