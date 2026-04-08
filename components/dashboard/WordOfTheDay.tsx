import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { WORDS } from '@/data/words';
import { pronunciationService } from '@/services/pronunciationService';

/** Deterministically pick a word based on today's date (same word all day) */
function getWordOfTheDay() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return WORDS[seed % WORDS.length];
}

export function WordOfTheDay() {
  const word = useMemo(() => getWordOfTheDay(), []);
  const [revealed, setRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (speaking) return;
    setSpeaking(true);
    await pronunciationService.playTTS(word.german);
    setSpeaking(false);
  };

  return (
    <LinearGradient
      colors={['#1a1f3a', '#243447']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <WKText style={styles.title}>📅 Günün Kelimesi</WKText>
        <View style={styles.levelChip}>
          <WKText style={styles.levelText}>{word.level}</WKText>
        </View>
      </View>

      <WKText style={styles.german}>{word.german}</WKText>

      <WKText style={styles.example} numberOfLines={2}>{word.example}</WKText>

      <View style={styles.actions}>
        {!revealed ? (
          <Pressable style={styles.revealBtn} onPress={() => setRevealed(true)}>
            <WKText style={styles.revealText}>Çeviriyi Gör</WKText>
          </Pressable>
        ) : (
          <View style={styles.translation}>
            <WKText style={styles.turkish}>{word.turkish}</WKText>
            <WKText style={styles.exampleTranslation}>{word.exampleTranslation}</WKText>
          </View>
        )}

        <Pressable style={styles.speakBtn} onPress={handleSpeak} disabled={speaking}>
          <WKText style={styles.speakIcon}>{speaking ? '🔊' : '🔈'}</WKText>
        </Pressable>
      </View>

      {word.synonyms && word.synonyms.length > 0 && revealed && (
        <View style={styles.synonymRow}>
          <WKText style={styles.synonymLabel}>Eş anlamlı: </WKText>
          <WKText style={styles.synonymText}>{word.synonyms.join(', ')}</WKText>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '33',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  levelChip: {
    backgroundColor: Colors.brand.primary + '33',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '66',
  },
  levelText: {
    color: Colors.brand.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  german: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  example: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  revealBtn: {
    flex: 1,
    backgroundColor: Colors.brand.primary + '22',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.primary + '66',
  },
  revealText: {
    color: Colors.brand.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  translation: {
    flex: 1,
    gap: 2,
  },
  turkish: {
    color: Colors.status.success,
    fontSize: 18,
    fontWeight: '800',
  },
  exampleTranslation: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  speakBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bg.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: {
    fontSize: 20,
  },
  synonymRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  synonymLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  synonymText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
