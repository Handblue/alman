import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { WKChip } from '@/components/ui/WKChip';
import { WKText } from '@/components/ui/WKText';

export interface PremiumBadgeProps {
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const mediumBackgroundColor = `${Colors.accent.gold}33`;

export function PremiumBadge({
  size = 'medium',
  style,
}: Readonly<PremiumBadgeProps>) {
  if (size === 'small') {
    return (
      <View
        accessible
        accessibilityLabel="Premium üye"
        accessibilityRole="text"
        style={[styles.smallBadge, styles.glow, style]}
      >
        <WKText color={Colors.accent.gold} style={styles.smallText}>
          👑
        </WKText>
      </View>
    );
  }

  return (
    <WKChip
      accessible
      accessibilityLabel="Premium üye"
      accessibilityRole="text"
      color={mediumBackgroundColor}
      label="👑 Premium"
      textColor={Colors.accent.gold}
      style={[styles.mediumBadge, styles.glow, style]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    elevation: 4,
    shadowColor: Colors.accent.gold,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  mediumBadge: {
    alignSelf: 'flex-start',
  },
  smallBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.chip,
    justifyContent: 'center',
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
  },
  smallText: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 16,
  },
});

export default PremiumBadge;
