import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WKText } from './WKText';
import { WKButton } from './WKButton';

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={64} color={Colors.text.secondary} />
      <WKText variant="heading2" style={styles.title}>
        {title}
      </WKText>
      {description && (
        <WKText variant="body" color={Colors.text.secondary} style={styles.description}>
          {description}
        </WKText>
      )}
      {actionLabel && onAction && (
        <WKButton
          label={actionLabel}
          variant="secondary"
          onPress={onAction}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s32,
    gap: Spacing.s16,
  },
  title: {
    color: Colors.text.primaryDark,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: Spacing.s8,
    minWidth: 200,
  },
});
