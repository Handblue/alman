import { View, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WKText, WKChip, PlayButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Word } from '@/data/words';
import { useProgressStore } from '@/store/useProgressStore';
import { useFolderStore } from '@/store/useFolderStore';
import { useAudio } from '@/hooks/useAudio';
import { useSpeech } from '@/hooks/useSpeech';

interface Props {
  word: Word | null;
  onClose: () => void;
}

export function WordDetailSheet({ word, onClose }: Props) {
  const { bookmarkedWords, toggleBookmark } = useProgressStore();
  const { folders, addWordToFolder, removeWordFromFolder, isWordInFolder } = useFolderStore();
  const { play, stop, isPlaying, status } = useAudio();
  const { speak, stop: stopSpeech, isSpeaking, status: speechStatus } = useSpeech();
  
  if (!word) return null;
  const isBookmarked = bookmarkedWords.includes(word.id);

  // Use TTS if no audioUrl, otherwise use pre-recorded audio
  const isAudioActive = isPlaying || isSpeaking;
  const audioStatus = isPlaying ? status : speechStatus;

  function handleAudioPlay() {
    if (isAudioActive) {
      isPlaying ? stop() : stopSpeech();
    } else if (word.audioUrl) {
      play(word.audioUrl);
    } else {
      speak(word.german);
    }
  }

  function handleFolderToggle(folderId: string) {
    if (isWordInFolder(folderId, word!.id)) {
      removeWordFromFolder(folderId, word!.id);
    } else {
      addWordToFolder(folderId, word!.id);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

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
            <View style={{ flex: 1 }}>
              <WKText variant="word">{word.german}</WKText>
              <PlayButton
                onPress={handleAudioPlay}
                isPlaying={isAudioActive}
                isLoading={audioStatus === 'loading'}
                size={40}
              />
            </View>
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

          {/* Folder section */}
          {folders.length > 0 && (
            <View style={folderStyles.section}>
              <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginBottom: Spacing.s8 }}>
                Klasöre Ekle:
              </WKText>
              <View style={folderStyles.chipRow}>
                {folders.map(folder => {
                  const inFolder = isWordInFolder(folder.id, word.id);
                  return (
                    <TouchableOpacity
                      key={folder.id}
                      onPress={() => handleFolderToggle(folder.id)}
                      accessibilityRole="button"
                      accessibilityLabel={inFolder ? `${folder.name} klasöründen çıkar` : `${folder.name} klasörüne ekle`}
                      accessibilityState={{ selected: inFolder }}
                      style={[
                        folderStyles.chip,
                        inFolder ? folderStyles.chipActive : folderStyles.chipInactive,
                      ]}
                    >
                      <WKText
                        variant="caption"
                        color={inFolder ? Colors.status.success : Colors.text.secondary}
                        style={folderStyles.chipLabel}
                      >
                        {inFolder ? '✓ ' : ''}{folder.name}
                      </WKText>
                    </TouchableOpacity>
                  );
                })}
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

const folderStyles = StyleSheet.create({
  section: {
    marginTop: Spacing.s20,
    paddingTop: Spacing.s16,
    borderTopWidth: 1,
    borderTopColor: Colors.bg.primaryDark,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  chip: {
    borderRadius: Radius.chip,
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s16,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.status.success + '20',
    borderColor: Colors.status.success,
  },
  chipInactive: {
    backgroundColor: Colors.bg.primaryDark,
    borderColor: Colors.text.secondary,
  },
  chipLabel: {
    fontWeight: '500',
  },
});
