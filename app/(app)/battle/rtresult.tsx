import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useRealtimeBattleStore } from '@/store/useRealtimeBattleStore';
import { authService } from '@/services/authService';

export default function RTResultScreen() {
  const router = useRouter();
  const { myScore, opponentScore, opponentName, questions, isDraw, winnerId, reset } = useRealtimeBattleStore();

  const myId = authService.getCurrentUser()?.id ?? '';
  const isWinner = !isDraw && winnerId === myId;

  const resultEmoji = isDraw ? '🤝' : isWinner ? '🏆' : '😔';
  const resultTitle = isDraw ? 'Beraberlik!' : isWinner ? 'Kazandın!' : 'Kaybettin';
  const resultGradient = isWinner
    ? ['#2E7D32', '#4CAF50'] as any
    : isDraw
    ? ['#FF6D00', '#FFCA28'] as any
    : Colors.gradient.battle as any;

  const handlePlayAgain = () => {
    reset();
    router.replace('/(app)/battle/rtmatch');
  };

  const handleBack = () => {
    reset();
    router.replace('/(app)/battle/lobby');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={resultGradient} style={styles.header}>
        <WKText style={styles.emoji}>{resultEmoji}</WKText>
        <WKText style={styles.title}>{resultTitle}</WKText>

        <View style={styles.scoreRow}>
          <View style={styles.scoreBlock}>
            <WKText style={styles.scoreLabel}>Sen</WKText>
            <WKText style={styles.scoreValue}>{myScore}</WKText>
          </View>
          <WKText style={styles.scoreDivider}>/</WKText>
          <View style={styles.scoreBlock}>
            <WKText style={styles.scoreLabel}>{opponentName}</WKText>
            <WKText style={styles.scoreValue}>{opponentScore}</WKText>
          </View>
        </View>
        <WKText style={styles.totalText}>Toplam {questions.length} soru</WKText>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <WKText style={styles.sectionTitle}>Sorular</WKText>
        {questions.map((q, i) => (
          <View key={i} style={styles.questionRow}>
            <WKText style={styles.questionNum}>{i + 1}.</WKText>
            <View style={{ flex: 1 }}>
              <WKText style={styles.questionWord}>{q.word}</WKText>
              <WKText style={styles.questionAnswer}>{q.options[0]}</WKText>
            </View>
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable style={styles.playAgainBtn} onPress={handlePlayAgain}>
            <WKText style={styles.playAgainText}>⚡ Tekrar Oyna</WKText>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <WKText style={styles.backText}>← Lobbiye Dön</WKText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark },

  header: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: Spacing.s20,
    alignItems: 'center',
    gap: 8,
  },
  emoji: { fontSize: 56, marginBottom: 4 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800' },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  scoreBlock: { alignItems: 'center' },
  scoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  scoreValue: { color: '#fff', fontSize: 48, fontWeight: '800' },
  scoreDivider: { color: 'rgba(255,255,255,0.5)', fontSize: 32, fontWeight: '300' },
  totalText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },

  content: { padding: Spacing.s20, gap: 12, paddingBottom: 48 },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },

  questionRow: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  questionNum: { color: Colors.text.secondary, fontSize: 14, fontWeight: '600', minWidth: 24 },
  questionWord: { color: Colors.word.green, fontSize: 16, fontWeight: '700' },
  questionAnswer: { color: Colors.text.secondary, fontSize: 13, marginTop: 2 },

  actions: { gap: 12, marginTop: 8 },
  playAgainBtn: {
    backgroundColor: Colors.battle.purple,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  playAgainText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  backBtn: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backText: { color: Colors.text.secondary, fontWeight: '600', fontSize: 15 },
});
