import { useState, useCallback } from 'react';
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

export default function FlashcardScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = WORDS.filter(w => w.unitId === Number(unitId));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const { setWordProgress, completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

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
      setWordProgress(words[index].id, status);
      Haptics.impactAsync(
        status === 'known'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
      if (index + 1 < words.length) {
        setIndex(i => i + 1);
      } else {
        completeMode(Number(unitId), 'flashcard');
        addXP(50);
        setDone(true);
      }
    },
    [index, words, unitId]
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
        {index + 1} / {words.length}
      </WKText>
      <FlashCard word={words[index]} onRate={handleRate} />
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
