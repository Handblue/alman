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

function makeBlankSentence(sentence: string, german: string): string {
  // Strip article (der/die/das) and replace the base word in the example sentence
  const base = german.replace(/^(der|die|das)\s+/i, '');
  return sentence.includes(base)
    ? sentence.replace(base, '___')
    : sentence.replace(/\S+/, '___');
}

export default function SentenceScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = WORDS.filter(w => w.unitId === Number(unitId));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const { completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

  const current = words[index];
  const blankSentence = useMemo(
    () => makeBlankSentence(current.example, current.german),
    [index]
  );
  const options = useMemo(() => {
    const others = shuffleArray(words.filter(w => w.id !== current.id))
      .slice(0, 3)
      .map(w => w.german);
    return shuffleArray([current.german, ...others]);
  }, [index]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === current.german) {
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
      if (correct >= 10) completeMode(Number(unitId), 'sentence');
      addXP(correct * 10);
      setDone(true);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">📖</WKText>
          <WKText variant="heading1">{correct} / {words.length}</WKText>
          <WKText
            variant="body"
            color={correct >= 10 ? Colors.status.success : Colors.status.error}
          >
            {correct >= 10 ? `Geçti! +${correct * 10} XP` : 'Geçme eşiği: 10/15'}
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
        Boşluğu doldur:
      </WKText>
      <WKText
        variant="bodySm"
        color={Colors.text.secondary}
        style={{ marginBottom: Spacing.s8 }}
      >
        {current.exampleTranslation}
      </WKText>
      <WKText variant="bodyLg" style={{ marginBottom: Spacing.s32, fontStyle: 'italic' }}>
        {blankSentence}
      </WKText>

      {options.map(opt => {
        const isSelected = selected === opt;
        const isCorrect = selected !== null && opt === current.german;
        const isWrong = isSelected && opt !== current.german;
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
