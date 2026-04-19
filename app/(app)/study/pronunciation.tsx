import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WKText, WKButton, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WORDS } from '@/data/words';
import { pronunciationService, PronunciationResult, SCORE_LABELS } from '@/services/pronunciationService';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';

// Simple German pronunciation hints (no IPA library needed)
function getPhoneticHint(german: string): string {
  const word = german.replace(/^(der|die|das|ein|eine)\s+/i, '');
  const hints: [RegExp, string][] = [
    [/sch/gi, 'ş'],
    [/ch(?=[aouAOU])/g, 'h (boğazdan)'],
    [/ch/g, 'ç/h'],
    [/ck/g, 'k'],
    [/ß/g, 'ss'],
    [/ä/g, 'e (açık)'],
    [/ö/g, 'ö'],
    [/ü/g, 'ü'],
    [/ei/g, 'ay'],
    [/ie/g, 'i (uzun)'],
    [/eu|äu/g, 'oy'],
    [/au/g, 'av'],
    [/qu/g, 'kv'],
    [/v/g, 'f'],
    [/w/g, 'v'],
    [/z/g, 'ts'],
    [/sp(?=[aeiouäöü])/gi, 'şp'],
    [/st(?=[aeiouäöü])/gi, 'şt'],
  ];

  let hint = word;
  hints.forEach(([regex, replacement]) => {
    hint = hint.replace(regex, replacement);
  });

  return hint === word ? '' : `≈ "${hint}"`;
}

const SCORE_COLORS: Record<number, string> = {
  1: Colors.status.error,
  2: '#FF8C00',
  3: Colors.status.warning,
  4: '#4CAF50',
  5: Colors.accent.gold,
};

type RecordState = 'idle' | 'recording' | 'processing';

