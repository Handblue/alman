import { useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WKText, WKChip } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WORDS, Word } from '@/data/words';
import { useFolderStore } from '@/store/useFolderStore';

export default function FolderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { folders, deleteFolder, renameFolder, removeWordFromFolder } = useFolderStore();
  const folder = folders.find(f => f.id === id);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder?.name ?? '');

  if (!folder) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backBtn}
        >
          <WKText variant="bodyLg" color={Colors.brand.primary}>← Geri</WKText>
        </TouchableOpacity>
        <View style={styles.empty}>
          <WKText variant="body" color={Colors.text.secondary}>Klasör bulunamadı.</WKText>
        </View>
      </SafeAreaView>
    );
  }

  const currentFolder = folder;

  const words: Word[] = WORDS.filter(w => currentFolder.wordIds.includes(w.id));

  function handleDelete() {
    Alert.alert(
      'Klasörü Sil',
      `"${currentFolder.name}" klasörünü silmek istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteFolder(currentFolder.id);
            router.back();
          },
        },
      ],
    );
  }

  function handleRemoveWord(wordId: number, german: string) {
    Alert.alert(
      'Kelimeyi Çıkar',
      `"${german}" klasörden çıkarılsın mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: () => removeWordFromFolder(currentFolder.id, wordId),
        },
      ],
    );
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== currentFolder.name) {
      renameFolder(currentFolder.id, trimmed);
    } else {
      setRenameValue(currentFolder.name);
    }
    setIsRenaming(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation header */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backBtn}
        >
          <WKText variant="bodyLg" color={Colors.brand.primary}>← Geri</WKText>
        </TouchableOpacity>

        {/* Delete folder */}
        <TouchableOpacity
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Klasörü sil"
          style={styles.iconBtn}
        >
          <WKText style={styles.iconBtnText}>🗑️</WKText>
        </TouchableOpacity>
      </View>

      {/* Folder name (editable) */}
      <View style={styles.titleRow}>
        {isRenaming ? (
          <TextInput
            style={styles.renameInput}
            value={renameValue}
            onChangeText={text => setRenameValue(text.slice(0, 30))}
            maxLength={30}
            autoFocus
            onBlur={commitRename}
            onSubmitEditing={commitRename}
            returnKeyType="done"
            accessibilityLabel="Klasör adını düzenle"
          />
        ) : (
          <WKText variant="heading1" style={{ flex: 1 }}>{currentFolder.name}</WKText>
        )}

        <TouchableOpacity
          onPress={() => {
            setRenameValue(currentFolder.name);
            setIsRenaming(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Klasör adını düzenle"
          style={styles.iconBtn}
        >
          <WKText style={styles.iconBtnText}>✏️</WKText>
        </TouchableOpacity>
      </View>

      <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginBottom: Spacing.s24 }}>
        {currentFolder.wordIds.length} kelime
      </WKText>

      {words.length === 0 ? (
        <View style={styles.empty}>
          <WKText style={styles.emptyEmoji}>📭</WKText>
          <WKText variant="body" color={Colors.text.secondary} style={styles.emptyText}>
            Klasörünüz boş.{'\n'}Kelime kartlarından + ikonuyla ekleyebilirsiniz.
          </WKText>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingBottom: Spacing.s32 }}
          renderItem={({ item }) => (
            <View style={styles.wordRow}>
              <View style={{ flex: 1 }}>
                <WKText variant="word">{item.german}</WKText>
                <WKText variant="bodySm" color={Colors.text.secondary}>{item.turkish}</WKText>
              </View>

              <WKChip
                label={item.level}
                color={Colors.brand.primary + '20'}
                textColor={Colors.brand.primary}
                style={{ marginRight: Spacing.s8 }}
              />

              <TouchableOpacity
                onPress={() => handleRemoveWord(item.id, item.german)}
                accessibilityRole="button"
                accessibilityLabel={`${item.german} kelimesini klasörden çıkar`}
                style={styles.removeBtn}
              >
                <WKText color={Colors.status.error} style={styles.removeBtnText}>✕</WKText>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.s16,
  },
  backBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: Spacing.s8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s4,
    gap: Spacing.s8,
  },
  renameInput: {
    flex: 1,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    fontSize: 24,
    fontWeight: '700',
    minHeight: 48,
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 22,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    minHeight: 56,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.bg.cardDark,
  },
  removeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s16,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    textAlign: 'center',
  },
});
