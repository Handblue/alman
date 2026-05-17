import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WORDS } from '@/data/words';
import { FlashCard } from '@/components/study/FlashCard';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { authService } from '@/services/authService';

export default function FlashcardScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = WORDS.filter(w => w.unitId === Number(unitId));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [adaptiveWords, setAdaptiveWords] = useState(words);
  const [sessionStats, setSessionStats] = useState({
    wordsStudied: [] as string[],
    correctAnswers: 0,
    totalAnswers: 0,
    engagement: 0,
    interruptions: 0,
    difficultyAdjustments: 0,
  });
  const { setWordProgress, completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);
  const { startLearningSession, endLearningSession, generateRecommendations } = useAnalyticsStore();

  // Adaptive difficulty system
  const adaptiveSettings = useMemo(() => {
    const recentPerformance = sessionStats.totalAnswers > 0 ?
      (sessionStats.correctAnswers / sessionStats.totalAnswers) : 0.5;

    // Adjust difficulty based on recent performance
    let targetDifficulty: 'easy' | 'medium' | 'hard';
    if (recentPerformance > 0.8) {
      targetDifficulty = 'hard';
    } else if (recentPerformance > 0.6) {
      targetDifficulty = 'medium';
    } else {
      targetDifficulty = 'easy';
    }

    return {
      targetDifficulty,
      shouldShuffle: sessionStats.difficultyAdjustments > 2, // Shuffle after multiple adjustments
      focusWeakWords: recentPerformance < 0.7, // Focus on weak words if struggling
    };
  }, [sessionStats]);

  // Adaptive word ordering
  useEffect(() => {
    if (adaptiveSettings.focusWeakWords) {
      // Prioritize words user struggles with
      const sortedWords = [...words].sort((a, b) => {
        const aProgress = useProgressStore.getState().getWordProgress(a.id);
        const bProgress = useProgressStore.getState().getWordProgress(b.id);

        const aDifficulty = aProgress.incorrectCount / Math.max(aProgress.correctCount + aProgress.incorrectCount, 1);
        const bDifficulty = bProgress.incorrectCount / Math.max(bProgress.correctCount + bProgress.incorrectCount, 1);

        return bDifficulty - aDifficulty; // Hardest words first
      });
      setAdaptiveWords(sortedWords);
    } else if (adaptiveSettings.shouldShuffle) {
      // Shuffle for variety
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setAdaptiveWords(shuffled);
      setSessionStats(prev => ({ ...prev, difficultyAdjustments: 0 }));
    }
  }, [adaptiveSettings, words]);

  // Start analytics session when component mounts
  useEffect(() => {
    startLearningSession('flashcard', unitId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // End analytics session when unmounting mid-session (user navigates away)
  useEffect(() => {
    return () => {
      if (!done) {
        endLearningSession(
          sessionStats.wordsStudied,
          sessionStats.correctAnswers,
          sessionStats.totalAnswers,
          sessionStats.engagement,
          sessionStats.interruptions
        ).catch(console.error);
      }
    };
  }, [done, sessionStats]);

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="body" color={Colors.text.secondary}>
            Bu ünitede henüz kelime yok.
          </WKText>
          <WKButton
            label="Geri Dön"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.s16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleRate = useCallback(
    (status: 'unknown' | 'learning' | 'known') => {
      const wordId = adaptiveWords[index].id;
      const studiedWord = String(wordId);
      const isCorrect = status === 'known';

      setWordProgress(wordId, status);
      Haptics.impactAsync(
        status === 'known'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );

      // Update session stats with adaptive logic
      setSessionStats(prev => {
        const newStats = {
          wordsStudied: [...prev.wordsStudied, studiedWord],
          correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
          totalAnswers: prev.totalAnswers + 1,
          engagement: prev.engagement + (isCorrect ? 10 : 5),
          interruptions: prev.interruptions,
          difficultyAdjustments: prev.difficultyAdjustments,
        };

        // Adaptive difficulty adjustment
        const currentAccuracy = newStats.correctAnswers / newStats.totalAnswers;
        const targetAccuracy = adaptiveSettings.targetDifficulty === 'easy' ? 0.7 :
                              adaptiveSettings.targetDifficulty === 'medium' ? 0.6 : 0.5;

        if (Math.abs(currentAccuracy - targetAccuracy) > 0.2) {
          newStats.difficultyAdjustments = prev.difficultyAdjustments + 1;
        }

        return newStats;
      });

      if (index + 1 < adaptiveWords.length) {
        setIndex(i => i + 1);
      } else {
        completeMode(Number(unitId), 'flashcard');
        addXP(50);
        setDone(true);

        // End analytics session and generate recommendations
        endLearningSession(
          [...sessionStats.wordsStudied, studiedWord],
          sessionStats.correctAnswers + (isCorrect ? 1 : 0),
          sessionStats.totalAnswers + 1,
          sessionStats.engagement + (isCorrect ? 10 : 5),
          sessionStats.interruptions
        ).catch(console.error);

        // Generate new recommendations based on session performance
        const userId = authService.getCurrentUser()?.id;
        if (userId) {
          generateRecommendations(userId).catch(console.error);
        }
      }
    },
    [index, adaptiveWords, unitId, sessionStats, adaptiveSettings]
  );

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">🎉</WKText>
          <WKText variant="heading1">+50 XP Kazandın!</WKText>
          <WKButton
            label="Geri Dön"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.s32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WKText
        variant="bodySm"
        color={Colors.text.secondary}
        style={{ marginBottom: Spacing.s24 }}
      >
        {index + 1} / {adaptiveWords.length} • {adaptiveSettings.targetDifficulty} mode
      </WKText>
      <FlashCard word={adaptiveWords[index]} onRate={handleRate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s16,
  },
});
