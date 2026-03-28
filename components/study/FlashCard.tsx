import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Word } from '@/data/words';

interface FlashCardProps {
  word: Word;
  onRate: (status: 'unknown' | 'learning' | 'known') => void;
}

export function FlashCard({ word, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  function flip() {
    rotation.value = withTiming(flipped ? 0 : 1, { duration: 400 });
    setFlipped(f => !f);
  }

  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          flipped
            ? `${word.german} — ${word.turkish}. Değerlendirmek için seç.`
            : `${word.german}. Çeviri için dokun.`
        }
        onPress={flip}
        style={styles.cardWrapper}
      >
        <Animated.View style={[styles.card, frontStyle]}>
          <WKCard style={styles.inner}>
            <WKText variant="word" style={{ textAlign: 'center' }}>{word.german}</WKText>
            <WKText
              variant="bodySm"
              color={Colors.text.secondary}
              style={{ textAlign: 'center', marginTop: Spacing.s8 }}
            >
              Çevirmek için dokun
            </WKText>
          </WKCard>
        </Animated.View>
        <Animated.View style={[styles.card, backStyle]}>
          <WKCard style={styles.inner}>
            <WKText variant="heading1" style={{ textAlign: 'center' }}>{word.turkish}</WKText>
            <WKText
              variant="body"
              color={Colors.text.secondary}
              style={{ textAlign: 'center', marginTop: Spacing.s8 }}
            >
              {word.example}
            </WKText>
          </WKCard>
        </Animated.View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.rateRow}>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: Colors.status.error + '30' }]}
            onPress={() => onRate('unknown')}
            accessibilityRole="button"
            accessibilityLabel="Bilmiyorum — bu kelimeyi henüz bilmiyorum"
          >
            <WKText variant="caption" color={Colors.status.error}>Bilmiyorum</WKText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: Colors.status.warning + '30' }]}
            onPress={() => onRate('learning')}
            accessibilityRole="button"
            accessibilityLabel="Biraz — kelimeyi tanıyorum ama emin değilim"
          >
            <WKText variant="caption" color={Colors.status.warning}>Biraz</WKText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: Colors.status.success + '30' }]}
            onPress={() => onRate('known')}
            accessibilityRole="button"
            accessibilityLabel="Öğrendim — bu kelimeyi iyi biliyorum"
          >
            <WKText variant="caption" color={Colors.status.success}>Öğrendim</WKText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { height: 240, marginBottom: Spacing.s24 },
  card: { height: 240 },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rateRow: { flexDirection: 'row', gap: Spacing.s8 },
  rateBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.s12,
    borderRadius: 12,
  },
});
