import { useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { WORDS, Word } from '@/data/words';
import { WordDetailSheet } from '@/components/study/WordDetailSheet';
import { useProgressStore } from '@/store/useProgressStore';

export default function WordListScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const words = WORDS.filter(w => w.unitId === Number(unitId));
  const [selected, setSelected] = useState<Word | null>(null);
  const bookmarkedWords = useProgressStore(s => s.bookmarkedWords);

  return (
    <SafeAreaView style={styles.container}>
      <WKText variant="heading1" style={{ marginBottom: Spacing.s24 }}>Kelimeler</WKText>
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
            <View style={{ flex: 1 }}>
              <WKText variant="word">{item.german}</WKText>
              <WKText variant="bodySm" color={Colors.text.secondary}>{item.turkish}</WKText>
            </View>
            {bookmarkedWords.includes(item.id) && (
              <WKText accessibilityLabel="Defterde">❤️</WKText>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <WordDetailSheet word={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.light, paddingHorizontal: Spacing.s20, paddingTop: Spacing.s32 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.s12 },
  separator: { height: 1, backgroundColor: Colors.bg.cardDark },
});
