import { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WORDS } from '@/data/words';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';
import { shuffleArray } from '@/utils/shuffleArray';

export default function MultipleChoiceScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = useMemo(() => WORDS.filter(w => w.unitId === Number(unitId)), [unitId]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const { completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

  const current = words[index];
  const options = useMemo(() => {
    if (!current) return [];
    const others = shuffleArray(words.filter(w => w.id !== current.id))
      .slice(0, 3)
      .map(w => w.turkish);
    return shuffleArray([current.turkish, ...others]);
  }, [index, words]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === current.turkish;
    if (isCorrect) {
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
      const finalCorrect = correct + (selected === current.turkish ? 1 : 0);
      if (finalCorrect >= 12) completeMode(Number(unitId), 'multiple-choice');
      addXP(finalCorrect * 10 + (finalCorrect >= 5 ? 25 : 0));
      setDone(true);
    }
  }

  if (!current) return null;

  if (done) {
    const passed = correct >= 12;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">{passed ? '🏆' : '📚'}</WKText>
          <WKText variant="heading1">{correct} / {words.length} Doğru</WKText>
          <WKText
            variant="body"
            color={passed ? Colors.status.success : Colors.status.error}
          >
            {passed ? `Geçti! +${correct * 10 + 25} XP` : 'Geçme eşiği: 12/15'}
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
      <WKText variant="heading2" color="#F8FAFC" style={{ marginBottom: Spacing.s8 }}>
        Türkçe anlamı nedir?
      </WKText>
      <WKText variant="word" color={Colors.word.green} style={{ marginBottom: Spacing.s32 }}>{current.german}</WKText>

      {options.map(opt => {
        const isSelected = selected === opt;
        const isCorrect = selected !== null && opt === current.turkish;
        const isWrong = isSelected && opt !== current.turkish;
        return (
          <TouchableOpacity
            key={opt}
            accessibilityRole="radio"
            accessibilityLabel={opt}
            accessibilityState={{ selected: isSelected }}
            onPress={() => handleSelect(opt)}
            activeOpacity={0.75}
            style={[styles.option, isCorrect && styles.correct, isWrong && styles.wrong]}
          >
            <WKText variant="body" color="#F8FAFC">{opt}</WKText>
            {isCorrect && <WKText color={Colors.status.success}>✓</WKText>}
            {isWrong && <WKText color={Colors.status.error}>✗</WKText>}
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
    backgroundColor: Colors.bg.cardDark,
    borderWidth: 1.5,
    borderColor: '#243447',
    borderRadius: 12,
    padding: Spacing.s16,
    marginBottom: Spacing.s12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correct: {
    borderColor: Colors.status.success,
    borderWidth: 2,
    backgroundColor: '#1A3028',
  },
  wrong: {
    borderColor: Colors.status.error,
    borderWidth: 2,
    backgroundColor: '#3A1A1F',
  },
});
