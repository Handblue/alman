import { useState } from 'react';
import { FlatList, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WKText, WKButton, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WORDS, Word } from '@/data/words';
import { useProgressStore } from '@/store/useProgressStore';
import { useFolderStore, Folder } from '@/store/useFolderStore';
import { WordDetailSheet } from '@/components/study/WordDetailSheet';
import { CreateFolderModal } from '@/components/folder/CreateFolderModal';

type Tab = 'notebook' | 'folders';

const MAX_FOLDERS = 3;

export default function NotebookScreen() {
  const router = useRouter();
  const bookmarkedWords = useProgressStore(s => s.bookmarkedWords);
  const { folders } = useFolderStore();
  const [activeTab, setActiveTab] = useState<Tab>('notebook');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const words = WORDS.filter(w => bookmarkedWords.includes(w.id));
  const atFolderLimit = folders.length >= MAX_FOLDERS;

  function handleFolderCreated(_folderId: string) {
    setShowCreateModal(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen title */}
      <WKText variant="heading1" style={styles.title}>Kelime Defterim</WKText>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('notebook')}
          accessibilityRole="button"
          accessibilityLabel="Defterim sekmesi"
          accessibilityState={{ selected: activeTab === 'notebook' }}
          style={[styles.tab, activeTab === 'notebook' && styles.tabActive]}
        >
          <WKText
            variant="body"
            color={activeTab === 'notebook' ? Colors.brand.primary : Colors.text.secondary}
            style={styles.tabText}
          >
            ❤️ Defterim
          </WKText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('folders')}
          accessibilityRole="button"
          accessibilityLabel="Klasörlerim sekmesi"
          accessibilityState={{ selected: activeTab === 'folders' }}
          style={[styles.tab, activeTab === 'folders' && styles.tabActive]}
        >
          <WKText
            variant="body"
            color={activeTab === 'folders' ? Colors.brand.primary : Colors.text.secondary}
            style={styles.tabText}
          >
            📁 Klasörlerim
          </WKText>
        </TouchableOpacity>
      </View>

      {/* Defterim Tab */}
      {activeTab === 'notebook' && (
        <>
          {words.length === 0 ? (
            <View style={styles.empty}>
              <WKText style={styles.emptyEmoji}>🤍</WKText>
              <WKText variant="body" color={Colors.text.secondary} style={styles.emptyText}>
                Henüz kelime eklemedin.{'\n'}Kelime kartlarında ❤️ ikonuna dokun.
              </WKText>
            </View>
          ) : (
            <>
              <WKText variant="bodySm" color={Colors.text.secondary} style={styles.countLabel}>
                {words.length} kelime
              </WKText>
              <FlatList
                data={words}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${item.german}: ${item.turkish}`}
                    onPress={() => setSelectedWord(item)}
                    style={styles.wordRow}
                  >
                    <WKText variant="word" style={{ flex: 1 }}>{item.german}</WKText>
                    <WKText variant="bodySm" color={Colors.text.secondary}>{item.turkish}</WKText>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.separator} />
                )}
              />
            </>
          )}
        </>
      )}

      {/* Klasörlerim Tab */}
      {activeTab === 'folders' && (
        <View style={{ flex: 1 }}>
          {/* Header row */}
          <View style={styles.foldersHeader}>
            <WKText variant="heading2">Klasörlerim</WKText>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Yeni klasör oluştur"
              disabled={atFolderLimit}
              style={[styles.addIconBtn, atFolderLimit && styles.addIconBtnDisabled]}
            >
              <WKText variant="heading2" color={atFolderLimit ? Colors.text.secondary : Colors.brand.primary}>
                +
              </WKText>
            </TouchableOpacity>
          </View>

          {/* Limit warning */}
          {atFolderLimit && (
            <WKText variant="bodySm" color={Colors.status.warning} style={styles.limitWarning}>
              Ücretsiz planda maksimum 3 klasör.
            </WKText>
          )}

          {folders.length === 0 ? (
            <View style={styles.empty}>
              <WKText style={styles.emptyEmoji}>📁</WKText>
              <WKText variant="body" color={Colors.text.secondary} style={styles.emptyText}>
                Henüz klasör oluşturmadın.
              </WKText>
            </View>
          ) : (
            <FlatList
              data={folders}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: Spacing.s32 }}
              renderItem={({ item }: { item: Folder }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/folder/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} klasörü, ${item.wordIds.length} kelime`}
                  style={styles.folderCard}
                >
                  <View style={styles.folderCardInner}>
                    <WKText style={styles.folderEmoji}>📁</WKText>
                    <View style={{ flex: 1 }}>
                      <WKText variant="heading2">{item.name}</WKText>
                      <WKText variant="bodySm" color={Colors.text.secondary}>
                        {item.wordIds.length} kelime
                      </WKText>
                    </View>
                    <WKText variant="heading2" color={Colors.text.secondary}>›</WKText>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.s12 }} />}
            />
          )}

          {/* Bottom CTA */}
          {!atFolderLimit && (
            <WKButton
              label="+ Yeni Klasör"
              variant="secondary"
              onPress={() => setShowCreateModal(true)}
              style={styles.newFolderBtn}
            />
          )}
        </View>
      )}

      <WordDetailSheet word={selectedWord} onClose={() => setSelectedWord(null)} />

      <CreateFolderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleFolderCreated}
      />
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
  title: {
    marginBottom: Spacing.s16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.cardDark,
    marginBottom: Spacing.s16,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.s12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: Colors.brand.primary,
  },
  tabText: {
    fontWeight: '600',
  },
  countLabel: {
    marginBottom: Spacing.s12,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s12,
    minHeight: 44,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.bg.cardDark,
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
  foldersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.s8,
  },
  addIconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconBtnDisabled: {
    opacity: 0.4,
  },
  limitWarning: {
    marginBottom: Spacing.s12,
  },
  folderCard: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.card,
    padding: Spacing.s16,
    minHeight: 64,
  },
  folderCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  folderEmoji: {
    fontSize: 24,
  },
  newFolderBtn: {
    marginBottom: Spacing.s16,
  },
});
