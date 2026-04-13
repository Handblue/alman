import React, { useEffect, type ReactElement } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-expect-error `expo-blur` is expected in the Expo runtime for this screen.
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { WKButton } from '@/components/ui/WKButton';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

const CROWN_SIZE = 72;
const CROWN_RADIUS = CROWN_SIZE / 2;
const CTA_LABEL = 'Ücretsiz Dene';

const BENEFITS = [
  {
    icon: '📥',
    text: 'Offline mod — internet olmadan çalış',
  },
  {
    icon: '🎙️',
    text: 'Sesli telaffuz — AI değerlendirmeli',
  },
  {
    icon: '⚔️',
    text: 'Sınırsız battle — istediğin kadar oyna',
  },
] as const;

export interface PremiumGateModalProps {
  visible: boolean;
  featureName: string;
  onClose: () => void;
  onSubscribe: () => void;
}

export function PremiumGateModal({
  visible,
  featureName,
  onClose,
  onSubscribe,
}: PremiumGateModalProps): ReactElement {
  const crownScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(60);

  useEffect(() => {
    if (!visible) {
      crownScale.value = 0;
      cardTranslateY.value = 60;
      return;
    }

    crownScale.value = 0;
    cardTranslateY.value = 60;

    cardTranslateY.value = withSpring(0, {
      damping: 14,
      stiffness: 160,
    });

    crownScale.value = withTiming(1.2, { duration: 180 }, (finished) => {
      if (!finished) {
        return;
      }

      crownScale.value = withSpring(1, {
        damping: 10,
        stiffness: 220,
      });
    });
  }, [cardTranslateY, crownScale, visible]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.overlay} />

        <Animated.View
          accessibilityViewIsModal
          style={[styles.card, cardAnimatedStyle]}
        >
          <Animated.View style={crownAnimatedStyle}>
            <LinearGradient
              accessibilityRole="image"
              accessibilityLabel="Premium tacı"
              colors={Colors.gradient.premium}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.crownCircle}
            >
              <WKText style={styles.crownEmoji}>{'👑'}</WKText>
            </LinearGradient>
          </Animated.View>

          <WKText
            variant="heading1"
            color={Colors.text.primaryDark}
            style={styles.title}
          >
            {`${featureName} — Premium Özellik`}
          </WKText>

          <View style={styles.benefits}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.text} style={styles.benefitRow}>
                <WKText variant="body">{benefit.icon}</WKText>
                <WKText
                  variant="body"
                  color={Colors.text.secondary}
                  style={styles.benefitText}
                >
                  {benefit.text}
                </WKText>
              </View>
            ))}
          </View>

          <WKText
            variant="bodySm"
            color={Colors.text.secondary}
            style={styles.price}
          >
            79 TL/ay · 7 gün ücretsiz deneme
          </WKText>

          <LinearGradient
            colors={Colors.gradient.premium}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaWrapper}
          >
            <WKButton
              label={CTA_LABEL}
              accessibilityLabel={CTA_LABEL}
              variant="ghost"
              onPress={onSubscribe}
              style={styles.ctaButton}
            />

            <View pointerEvents="none" style={styles.ctaLabelOverlay}>
              <WKText
                variant="body"
                color={Colors.text.primaryDark}
                style={styles.ctaLabel}
              >
                {CTA_LABEL}
              </WKText>
            </View>
          </LinearGradient>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Modalı kapat"
            onPress={onClose}
            style={styles.closeButton}
          >
            <WKText
              variant="bodySm"
              color={Colors.text.secondary}
              style={styles.closeText}
            >
              Daha sonra
            </WKText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default PremiumGateModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.s24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${Colors.bg.primaryDark}80`, // 50% opacity
  },
  card: {
    width: '88%',
    alignItems: 'center',
    padding: Spacing.s32,
    borderRadius: Radius.modal,
    backgroundColor: Colors.bg.cardDark,
    ...Shadows.level4,
  },
  crownCircle: {
    width: CROWN_SIZE,
    height: CROWN_SIZE,
    borderRadius: CROWN_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  title: {
    marginTop: Spacing.s16,
    textAlign: 'center',
  },
  benefits: {
    alignSelf: 'stretch',
    marginTop: Spacing.s16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    marginTop: Spacing.s8,
  },
  benefitText: {
    flex: 1,
  },
  price: {
    marginTop: Spacing.s16,
    textAlign: 'center',
  },
  ctaWrapper: {
    alignSelf: 'stretch',
    marginTop: Spacing.s24,
    borderRadius: Radius.button,
  },
  ctaButton: {
    alignSelf: 'stretch',
    borderRadius: Radius.button,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaLabelOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: Spacing.s12,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
  },
  closeText: {
    textAlign: 'center',
  },
});
