import { useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
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
import { pronunciationService, PronunciationResult } from '@/services/pronunciationService';

interface FlashCardProps {
  word: Word;
  onRate: (status: 'unknown' | 'learning' | 'known') => void;
}

function StarRow({ score }: { score: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <WKText key={i} style={[starStyles.star, { opacity: i <= score ? 1 : 0.25 }]}>
          ★
        </WKText>
      ))}
    </View>
  );
}

export function FlashCard({ word, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);

  // Pronunciation state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [pronResult, setPronResult] = useState<PronunciationResult | null>(null);
  const attemptRef = useRef(0);

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
    setPronResult(null);
  }

  // ── TTS ───────────────────────────────────────────────────────────────────
  const handleSpeak = useCallback(async () => {
    if (isSpeaking) {
      await pronunciationService.stopTTS();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    await pronunciationService.playTTS(word.german);
    setIsSpeaking(false);
  }, [isSpeaking, word.german]);

  // ── Recording ─────────────────────────────────────────────────────────────
  const handleMic = useCallback(async () => {
    if (recordState === 'recording') {
      setRecordState('processing');
      attemptRef.current += 1;
      const result = await pronunciationService.stopSTTAndScore(word.german, attemptRef.current);
      setPronResult(result);
      setRecordState('idle');
      return;
    }

    if (recordState !== 'idle') return;
    setPronResult(null);
    const started = await pronunciationService.startSTT();
    if (started) setRecordState('recording');
  }, [recordState, word.german]);

  const micLabel =
    recordState === 'recording' ? '⏹ Durdur' :
    recordState === 'processing' ? '⏳' :
    '🎙️ Telaffuz Et';

  const micColor =
    recordState === 'recording' ? Colors.status.error :
    recordState === 'processing' ? Colors.text.secondary :
    Colors.battle.purple;

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
            {/* TTS button */}
            <Pressable
              onPress={handleSpeak}
              style={styles.ttsBtn}
              accessibilityLabel="Almanca sesini dinle"
              hitSlop={8}
            >
              <WKText style={[styles.ttsBtnText, isSpeaking && styles.ttsBtnActive]}>
                {isSpeaking ? '🔊' : '🔈'}
              </WKText>
            </Pressable>

            <WKText variant="word" style={{ textAlign: 'center' }}>{word.german}</WKText>
            {word.level ? (
              <WKText variant="caption" color={Colors.battle.purple} style={styles.levelBadge}>
                {word.level}
              </WKText>
            ) : null}
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
            {word.exampleTranslation ? (
              <WKText
                variant="caption"
                color={Colors.text.secondary}
                style={{ textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}
              >
                {word.exampleTranslation}
              </WKText>
            ) : null}
          </WKCard>
        </Animated.View>
      </TouchableOpacity>

      {/* Pronunciation practice row */}
      <View style={styles.pronRow}>
        <Pressable
          onPress={handleMic}
          style={[styles.micBtn, recordState === 'recording' && styles.micBtnActive]}
          accessibilityLabel={micLabel}
          disabled={recordState === 'processing'}
        >
          <WKText style={[styles.micBtnText, { color: micColor }]}>{micLabel}</WKText>
        </Pressable>
      </View>

      {/* Pronunciation result */}
      {pronResult && (
        <View style={styles.pronResult}>
          <StarRow score={pronResult.score} />
          <WKText style={styles.pronLabel}>{pronResult.label}</WKText>
          <WKText style={styles.pronFeedback}>{pronResult.feedback}</WKText>
        </View>
      )}

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
  cardWrapper: { height: 240, marginBottom: Spacing.s12 },
  card: { height: 240 },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ttsBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
  ttsBtnText: {
    fontSize: 22,
    opacity: 0.7,
  },
  ttsBtnActive: {
    opacity: 1,
  },
  levelBadge: {
    marginTop: 6,
    letterSpacing: 1,
  },
  pronRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.s8,
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.battle.purple + '88',
    gap: 6,
  },
  micBtnActive: {
    borderColor: Colors.status.error,
    backgroundColor: Colors.status.error + '15',
  },
  micBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pronResult: {
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: Spacing.s12,
    gap: 4,
  },
  pronLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  pronFeedback: {
    color: Colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
  },
  rateRow: { flexDirection: 'row', gap: Spacing.s8 },
  rateBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.s12,
    borderRadius: 12,
  },
});

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 22,
    color: Colors.accent.gold,
  },
});
