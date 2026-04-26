import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { levelTestQuestions } from '@/data/levelTestQuestions';
import { useUserStore } from '@/store/useUserStore';

export default function LevelTestScreen() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const setLevel = useUserStore(s => s.setLevel);
  const resolvedLevel = useUserStore(s => s.selectedLevel);

  const q = levelTestQuestions[current];

  function handleSelect(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.correctIndex) setScore(s => s + 1);
  }

  function handleNext() {
    const isLastQuestion = current + 1 >= levelTestQuestions.length;
    if (!isLastQuestion) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      const finalScore = score + (selected === q.correctIndex ? 1 : 0);
      const pct = finalScore / levelTestQuestions.length;
      const level = pct >= 0.8 ? 'B2' : pct >= 0.6 ? 'B1' : pct >= 0.4 ? 'A2' : 'A1';
      setLevel(level);
      setDone(true);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="heading1" style={{ textAlign: 'center' }}>Seviyeniz</WKText>
          <WKText variant="hero" color={Colors.brand.primary}>{resolvedLevel}</WKText>
          <WKButton
            label="Devam Et"
            onPress={() => router.push('/(onboarding)/category-select')}
            style={{ marginTop: Spacing.s32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginBottom: Spacing.s8 }}>
        {current + 1} / {levelTestQuestions.length}
      </WKText>
      <WKText variant="heading2" style={{ marginBottom: Spacing.s24 }}>{q.question}</WKText>
      {q.options.map((opt, idx) => {
        const isSelected = selected === idx;
        const isCorrect = selected !== null && idx === q.correctIndex;
        const isWrong = isSelected && idx !== q.correctIndex;
        return (
          <TouchableOpacity
            key={idx}
            accessibilityRole="radio"
            accessibilityLabel={opt}
            accessibilityState={{ checked: isSelected }}
            onPress={() => handleSelect(idx)}
            style={[styles.option, isCorrect && styles.correct, isWrong && styles.wrong]}
          >
            <WKText variant="body">{opt}</WKText>
            {isCorrect && <WKText color={Colors.status.success}> ✓</WKText>}
            {isWrong && <WKText color={Colors.status.error}> ✗</WKText>}
          </TouchableOpacity>
        );
      })}
      {selected !== null && (
        <WKButton label="Sonraki" onPress={handleNext} style={{ marginTop: Spacing.s24 }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.light, paddingHorizontal: Spacing.s20, paddingTop: Spacing.s32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.s16 },
  option: { borderWidth: 1.5, borderColor: Colors.border.primary, borderRadius: 12, padding: Spacing.s16, marginBottom: Spacing.s12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  correct: { borderColor: Colors.status.success, backgroundColor: Colors.status.success + '20' },
  wrong: { borderColor: Colors.status.error, backgroundColor: Colors.status.error + '20' },
});
