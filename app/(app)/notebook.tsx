import { useState } from 'react';
import { FlatList, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WORDS, Word } from '@/data/words';
import { useProgressStore } from '@/store/useProgressStore';
import { WordDetailSheet } from '@/components/study/WordDetailSheet';

export default function NotebookScreen() {
  const bookmarkedWords = useProgressStore(s => s.bookmarkedWords);
  const [selected, setSelected] = useState<Word | null>(null);
  const words = WORDS.filter(w => bookmarkedWords.includes(w.id));

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <WKText variant="heading1" style={{ marginBottom: Spacing.s8 }}>Kelime Defterim</WKText>
        <View style={styles.empty}>
          <WKText style={{ fontSize: 48 }}>🤍</WKText>
          <WKText variant="body" color={Colors.text.secondary} style={{ textAlign: 'center' }}>
            Henüz kelime eklemedin.{'\n'}Kelime kartlarında ❤️ ikonuna dokun.
          </WKText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WKText variant="heading1" style={{ marginBottom: Spacing.s4 }}>Kelime Defterim</WKText>
      <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginBottom: Spacing.s24 }}>
        {words.length} kelime
      </WKText>
      <FlatList
        data={words}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${item.german}: ${item.turkish}`}
            onPress={() => setSelected(item)}
            style={styles.row}
          >
            <WKText variant="word" style={{ flex: 1 }}>{item.german}</WKText>
            <WKText variant="bodySm" color={Colors.text.secondary}>{item.turkish}</WKText>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.bg.cardDark }} />}
      />
      <WordDetailSheet word={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark, paddingHorizontal: Spacing.s20, paddingTop: Spacing.s32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.s16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.s12 },
});
