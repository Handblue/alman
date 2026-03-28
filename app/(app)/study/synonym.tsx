import { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WORDS } from '@/data/words';
import { shuffleArray } from '@/utils/shuffleArray';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';

export default function SynonymScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = useMemo(
    () => WORDS.filter(w => w.unitId === Number(unitId) && w.synonyms && w.synonyms.length > 0),
    [unitId]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const { completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="heading2">Bu ünitede yeterli eş anlamlı yok</WKText>
          <WKButton
            label="Geri Dön"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.s32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const current = words[index];
  const correctSynonym = current.synonyms![0];
  const options = useMemo(() => {
    const others = shuffleArray(
      words.filter(w => w.id !== current.id && w.synonyms!.length > 0)
    )
      .slice(0, 3)
      .map(w => w.synonyms![0]);
    return shuffleArray([correctSynonym, ...others]);
  }, [index, words]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === correctSynonym) {
      setCorrect(c => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleNext() {
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
      setSelected(null);
    } else {
      if (correct >= 8) completeMode(Number(unitId), 'synonym');
      addXP(correct * 10);
      setDone(true);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">🔄</WKText>
          <WKText variant="heading1">{correct} / {words.length}</WKText>
          <WKText
            variant="body"
            color={correct >= 8 ? Colors.status.success : Colors.status.error}
          >
            {correct >= 8 ? `Geçti! +${correct * 10} XP` : 'Geçme eşiği: 8/15'}
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
      <WKText
        variant="bodySm"
        color={Colors.text.secondary}
        style={{ marginBottom: Spacing.s16 }}
      >
        {index + 1} / {words.length}
      </WKText>
      <WKText variant="heading2" style={{ marginBottom: Spacing.s8 }}>
        Eş anlamlısı hangisi?
      </WKText>
      <WKText variant="word" style={{ marginBottom: Spacing.s32 }}>{current.german}</WKText>

      {options.map(opt => {
        const isSelected = selected === opt;
        const isCorrect = selected !== null && opt === correctSynonym;
        const isWrong = isSelected && opt !== correctSynonym;
        return (
          <TouchableOpacity
            key={opt}
            accessibilityRole="radio"
            accessibilityLabel={opt}
            accessibilityState={{ selected: isSelected }}
            onPress={() => handleSelect(opt)}
            style={[styles.option, isCorrect && styles.correct, isWrong && styles.wrong]}
          >
            <WKText variant="body">{opt}</WKText>
          </TouchableOpacity>
        );
      })}

      {selected !== null && (
        <WKButton
          label="Sonraki"
          onPress={handleNext}
          style={{ marginTop: Spacing.s24 }}
        />
      )}
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
  option: {
    borderWidth: 1.5,
    borderColor: '#243447',
    borderRadius: 12,
    padding: Spacing.s16,
    marginBottom: Spacing.s12,
  },
  correct: {
    borderColor: Colors.status.success,
    backgroundColor: Colors.status.success + '20',
  },
  wrong: {
    borderColor: Colors.status.error,
    backgroundColor: Colors.status.error + '20',
  },
});
