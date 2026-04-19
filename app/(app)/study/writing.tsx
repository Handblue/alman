import { useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WORDS } from '@/data/words';
import { isCloseEnough } from '@/utils/levenshtein';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';

export default function WritingScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = WORDS.filter(w => w.unitId === Number(unitId));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const { completeMode } = useProgressStore();
  const addXP = useUserStore(s => s.addXP);

  const current = words[index];

  function handleCheck() {
    Keyboard.dismiss();
    const ok = isCloseEnough(input, current.german);
    setResult(ok ? 'correct' : 'wrong');
    if (ok) {
      setCorrect(c => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleNext() {
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
      setInput('');
      setResult(null);
    } else {
      if (correct >= 10) completeMode(Number(unitId), 'writing');
      addXP(correct * 10);
      setDone(true);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <WKText variant="hero">{correct >= 10 ? '✍️🏆' : '📖'}</WKText>
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
        Almancasını yaz:
      </WKText>
      <WKText variant="heading1" style={{ marginBottom: Spacing.s32 }}>
        {current.turkish}
      </WKText>

      <TextInput
        style={[
          styles.input,
          result === 'correct' && styles.inputCorrect,
          result === 'wrong' && styles.inputWrong,
        ]}
        value={input}
        onChangeText={setInput}
        placeholder="Almanca kelime..."
        placeholderTextColor={Colors.text.secondary}
        autoCapitalize="none"
        autoCorrect={false}
        editable={result === null}
        accessibilityLabel="Almanca kelime gir"
        accessibilityHint={`${current.turkish} kelimesinin Almancasını yaz`}
      />

      {result === 'wrong' && (
        <View style={styles.feedbackRow}>
          <WKText variant="bodySm" color={Colors.status.error}>✗ Doğru cevap: </WKText>
          <WKText variant="bodySm" color={Colors.word.green}>{current.german}</WKText>
        </View>
      )}

      {result === null ? (
        <WKButton
          label="Kontrol Et"
          onPress={handleCheck}
          style={{ marginTop: Spacing.s24 }}
          disabled={!input.trim()}
        />
      ) : (
        <WKButton label="Sonraki" onPress={handleNext} style={{ marginTop: Spacing.s24 }} />
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
  input: {
    borderWidth: 1.5,
    borderColor: '#243447',
    borderRadius: Radius.input,
    padding: Spacing.s16,
    color: Colors.text.primaryDark,
    fontSize: 18,
    height: 56,
  },
  inputCorrect: { borderColor: Colors.status.success },
  inputWrong: { borderColor: Colors.status.error },
  feedbackRow: { flexDirection: 'row', marginTop: Spacing.s8 },
});
