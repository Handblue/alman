import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WKText, WKCard } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/colors';

interface GroupLeaderboardProps {
  weeklyXP: Record<string, number>;
  members: string[];
  userDisplayNames?: Record<string, string>;
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = ['👑', '🥈', '🥉'];

export function GroupLeaderboard({ weeklyXP, members, userDisplayNames = {} }: GroupLeaderboardProps) {
  const { colors } = useTheme();

  const ranked = members
    .map(uid => ({ uid, xp: weeklyXP[uid] ?? 0 }))
    .sort((a, b) => b.xp - a.xp);

  if (ranked.length === 0) {
    return (
      <WKCard>
        <WKText style={[styles.empty, { color: colors.textSecondary }]}>
          Henüz hiç XP kazanılmadı
        </WKText>
      </WKCard>
    );
  }

  return (
    <WKCard>
      <WKText style={styles.title}>Bu Hafta Sıralaması</WKText>
      {ranked.map((entry, index) => {
        const isTop3 = index < 3;
        const rankColor = isTop3 ? RANK_COLORS[index] : colors.textSecondary;
        const rankIcon = isTop3 ? RANK_ICONS[index] : `${index + 1}.`;
        const displayName = userDisplayNames[entry.uid] ?? entry.uid.slice(0, 8);

        return (
          <View
            key={entry.uid}
            style={[
              styles.row,
              index === 0 && styles.firstRow,
              { borderBottomColor: colors.card },
            ]}
            accessibilityLabel={`${index + 1}. sıra: ${displayName}, ${entry.xp} XP`}
          >
            <View style={styles.rankContainer}>
              <WKText style={[styles.rank, { color: rankColor }]}>
                {rankIcon}
              </WKText>
            </View>
            <WKText style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </WKText>
            <View style={[styles.xpBadge, { backgroundColor: isTop3 ? rankColor : colors.card }]}>
              <WKText style={[styles.xpText, { color: isTop3 ? '#000' : colors.textSecondary }]}>
                ⚡ {entry.xp}
              </WKText>
            </View>
          </View>
        );
      })}
    </WKCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.s12,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.s8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.s8,
  },
  firstRow: {
    paddingVertical: Spacing.s12,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 14,
  },
  xpBadge: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
