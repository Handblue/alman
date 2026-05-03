import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WORDS } from '@/data/words';
import { useFolderStore } from '@/store/useFolderStore';

interface Props {
  visible: boolean;
  folderId: string;
  existingWordIds: number[];
  onClose: () => void;
}

export function AddWordToFolderModal({ visible, folderId, existingWordIds, onClose }: Props) {
  const { addWordToFolder } = useFolderStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORDS.filter(
      (w) =>
        !existingWordIds.includes(w.id) &&
        (q === '' || w.german.toLowerCase().includes(q) || w.turkish.toLowerCase().includes(q)),
    ).slice(0, 60);
  }, [query, existingWordIds]);

  function handleAdd(wordId: number) {
    addWordToFolder(folderId, wordId);
  }

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrap}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <WKText variant="heading2">Kelime Ekle</WKText>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={styles.closeBtn}
            >
              <WKText style={styles.closeText}>✕</WKText>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Almanca veya Türkçe ara…"
            placeholderTextColor={Colors.text.secondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            accessibilityLabel="Kelime arama"
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleAdd(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.german} kelimesini ekle`}
                style={styles.row}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <WKText variant="word" style={styles.german}>{item.german}</WKText>
                  <WKText variant="bodySm" color={Colors.text.secondary}>{item.turkish}</WKText>
                </View>
                <View style={styles.addChip}>
                  <WKText style={styles.addText}>+ Ekle</WKText>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <WKText variant="bodySm" color={Colors.text.secondary} style={styles.empty}>
                Kelime bulunamadı.
              </WKText>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.bg.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s12,
    paddingBottom: Spacing.s32,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.primary,
    alignSelf: 'center',
    marginBottom: Spacing.s16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.s16,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.bg.light,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    fontSize: 15,
    minHeight: 48,
    marginBottom: Spacing.s12,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    minHeight: 56,
  },
  german: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.word.green,
  },
  addChip: {
    backgroundColor: Colors.brand.violetSoft,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
    minHeight: 32,
    justifyContent: 'center',
  },
  addText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.brand.primary,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.border.primary,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.s24,
  },
});
