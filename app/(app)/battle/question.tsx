import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useBattleStore } from '@/store/useBattleStore';

const BETWEEN_DELAY = 1200; // ms to show correct/wrong before advancing
const TICK_MS = 250;

export default function BattleQuestionScreen() {
  const router = useRouter();
  const {
    battleId,
    phase,
    questions,
    currentQuestionIndex,
    timePerQuestion,
    selectedAnswer,
    hasAnswered,
    timeLeft,
    opponentName,
    error,
    selectAnswer,
    advanceQuestion,
    setTimeLeft,
  } = useBattleStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const betweenRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const questionStartRef = useRef(Date.now());

  // Redirect on phase changes
  useEffect(() => {
    if (phase === 'done_p1') router.replace('/(app)/battle/result');
    if (phase === 'result') router.replace('/(app)/battle/result');
    if (phase === 'idle' && error) {
      Alert.alert('Hata', error, [{ text: 'Tamam', onPress: () => router.back() }]);
    }
  }, [phase, error]);

  // Fade in when question changes
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    questionStartRef.current = Date.now();
  }, [currentQuestionIndex]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const totalSec = Math.round(timePerQuestion / 1000);
    setTimeLeft(totalSec);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - questionStartRef.current;
      const remaining = Math.max(0, (timePerQuestion - elapsed) / 1000);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        // Time's up — auto-advance without recording an answer
        advanceQuestion();
      }
    }, TICK_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, phase]);

  // Auto-advance after between pause
  useEffect(() => {
    if (phase !== 'between') return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    betweenRef.current = setTimeout(() => {
      advanceQuestion();
    }, BETWEEN_DELAY);

    return () => {
      if (betweenRef.current) clearTimeout(betweenRef.current);
    };
  }, [phase, currentQuestionIndex]);

  const handleOption = useCallback((opt: string) => {
    if (hasAnswered || phase !== 'playing') return;
    selectAnswer(opt);
  }, [hasAnswered, phase, selectAnswer]);

  // Loading state
  if (phase === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.battle.purple} size="large" />
        <WKText style={styles.loadingText}>Sorular yükleniyor…</WKText>
      </View>
    );
  }

  // Submitting state
  if (phase === 'submitting') {
    return (
      <LinearGradient colors={[Colors.bg.primaryDark, Colors.bg.cardDark]} style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.battle.purple} size="large" />
        <WKText style={styles.loadingText}>Cevaplar kaydediliyor…</WKText>
      </LinearGradient>
    );
  }

  if (questions.length === 0) return null;

  const question = questions[currentQuestionIndex];
  if (!question) return null;

  const total = questions.length;
  const questionNo = currentQuestionIndex + 1;
  const timerPct = timeLeft / Math.round(timePerQuestion / 1000);
  const timerColor = timeLeft > 6 ? Colors.status.success : timeLeft > 3 ? Colors.status.warning : Colors.status.error;

  return (
    <LinearGradient colors={[Colors.bg.primaryDark, Colors.bg.cardDark]} style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <WKText style={styles.playerName} numberOfLines={1}>Sen</WKText>
        </View>

        <View style={styles.questionBadge}>
          <WKText style={styles.questionNo}>{questionNo}/{total}</WKText>
        </View>

        <View style={[styles.playerRight]}>
          <WKText style={styles.playerName} numberOfLines={1}>{opponentName}</WKText>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <View
          style={[
            styles.timerBarFill,
            { width: `${Math.round(timerPct * 100)}%`, backgroundColor: timerColor },
          ]}
        />
      </View>
      <WKText style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</WKText>

      {/* Word card */}
      <Animated.View style={[styles.wordCard, { opacity: fadeAnim }]}>
        <WKText style={styles.germanWord}>{question.word}</WKText>
        <WKText style={styles.questionPrompt}>Türkçe karşılığı nedir?</WKText>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsGrid}>
        {question.options.map((opt, i) => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = hasAnswered && opt === question.correctAnswer;
          const isWrong = hasAnswered && isSelected && opt !== question.correctAnswer;

          return (
            <Pressable
              key={`${currentQuestionIndex}-${i}`}
              style={({ pressed }) => [
                styles.optionBtn,
                isCorrect && styles.optionCorrect,
                isWrong && styles.optionWrong,
                isSelected && !hasAnswered && styles.optionSelected,
                pressed && !hasAnswered && styles.optionPressed,
              ]}
              onPress={() => handleOption(opt)}
              disabled={hasAnswered}
            >
              <WKText style={styles.optionLetter}>
                {['A', 'B', 'C', 'D'][i]}
              </WKText>
              <WKText
                style={[
                  styles.optionText,
                  (isCorrect || isWrong) && styles.optionTextBold,
                ]}
              >
                {opt}
              </WKText>
              {isCorrect && <WKText style={styles.feedbackIcon}>✓</WKText>}
              {isWrong && <WKText style={styles.feedbackIcon}>✗</WKText>}
            </Pressable>
          );
        })}
      </View>

      {/* Progress dots */}
      <View style={styles.progressDots}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentQuestionIndex && styles.dotDone,
              i === currentQuestionIndex && styles.dotCurrent,
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerName: {
    color: Colors.text.secondary,
    fontSize: 12,
    maxWidth: 90,
  },
  playerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  questionBadge: {
    backgroundColor: Colors.battle.purple,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  questionNo: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  timerBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  timerBarFill: {
    height: 6,
    borderRadius: 3,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 20,
  },
  wordCard: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.battle.purple + '44',
  },
  germanWord: {
    color: Colors.word.green,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  questionPrompt: {
    color: Colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  optionsGrid: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionSelected: {
    borderColor: Colors.battle.purple,
    backgroundColor: Colors.battle.purple + '22',
  },
  optionPressed: {
    opacity: 0.75,
  },
  optionCorrect: {
    backgroundColor: Colors.status.success + '33',
    borderColor: Colors.status.success,
  },
  optionWrong: {
    backgroundColor: Colors.status.error + '33',
    borderColor: Colors.status.error,
  },
  optionLetter: {
    color: Colors.battle.purple,
    fontWeight: '700',
    fontSize: 15,
    width: 20,
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  optionTextBold: {
    fontWeight: '700',
  },
  feedbackIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotDone: {
    backgroundColor: Colors.status.success,
  },
  dotCurrent: {
    backgroundColor: Colors.battle.purple,
    width: 16,
  },
});
