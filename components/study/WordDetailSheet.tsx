import { View, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WKText, WKChip } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Word } from '@/data/words';
import { useProgressStore } from '@/store/useProgressStore';

interface Props {
  word: Word | null;
  onClose: () => void;
}

export function WordDetailSheet({ word, onClose }: Props) {
  const { bookmarkedWords, toggleBookmark } = useProgressStore();
  if (!word) return null;
  const isBookmarked = bookmarkedWords.includes(word.id);

  function handleBookmark() {
    toggleBookmark(word!.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <Modal
      visible={!!word}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <WKText variant="word" style={{ flex: 1 }}>{word.german}</WKText>
            <TouchableOpacity
              onPress={handleBookmark}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Defterden çıkar' : 'Deftere ekle'}
              accessibilityState={{ selected: isBookmarked }}
              style={styles.bookmarkBtn}
            >
              <WKText style={{ fontSize: 24 }}>{isBookmarked ? '❤️' : '🤍'}</WKText>
            </TouchableOpacity>
          </View>

          <WKText variant="bodyLg" style={{ marginBottom: Spacing.s16 }}>{word.turkish}</WKText>

          <WKChip
            label={word.level}
            color={Colors.brand.primary + '20'}
            textColor={Colors.brand.primary}
            style={{ alignSelf: 'flex-start', marginBottom: Spacing.s16 }}
          />

          <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginBottom: Spacing.s4 }}>
            Örnek cümle:
          </WKText>
          <WKText variant="body" style={{ fontStyle: 'italic', marginBottom: Spacing.s4 }}>
            {word.example}
          </WKText>
          <WKText variant="bodySm" color={Colors.text.secondary}>
            {word.exampleTranslation}
          </WKText>

          {word.synonyms && word.synonyms.length > 0 && (
            <View style={{ marginTop: Spacing.s16 }}>
              <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginBottom: Spacing.s8 }}>
                Eş anlamlılar:
              </WKText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s8 }}>
                {word.synonyms.map(s => <WKChip key={s} label={s} />)}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000080' },
  sheet: {
    backgroundColor: Colors.bg.cardDark,
    borderTopLeftRadius: Radius.bottomSheet,
    borderTopRightRadius: Radius.bottomSheet,
    padding: Spacing.s24,
    maxHeight: '70%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#4A5568', borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.s16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.s8 },
  bookmarkBtn: { padding: Spacing.s4, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
