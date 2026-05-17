import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useRealtimeBattleStore } from '@/store/useRealtimeBattleStore';

const QUESTION_TIME = 10; // seconds per question
const BETWEEN_DELAY = 1200;
const TICK_MS = 250;

export default function RTQuestionScreen() {
  const router = useRouter();
  const {
    phase,
    battleId,
    questions,
    currentQuestionIndex,
    myScore,
    opponentScore,
    opponentAnswered,
    opponentName,
    error,
    sendAnswer,
    advanceQuestion,
    recordCorrect,
    reset,
  } = useRealtimeBattleStore();

  const timeLeftRef = useRef(QUESTION_TIME * 1000);
  const [timeLeft, setTimeLeft] = React.useState(QUESTION_TIME * 1000);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const betweenRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (betweenRef.current) { clearTimeout(betweenRef.current); betweenRef.current = null; }
  }, []);

  const advance = useCallback(() => {
    stopTimer();
    setSelectedAnswer(null);
    setHasAnswered(false);
    setIsCorrect(null);
    timeLeftRef.current = QUESTION_TIME * 1000;
    setTimeLeft(QUESTION_TIME * 1000);
    advanceQuestion();
  }, [stopTimer, advanceQuestion]);

  const handleAnswer = useCallback((answer: string) => {
    if (hasAnswered) return;
    stopTimer();
    setSelectedAnswer(answer);
    setHasAnswered(true);

    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);

    if (correct) recordCorrect();
    sendAnswer(currentQuestionIndex, answer);

    betweenRef.current = setTimeout(advance, BETWEEN_DELAY);
  }, [hasAnswered, currentQuestion, currentQuestionIndex, stopTimer, advance, recordCorrect, sendAnswer]);

  // Start timer on each question
  useEffect(() => {
    if (phase !== 'playing' || hasAnswered) return;
    timeLeftRef.current = QUESTION_TIME * 1000;
    setTimeLeft(QUESTION_TIME * 1000);

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= TICK_MS;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        stopTimer();
        if (!hasAnswered) handleAnswer(''); // time out = wrong
      }
    }, TICK_MS);

    return stopTimer;
  }, [currentQuestionIndex, phase]);

  // Fade in on question change
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [currentQuestionIndex]);

  // Navigate on done
  useEffect(() => {
    if (phase === 'done') {
      router.replace('/(app)/battle/rtresult');
    }
    if (phase === 'error' && error) {
      Alert.alert('Hata', error, [{ text: 'Tamam', onPress: () => { reset(); router.replace('/(app)/battle/lobby'); } }]);
    }
  }, [phase, error]);

  if (!currentQuestion) return null;

  const timePercent = Math.max(0, timeLeft / (QUESTION_TIME * 1000));
  const timerColor = timePercent > 0.5 ? Colors.status.success : timePercent > 0.25 ? Colors.status.warning : Colors.status.error;

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradient.battle as any} style={styles.header}>
        {/* Scoreboard */}
        <View style={styles.scoreboard}>
          <View style={styles.scoreBlock}>
            <WKText style={styles.scoreLabel}>Sen</WKText>
            <WKText style={styles.scoreValue}>{myScore}</WKText>
          </View>
          <View style={styles.vsBlock}>
            <WKText style={styles.vsText}>VS</WKText>
            <WKText style={styles.progressText}>{currentQuestionIndex + 1}/{totalQuestions}</WKText>
          </View>
          <View style={styles.scoreBlock}>
            <WKText style={styles.scoreLabel}>{opponentName}</WKText>
            <WKText style={styles.scoreValue}>{opponentScore}</WKText>
          </View>
        </View>

        {/* Timer bar */}
        <View style={styles.timerBar}>
          <View style={[styles.timerFill, { width: `${timePercent * 100}%` as any, backgroundColor: timerColor }]} />
        </View>
        <WKText style={[styles.timerText, { color: timerColor }]}>
          {Math.ceil(timeLeft / 1000)}s
        </WKText>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.questionCard}>
          <WKText style={styles.questionWord}>{currentQuestion.word}</WKText>
          <WKText style={styles.questionSub}>Türkçesi nedir?</WKText>
        </View>

        <View style={styles.options}>
          {currentQuestion.options.map((opt) => {
            let bg = Colors.bg.cardDark;
            let border = 'rgba(255,255,255,0.1)';
            if (hasAnswered) {
              if (opt === currentQuestion.correctAnswer) { bg = Colors.status.success + '33'; border = Colors.status.success; }
              else if (opt === selectedAnswer) { bg = Colors.status.error + '33'; border = Colors.status.error; }
            }

            return (
              <Pressable
                key={opt}
                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)}
                disabled={hasAnswered}
                accessibilityLabel={opt}
              >
                <WKText style={styles.optionText}>{opt}</WKText>
                {hasAnswered && opt === currentQuestion.correctAnswer && (
                  <WKText style={styles.optionIcon}>✓</WKText>
                )}
                {hasAnswered && opt === selectedAnswer && opt !== currentQuestion.correctAnswer && (
                  <WKText style={styles.optionIcon}>✗</WKText>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Opponent progress */}
        <View style={styles.opponentStatus}>
          <WKText style={styles.opponentStatusText}>
            {opponentName}: {opponentAnswered}/{totalQuestions} yanıt • {opponentScore} puan
          </WKText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark },

  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: Spacing.s20,
    gap: 8,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBlock: { alignItems: 'center', flex: 1 },
  scoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  scoreValue: { color: '#fff', fontSize: 36, fontWeight: '800' },
  vsBlock: { alignItems: 'center' },
  vsText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  progressText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  timerBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },
  timerText: { fontSize: 13, fontWeight: '700', textAlign: 'right' },

  content: {
    flex: 1,
    padding: Spacing.s20,
    gap: 16,
  },

  questionCard: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.battle.purple + '44',
    gap: 8,
  },
  questionWord: {
    color: Colors.word.green,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  questionSub: { color: Colors.text.secondary, fontSize: 14 },

  options: { gap: 10 },
  option: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  optionText: { color: '#fff', fontSize: 16, fontWeight: '500', flex: 1 },
  optionIcon: { fontSize: 18, fontWeight: '700', marginLeft: 8 },

  opponentStatus: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  opponentStatusText: { color: Colors.text.secondary, fontSize: 13 },
});
