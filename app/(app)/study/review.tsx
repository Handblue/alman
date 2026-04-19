import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WORDS } from '@/data/words';
import { FlashCard } from '@/components/study/FlashCard';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';

export default function SRSReviewScreen() {
  const { getDueWords, setWordProgress } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

  // Collect due word objects once on mount
  const [dueWordIds] = useState(() => getDueWords());
  const dueWords = WORDS.filter(w => dueWordIds.includes(w.id));

  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const handleRate = useCallback(
    (status: 'unknown' | 'learning' | 'known') => {
      const word = dueWords[index];
      setWordProgress(word.id, status);

      Haptics.impactAsync(
        status === 'known'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );

      setStats(prev => ({
        correct: prev.correct + (status === 'known' ? 1 : 0),
        total: prev.total + 1,
      }));

      if (index + 1 < dueWords.length) {
        setIndex(i => i + 1);
      } else {
        addXP(dueWords.length * 5);
        setDone(true);
      }
    },
    [index, dueWords]
  );

  if (dueWords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">✅</WKText>
          <WKText variant="heading1" style={{ textAlign: 'center' }}>
            Bugün tekrar edilecek kelime yok!
          </WKText>
          <WKText variant="body" color={Colors.text.secondary} style={{ textAlign: 'center' }}>
            Harika iş. Yarın tekrar kontrol et.
          </WKText>
          <WKButton
            label="Geri Dön"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.s24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">{accuracy >= 80 ? '🎉' : '💪'}</WKText>
          <WKText variant="heading1">Tekrar Tamamlandı!</WKText>
          <WKText variant="body" color={Colors.text.secondary}>
            {stats.correct}/{stats.total} doğru — %{accuracy}
          </WKText>
          <WKText variant="bodySm" color={Colors.accent.gold}>
            +{dueWords.length * 5} XP kazandın
          </WKText>
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
      <View style={styles.header}>
        <WKText variant="bodySm" color={Colors.text.secondary}>
          SRS Tekrar
        </WKText>
        <WKText variant="bodySm" color={Colors.text.secondary}>
          {index + 1} / {dueWords.length}
        </WKText>
      </View>
      <FlashCard word={dueWords[index]} onRate={handleRate} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.s24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s16,
  },
});
