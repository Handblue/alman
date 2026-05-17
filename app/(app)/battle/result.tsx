import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useBattleStore } from '@/store/useBattleStore';
import { useUserStore } from '@/store/useUserStore';
import { battleHistoryService } from '@/services/battleHistoryService';
import { achievementService } from '@/services/achievementService';
import { speakingService } from '@/services/speakingService';
import { useProgressStore } from '@/store/useProgressStore';
import { useSocialStore } from '@/store/useSocialStore';

export default function BattleResultScreen() {
  const router = useRouter();
  const {
    phase,
    battleId,
    opponentName,
    questions,
    localAnswers,
    result,
    p1SubmitResult,
    myScore,
    opponentScore,
    isWinner,
    reset,
  } = useBattleStore();
  const { addXP, xp, streak } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const { friends } = useSocialStore();

  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const processedRef = useRef(false);

  const xpEarned = result?.xpGain ?? (phase === 'done_p1' && p1SubmitResult ? 0 : 0);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    if (phase === 'result' && result) {
      if (result.isWinner) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!result.isDraw) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      achievementService.recordBattleResult(result.isWinner, 0);
      speakingService.awardBattleWinCredits(battleId ?? 'unknown', result.isWinner);

      battleHistoryService.addEntry({
        id: battleId ?? Date.now().toString(),
        battleId: battleId ?? '',
        opponentName,
        opponentIsBot: false,
        didWin: result.isWinner,
        isDraw: result.isDraw,
        myScore: result.score,
        opponentScore: result.opponentScore,
        eloChange: 0,
        xpEarned: result.xpGain,
        playedAt: new Date().toISOString(),
        questionCount: questions.length,
      });

      if (xpEarned > 0) addXP(xpEarned);

      const battleStats = achievementService.getBattleStats();
      const pronStats = achievementService.getPronunciationStats();
      const knownWords = Object.values(wordProgress).filter((w) => w.status === 'known').length;
      const completedUnits = Object.values(unitProgress).filter((u) => u.isCompleted).length;
      achievementService.checkAll({
        xp: xp + xpEarned,
        streak,
        knownWords,
        completedUnits,
        battleWins: battleStats.wins,
        battleCount: battleStats.total,
        pronunciationFourPlus: pronStats.fourPlus,
        folders: 0,
        friends: friends.length,
      });
    }

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [phase]);

  const handleBack = () => {
    reset();
    router.replace('/(app)/battle/lobby');
  };

  const handleHome = () => {
    reset();
    router.replace('/(app)/dashboard');
  };

  // ── P1 "waiting for opponent" view ──────────────────────────────────────────
  if (phase === 'done_p1' && p1SubmitResult) {
    const answerMap = new Map(localAnswers.map((a) => [a.questionIndex, a.answer]));

    return (
      <LinearGradient colors={Colors.gradient.battle as any} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
            <WKText style={styles.waitingEmoji}>⏳</WKText>
            <WKText style={styles.waitingTitle}>Harika!</WKText>
            <WKText style={styles.waitingSubtitle}>Cevaplarınız kaydedildi</WKText>
          </Animated.View>

          <View style={styles.scoreCard}>
            <WKText style={styles.scoreLabelCenter}>Senin Skoru</WKText>
            <WKText style={styles.scoreNumCenter}>
              {p1SubmitResult.score}/{p1SubmitResult.total}
            </WKText>
          </View>

          <View style={styles.waitingBox}>
            <WKText style={styles.waitingBoxTitle}>⚔️ {opponentName} Bekleniyor…</WKText>
            <WKText style={styles.waitingBoxSub}>
              Rakibiniz oynadığında "Beni Bekleyen" listesine düşecek. 72 saat süresi var.
            </WKText>
          </View>

          <WKText style={styles.breakdownTitle}>Senin Cevapların</WKText>
          {questions.map((q, i) => {
            const myAns = answerMap.get(i);
            const correct = myAns === q.correctAnswer;
            const icon = !myAns ? '⏱' : correct ? '✅' : '❌';
            return (
              <View key={i} style={styles.breakdownRow}>
                <WKText style={styles.breakdownIcon}>{icon}</WKText>
                <View style={styles.breakdownInfo}>
                  <WKText style={styles.breakdownGerman}>{q.word}</WKText>
                  <WKText style={styles.breakdownCorrect}>{q.correctAnswer}</WKText>
                  {myAns && !correct && (
                    <WKText style={styles.breakdownWrong}>Senin cevabın: {myAns}</WKText>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={handleBack}>
              <WKText style={styles.primaryBtnText}>Battle Lobisine Dön</WKText>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={handleHome}>
              <WKText style={styles.ghostBtnText}>Ana Sayfa</WKText>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── P2 final result view ─────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const resultText = result.isDraw ? 'Berabere!' : result.isWinner ? 'Kazandın!' : 'Kaybettin';
    const resultColor = result.isDraw
      ? Colors.status.info
      : result.isWinner
      ? Colors.accent.gold
      : Colors.status.error;

    const answerMap = new Map(localAnswers.map((a) => [a.questionIndex, a.answer]));

    return (
      <LinearGradient colors={Colors.gradient.battle as any} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
            <WKText style={styles.resultEmoji}>
              {result.isDraw ? '🤝' : result.isWinner ? '🏆' : '⚔️'}
            </WKText>
            <WKText style={[styles.resultText, { color: resultColor }]}>{resultText}</WKText>
            <WKText style={styles.resultMessage}>{result.message}</WKText>
          </Animated.View>

          {/* Score board */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreCol}>
              <WKText style={styles.scoreName}>Sen</WKText>
              <WKText style={[styles.scoreNum, result.isWinner && styles.scoreWinner]}>
                {result.score}
              </WKText>
            </View>
            <WKText style={styles.scoreDivider}>–</WKText>
            <View style={styles.scoreCol}>
              <WKText style={styles.scoreName} numberOfLines={1}>{opponentName}</WKText>
              <WKText style={[styles.scoreNum, !result.isWinner && !result.isDraw && styles.scoreWinner]}>
                {result.opponentScore}
              </WKText>
            </View>
          </View>

          {/* XP */}
          <View style={styles.xpChip}>
            <WKText style={styles.xpLabel}>XP KAZANILDI</WKText>
            <WKText style={styles.xpValue}>+{result.xpGain}</WKText>
          </View>

          {/* Question breakdown */}
          <WKText style={styles.breakdownTitle}>Soru Dökümü</WKText>
          {questions.map((q, i) => {
            const myAns = answerMap.get(i);
            const correct = myAns === q.correctAnswer;
            const icon = !myAns ? '⏱' : correct ? '✅' : '❌';
            return (
              <View key={i} style={styles.breakdownRow}>
                <WKText style={styles.breakdownIcon}>{icon}</WKText>
                <View style={styles.breakdownInfo}>
                  <WKText style={styles.breakdownGerman}>{q.word}</WKText>
                  <WKText style={styles.breakdownCorrect}>{q.correctAnswer}</WKText>
                  {myAns && !correct && (
                    <WKText style={styles.breakdownWrong}>Senin cevabın: {myAns}</WKText>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={handleBack}>
              <WKText style={styles.primaryBtnText}>Tekrar Meydan Oku</WKText>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => router.push('/(app)/battle/history')}>
              <WKText style={styles.ghostBtnText}>Battle Geçmişi</WKText>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={handleHome}>
              <WKText style={styles.ghostBtnText}>Ana Sayfa</WKText>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Fallback (shouldn't normally show)
  return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <WKText style={{ color: Colors.text.secondary }}>Sonuç yükleniyor…</WKText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 24,
    gap: 16,
  },

  // Waiting (P1)
  waitingEmoji: { fontSize: 56, marginBottom: 8 },
  waitingTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  waitingSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 4 },
  waitingBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'stretch',
    gap: 8,
  },
  waitingBoxTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  waitingBoxSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 19 },

  scoreLabelCenter: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  scoreNumCenter: { color: Colors.accent.gold, fontSize: 40, fontWeight: '900' },

  // Result (P2)
  resultEmoji: { fontSize: 56, marginBottom: 4 },
  resultText: { fontSize: 32, fontWeight: '900', textAlign: 'center' },
  resultMessage: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: 4 },

  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  },
  scoreCol: { alignItems: 'center', flex: 1, gap: 4 },
  scoreName: { color: 'rgba(255,255,255,0.7)', fontSize: 13, maxWidth: 100 },
  scoreNum: { color: '#fff', fontSize: 40, fontWeight: '900' },
  scoreWinner: { color: Colors.accent.gold },
  scoreDivider: { color: 'rgba(255,255,255,0.4)', fontSize: 28, fontWeight: '300' },

  xpChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 2,
  },
  xpLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  xpValue: { color: Colors.accent.gold, fontSize: 24, fontWeight: '900' },

  breakdownTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  breakdownIcon: { fontSize: 18, width: 26, textAlign: 'center', marginTop: 2 },
  breakdownInfo: { flex: 1 },
  breakdownGerman: { color: Colors.word.green, fontWeight: '700', fontSize: 15 },
  breakdownCorrect: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  breakdownWrong: { color: Colors.status.error, fontSize: 12, marginTop: 2 },

  actions: { gap: 12, alignSelf: 'stretch', marginTop: 8 },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.battle.purple, fontWeight: '800', fontSize: 17 },
  ghostBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ghostBtnText: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 15 },
});
