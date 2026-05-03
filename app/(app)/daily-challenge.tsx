import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { WKText, WKButton, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useDailyChallengeStore } from '@/store/useDailyChallengeStore';
import { useUserStore } from '@/store/useUserStore';
import { WORDS } from '@/data/words';
import { speakingService } from '@/services/speakingService';

type ScreenState = 'intro' | 'question' | 'result';
type AnswerState = 'unanswered' | 'correct' | 'wrong';

function formatDate(dateStr: string): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

function buildChoices(questionId: number): string[] {
  const correct = WORDS.find((w) => w.id === questionId);
  if (!correct) return [];

  const distractors = WORDS
    .filter((w) => w.id !== questionId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.turkish);

  const all = [correct.turkish, ...distractors];
  // shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function getStars(correct: number): number {
  if (correct === 5) return 3;
  if (correct >= 3) return 2;
  return 1;
}

export default function DailyChallengeScreen() {
  const todayChallenge = useDailyChallengeStore((s) => s.todayChallenge);
  const recordAnswer = useDailyChallengeStore((s) => s.recordAnswer);
  const addXP = useUserStore((s) => s.addXP);

  const [screenState, setScreenState] = useState<ScreenState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [localCorrect, setLocalCorrect] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questionIds = todayChallenge?.questionIds ?? [];
  const totalQuestions = questionIds.length;
  const alreadyCompleted = todayChallenge?.completed ?? false;

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceRef.current) clearTimeout(advanceRef.current);
  };

  const loadQuestion = useCallback((index: number) => {
    if (!questionIds[index]) return;
    setChoices(buildChoices(questionIds[index]));
    setAnswerState('unanswered');
    setSelectedChoice(null);
    setTimeLeft(15);
  }, [questionIds]);

  useEffect(() => {
    if (screenState !== 'question') return;
    clearTimers();
    loadQuestion(currentIndex);
  }, [currentIndex, screenState, loadQuestion]);

  useEffect(() => {
    if (screenState !== 'question' || answerState !== 'unanswered') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState, currentIndex, answerState]);

  const handleTimeout = () => {
    setAnswerState('wrong');
    setSelectedChoice(null);
    recordAnswer(false);
    scheduleAdvance();
  };

  const handleChoicePress = (choice: string) => {
    if (answerState !== 'unanswered') return;
    clearTimers();

    const currentWordId = questionIds[currentIndex];
    const correctAnswer = WORDS.find((w) => w.id === currentWordId)?.turkish ?? '';
    const isCorrect = choice === correctAnswer;

    setSelectedChoice(choice);
    setAnswerState(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setLocalCorrect((prev) => prev + 1);
    }

    recordAnswer(isCorrect);
    scheduleAdvance();
  };

  const scheduleAdvance = () => {
    advanceRef.current = setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= totalQuestions) {
        // Calculate xp: correctCount * 10 + 25 (matches store logic)
        // We use localCorrect but add current answer
        finishChallenge();
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 1500);
  };

  const finishChallenge = () => {
    // The store completeChallenge is already called via recordAnswer when answeredCount hits 5.
    // Read the final values from store after a tick.
    setTimeout(() => {
      const latest = useDailyChallengeStore.getState().todayChallenge;
      const earned = latest?.xpEarned ?? 0;
      setXpEarned(earned);
      addXP(earned);
      if (latest) {
        speakingService.awardDailyChallengeBonus(
          latest.date,
          latest.correctCount,
          latest.questionIds.length
        );
      }
      setScreenState('result');
    }, 50);
  };

  const startChallenge = () => {
    setCurrentIndex(0);
    setLocalCorrect(0);
    setScreenState('question');
  };

  const currentWordId = questionIds[currentIndex];
  const currentWord = WORDS.find((w) => w.id === currentWordId);
  const correctAnswer = currentWord?.turkish ?? '';

  const finalCorrect = useDailyChallengeStore.getState().todayChallenge?.correctCount ?? localCorrect;
  const finalXp = useDailyChallengeStore.getState().todayChallenge?.xpEarned ?? xpEarned;
  const stars = getStars(finalCorrect);

  // --- INTRO STATE ---
  if (screenState === 'intro') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.introContent}>
          <WKText variant="hero" style={styles.centerText}>
            Günlük Meydan Okuma
          </WKText>
          {todayChallenge && (
            <WKText variant="body" color={Colors.text.secondary} style={styles.centerText}>
              {formatDate(todayChallenge.date)}
            </WKText>
          )}

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <WKText variant="caption" color={Colors.text.primary}>
                5 soru · Bugün bir kez
              </WKText>
            </View>
          </View>

          {alreadyCompleted ? (
            <WKCard style={styles.completedCard}>
              <WKText variant="heading2" style={styles.centerText}>
                ✅ Tamamlandı!
              </WKText>
              <WKText variant="body" style={styles.centerText}>
                Skor: {todayChallenge?.correctCount}/5 doğru
              </WKText>
              <WKText variant="body" color={Colors.accent.gold} style={styles.centerText}>
                +{todayChallenge?.xpEarned} XP kazandın!
              </WKText>
              <WKText
                variant="bodySm"
                color={Colors.text.secondary}
                style={[styles.centerText, { marginTop: Spacing.s12 }]}
              >
                Yarın yeni sorular gelecek
              </WKText>
            </WKCard>
          ) : (
            <>
              <WKText
                variant="body"
                color={Colors.text.secondary}
                style={[styles.centerText, styles.desc]}
              >
                Her gün 5 yeni soru seni bekliyor. Her doğru cevap +10 XP, tamamlama bonusu +25 XP!
              </WKText>
              <WKButton
                label="Başla"
                variant="primary"
                onPress={startChallenge}
                style={styles.startButton}
              />
            </>
          )}

          <WKButton
            label="Geri"
            variant="ghost"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- RESULT STATE ---
  if (screenState === 'result') {
    return (
      <LinearGradient
        colors={Colors.gradient.quizResult}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.resultGradient}
      >
        <SafeAreaView style={styles.resultSafe}>
          <View style={styles.resultContent}>
            <WKText variant="hero" color={Colors.text.primary} style={styles.centerText}>
              {finalCorrect}/5 Doğru
            </WKText>
            <WKText variant="score" color={Colors.accent.gold} style={styles.centerText}>
              +{finalXp} XP 🔥
            </WKText>
            <WKText variant="heading1" style={styles.centerText}>
              {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
            </WKText>
            <WKText variant="body" color={Colors.text.primary} style={[styles.centerText, styles.starsLabel]}>
              {stars === 3 ? 'Mükemmel!' : stars === 2 ? 'İyi iş!' : 'Devam et!'}
            </WKText>
            <WKButton
              label="Ana Sayfaya Dön"
              variant="secondary"
              onPress={() => router.back()}
              style={styles.homeButton}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // --- QUESTION STATE ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={styles.progressBg}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: totalQuestions, now: currentIndex }}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex) / totalQuestions) * 100}%` as `${number}%` },
            ]}
          />
        </View>
        <WKText variant="bodySm" color={Colors.text.secondary}>
          {currentIndex + 1}/{totalQuestions}
        </WKText>
      </View>

      {/* Timer */}
      <View style={styles.timerRow}>
        <WKText
          variant="timer"
          color={timeLeft <= 5 ? Colors.status.error : Colors.accent.orange}
        >
          {timeLeft}s
        </WKText>
      </View>

      {/* German word */}
      <View style={styles.wordContainer}>
        <WKText variant="word" color={Colors.word.green} style={styles.centerText}>
          {currentWord?.german ?? ''}
        </WKText>
      </View>

      {/* Flash overlay */}
      {answerState !== 'unanswered' && (
        <View
          style={[
            styles.flashOverlay,
            { backgroundColor: answerState === 'correct' ? Colors.status.success : Colors.status.error },
          ]}
          pointerEvents="none"
        />
      )}

      {/* XP chip on correct */}
      {answerState === 'correct' && (
        <View style={styles.xpChip}>
          <WKText variant="caption" color={Colors.text.primary}>+10 XP</WKText>
        </View>
      )}

      {/* Choices */}
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          let bgColor: string = Colors.bg.card;
          let textColor: string = Colors.text.primary;
          if (answerState !== 'unanswered') {
            if (choice === correctAnswer) { bgColor = Colors.status.success; textColor = '#fff'; }
            else if (choice === selectedChoice) { bgColor = Colors.status.error; textColor = '#fff'; }
          }

          return (
            <TouchableOpacity
              key={choice}
              onPress={() => handleChoicePress(choice)}
              disabled={answerState !== 'unanswered'}
              accessibilityRole="button"
              accessibilityLabel={`Seçenek: ${choice}`}
              style={[styles.choiceButton, { backgroundColor: bgColor }]}
              activeOpacity={0.85}
            >
              <WKText variant="body" color={textColor}>
                {choice}
              </WKText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Wrong answer: show correct */}
      {answerState === 'wrong' && selectedChoice !== null && (
        <WKText variant="bodySm" color={Colors.status.success} style={styles.correctHint}>
          Doğru cevap: {correctAnswer}
        </WKText>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
    paddingHorizontal: Spacing.s20,
  },
  introContent: {
    paddingVertical: Spacing.s48,
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  chipRow: {
    marginVertical: Spacing.s16,
  },
  chip: {
    backgroundColor: Colors.bg.tint,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  completedCard: {
    width: '100%',
    marginTop: Spacing.s16,
    marginBottom: Spacing.s24,
    gap: Spacing.s8,
  },
  desc: {
    marginTop: Spacing.s8,
    marginBottom: Spacing.s32,
  },
  startButton: {
    width: '100%',
    marginBottom: Spacing.s12,
  },
  backButton: {
    width: '100%',
  },
  // question state
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
    paddingTop: Spacing.s16,
    marginBottom: Spacing.s8,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border.primary,
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.accent.orange,
    borderRadius: 4,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: Spacing.s8,
  },
  wordContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.s32,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    borderRadius: Radius.card,
  },
  xpChip: {
    alignSelf: 'center',
    backgroundColor: Colors.status.success,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
    marginBottom: Spacing.s8,
  },
  choicesContainer: {
    gap: Spacing.s12,
  },
  choiceButton: {
    minHeight: 56,
    borderRadius: Radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  correctHint: {
    textAlign: 'center',
    marginTop: Spacing.s12,
  },
  // result state
  resultGradient: {
    flex: 1,
  },
  resultSafe: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.s32,
    gap: Spacing.s16,
  },
  starsLabel: {
    marginTop: Spacing.s4,
  },
  homeButton: {
    width: '100%',
    marginTop: Spacing.s24,
  },
});