export default function PronunciationScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = WORDS.filter(w => w.unitId === Number(unitId));

  const [index, setIndex] = useState(0);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [done, setDone] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const attemptRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { setPronunciationScore, completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

  const currentWord = words[index];

  // Auto-play TTS when word changes
  useEffect(() => {
    if (!currentWord || done) return;
    setResult(null);
    attemptRef.current = 0;
    const t = setTimeout(() => {
      pronunciationService.playTTS(currentWord.german).catch(() => {});
    }, 400);
    return () => {
      clearTimeout(t);
      pronunciationService.stopTTS().catch(() => {});
    };
  }, [index, done]);

  // Pulse animation while recording
  useEffect(() => {
    if (recordState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordState]);

  const handleRecord = useCallback(async () => {
    if (recordState === 'recording') {
      // Stop
      setRecordState('processing');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const durationMs = await pronunciationService.getRecordingDurationMs();
      const uri = await pronunciationService.stopRecording();
      attemptRef.current += 1;
      const res = pronunciationService.scoreRecording(uri, currentWord.german, attemptRef.current, durationMs);
      setResult(res);
      setRecordState('idle');
      setPronunciationScore(currentWord.id, res.score);
      if (res.score >= 4) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (recordState !== 'idle') return;
    setResult(null);
    const started = await pronunciationService.startRecording();
    if (started) {
      setRecordState('recording');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [recordState, currentWord]);

  const handleNext = useCallback(() => {
    if (result) setSessionScores(prev => [...prev, result.score]);
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
      setResult(null);
    } else {
      completeMode(Number(unitId), 'pronunciation');
      addXP(words.length * 8);
      setDone(true);
    }
  }, [index, words.length, result, unitId]);

  const handleReplay = useCallback(() => {
    pronunciationService.playTTS(currentWord.german, 0.7).catch(() => {});
  }, [currentWord]);

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="body" color={Colors.text.secondary}>Bu ünitede kelime yok.</WKText>
          <WKButton label="Geri Dön" onPress={() => router.back()} style={{ marginTop: Spacing.s16 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const avg = sessionScores.length > 0
      ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length * 10) / 10
      : 0;
    const perfect = sessionScores.filter(s => s === 5).length;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">{avg >= 4 ? '🎤' : '💪'}</WKText>
          <WKText variant="heading1">Telaffuz Tamamlandı!</WKText>
          <WKCard style={styles.resultCard}>
            <View style={styles.resultRow}>
              <WKText variant="body" color={Colors.text.secondary}>Ortalama Skor</WKText>
              <WKText variant="heading2" color={SCORE_COLORS[Math.round(avg)] ?? Colors.text.primaryDark}>
                {avg} / 5
              </WKText>
            </View>
            <View style={styles.resultRow}>
              <WKText variant="body" color={Colors.text.secondary}>Mükemmel</WKText>
              <WKText variant="heading2" color={Colors.accent.gold}>{perfect} kelime ★</WKText>
            </View>
            <View style={styles.resultRow}>
              <WKText variant="body" color={Colors.text.secondary}>XP Kazanıldı</WKText>
              <WKText variant="heading2" color={Colors.brand.primary}>+{words.length * 8}</WKText>
            </View>
          </WKCard>
          <WKButton label="Geri Dön" onPress={() => router.back()} style={{ marginTop: Spacing.s24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const phoneticHint = getPhoneticHint(currentWord.german);

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <WKText variant="bodySm" color={Colors.text.secondary}>
          {index + 1} / {words.length}
        </WKText>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((index + 1) / words.length) * 100}%` }]} />
        </View>
      </View>

      {/* Word card */}
      <WKCard style={styles.wordCard}>
        <WKText variant="caption" color={Colors.battle.purple} style={styles.levelBadge}>
          {currentWord.level}
        </WKText>
        <WKText variant="word" style={styles.germanWord}>{currentWord.german}</WKText>
        {phoneticHint ? (
          <WKText variant="bodySm" color={Colors.text.secondary} style={styles.phonetic}>
            {phoneticHint}
          </WKText>
        ) : null}
        <WKText variant="body" color={Colors.text.secondary} style={styles.translation}>
          {currentWord.turkish}
        </WKText>

        {/* Replay TTS */}
        <Pressable onPress={handleReplay} style={styles.replayBtn} accessibilityLabel="Tekrar dinle">
          <WKText style={styles.replayIcon}>🔈 Tekrar Dinle</WKText>
        </Pressable>
      </WKCard>

      {/* Example sentence */}
      <WKCard style={styles.exampleCard}>
        <WKText variant="bodySm" color={Colors.text.secondary}>{currentWord.example}</WKText>
        <WKText variant="caption" color={Colors.text.tertiary ?? Colors.text.secondary} style={{ marginTop: 4 }}>
          {currentWord.exampleTranslation}
        </WKText>
      </WKCard>

      {/* Record button */}
      <View style={styles.recordArea}>
        {recordState === 'idle' && !result && (
          <WKText variant="bodySm" color={Colors.text.secondary} style={styles.hint}>
            Butona bas ve kelimeyi söyle
          </WKText>
        )}
        {recordState === 'recording' && (
          <WKText variant="bodySm" color={Colors.status.error} style={styles.hint}>
            Dinliyorum... bırakmak için tekrar bas
          </WKText>
        )}
        {recordState === 'processing' && (
          <WKText variant="bodySm" color={Colors.text.secondary} style={styles.hint}>
            Değerlendiriliyor...
          </WKText>
        )}

        <Animated.View style={[styles.micWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable
            onPress={handleRecord}
            disabled={recordState === 'processing'}
            style={[
              styles.micBtn,
              recordState === 'recording' && styles.micBtnActive,
              recordState === 'processing' && styles.micBtnProcessing,
            ]}
            accessibilityLabel={recordState === 'recording' ? 'Kaydı durdur' : 'Kayıt başlat'}
          >
            <WKText style={styles.micIcon}>
              {recordState === 'recording' ? '⏹' : recordState === 'processing' ? '⏳' : '🎙️'}
            </WKText>
          </Pressable>
        </Animated.View>
      </View>

      {/* Score result */}
      {result && (
        <WKCard style={[styles.scoreCard, { borderColor: SCORE_COLORS[result.score] + '60' }]}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <WKText key={i} style={[styles.star, { opacity: i <= result.score ? 1 : 0.2 }]}>★</WKText>
            ))}
          </View>
          <WKText variant="heading2" color={SCORE_COLORS[result.score]}>{result.label}</WKText>
          <WKText variant="bodySm" color={Colors.text.secondary} style={{ textAlign: 'center' }}>
            {result.feedback}
          </WKText>
          <View style={styles.nextRow}>
            <Pressable onPress={handleRecord} style={styles.retryBtn}>
              <WKText variant="caption" color={Colors.text.secondary}>Tekrar dene</WKText>
            </Pressable>
            <WKButton
              label={index + 1 < words.length ? 'Sonraki →' : 'Bitir'}
              onPress={handleNext}
              style={styles.nextBtn}
            />
          </View>
        </WKCard>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s24,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.s16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s12, marginBottom: Spacing.s20 },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.battle.purple,
    borderRadius: 2,
  },
  wordCard: {
    alignItems: 'center',
    paddingVertical: Spacing.s24,
    gap: Spacing.s8,
    marginBottom: Spacing.s12,
  },
  levelBadge: { letterSpacing: 1 },
  germanWord: { textAlign: 'center', fontSize: 36, fontWeight: '700' },
  phonetic: { textAlign: 'center', fontStyle: 'italic' },
  translation: { textAlign: 'center' },
  replayBtn: { marginTop: Spacing.s8, padding: Spacing.s8 },
  replayIcon: { color: Colors.text.secondary, fontSize: 14 },
  exampleCard: { marginBottom: Spacing.s20, paddingVertical: Spacing.s12 },
  recordArea: { alignItems: 'center', gap: Spacing.s12, marginBottom: Spacing.s20 },
  hint: { textAlign: 'center' },
  micWrapper: { alignItems: 'center' },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.battle.purple + '25',
    borderWidth: 2,
    borderColor: Colors.battle.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: Colors.status.error + '25',
    borderColor: Colors.status.error,
  },
  micBtnProcessing: {
    backgroundColor: Colors.bg.cardDark,
    borderColor: Colors.text.secondary,
  },
  micIcon: { fontSize: 32 },
  scoreCard: {
    alignItems: 'center',
    gap: Spacing.s8,
    borderWidth: 1,
    paddingVertical: Spacing.s16,
  },
  starsRow: { flexDirection: 'row', gap: Spacing.s4 },
  star: { fontSize: 24, color: Colors.accent.gold },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s12, marginTop: Spacing.s8 },
  retryBtn: { padding: Spacing.s8 },
  nextBtn: { flex: 1 },
  resultCard: { width: '100%', gap: Spacing.s12, paddingVertical: Spacing.s20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
