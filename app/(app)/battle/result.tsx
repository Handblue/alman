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
import { useProgressStore } from '@/store/useProgressStore';
import { useSocialStore } from '@/store/useSocialStore';
import { QUESTION_COUNT } from '@/services/battleService';
import { achievementService } from '@/services/achievementService';
import { battleHistoryService } from '@/services/battleHistoryService';
import { speakingService } from '@/services/speakingService';

export default function BattleResultScreen() {
  const router = useRouter();
  const { battle, myUid, me, opponent, myScore, opponentScore, eloChange, isWinner, reset } =
    useBattleStore();
  const { addXP, xp, streak } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const { friends } = useSocialStore();

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const processedRef = useRef(false);

  // XP reward: score / 10 (max 50 from battle)
  const xpEarned = Math.round(myScore / 10);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    // Haptic feedback
    if (isWinner === true) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (isWinner === false) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Save battle stats
    achievementService.recordBattleResult(isWinner === true, eloChange);
    speakingService.awardBattleWinCredits(battle?.id ?? 'unknown', isWinner === true);

    if (battle) {
      battleHistoryService.addEntry({
        id: battle.id,
        battleId: battle.id,
        opponentName: opponent?.displayName ?? 'Bilinmeyen Rakip',
        opponentIsBot: opponent?.isBot ?? false,
        didWin: isWinner === true,
        isDraw: isWinner === null,
        myScore,
        opponentScore,
        eloChange,
        xpEarned,
        playedAt: new Date().toISOString(),
        questionCount: battle.questions.length,
      });
    }

    // Award XP
    if (xpEarned > 0) addXP(xpEarned);

    // Check achievements
    const battleStats = achievementService.getBattleStats();
    const pronStats = achievementService.getPronunciationStats();
    const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
    const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;
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

    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [battle, eloChange, friends.length, isWinner, myScore, opponent?.displayName, opponent?.isBot, opponentScore, streak, wordProgress, unitProgress, xp, xpEarned]);

  const handlePlayAgain = () => {
    reset();
    router.replace('/(app)/battle/lobby');
  };

  const handleHome = () => {
    reset();
    router.replace('/(app)/dashboard');
  };

  if (!battle) return null;

  const resultEmoji = isWinner === true ? '🏆' : isWinner === false ? '😔' : '🤝';
  const resultText = isWinner === true ? 'Kazandın!' : isWinner === false ? 'Kaybettin' : 'Berabere!';
  const resultColor = isWinner === true ? Colors.accent.gold : isWinner === false ? Colors.status.error : Colors.status.info;

  // Per-question breakdown
  const questions = battle.questions;
  const myAnswers = myUid ? battle.answers[myUid] ?? {} : {};

  return (
    <LinearGradient colors={Colors.gradient.battle as any} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Result hero */}
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
          <WKText style={styles.resultEmoji}>{resultEmoji}</WKText>
          <WKText style={[styles.resultText, { color: resultColor }]}>{resultText}</WKText>
        </Animated.View>

        {/* Score board */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCol}>
            <WKText style={styles.scoreName} numberOfLines={1}>{me?.displayName ?? '—'}</WKText>
            <WKText style={[styles.scoreNum, myScore >= opponentScore && styles.scoreWinner]}>
              {myScore}
            </WKText>
          </View>
          <WKText style={styles.scoreDivider}>–</WKText>
          <View style={styles.scoreCol}>
            <WKText style={styles.scoreName} numberOfLines={1}>{opponent?.displayName ?? '—'}</WKText>
            <WKText style={[styles.scoreNum, opponentScore > myScore && styles.scoreWinner]}>
              {opponentScore}
            </WKText>
          </View>
        </View>

        {/* ELO + XP */}
        <View style={styles.rewardsRow}>
          <View style={styles.rewardChip}>
            <WKText style={styles.rewardLabel}>ELO</WKText>
            <WKText style={[styles.rewardValue, { color: eloChange >= 0 ? Colors.status.success : Colors.status.error }]}>
              {eloChange >= 0 ? '+' : ''}{eloChange}
            </WKText>
          </View>
          <View style={styles.rewardChip}>
            <WKText style={styles.rewardLabel}>XP</WKText>
            <WKText style={[styles.rewardValue, { color: Colors.accent.gold }]}>+{xpEarned}</WKText>
          </View>
        </View>

        {/* Accuracy */}
        {(() => {
          const correct = Object.values(myAnswers).filter(a => a.correct).length;
          const accuracy = QUESTION_COUNT > 0 ? Math.round((correct / QUESTION_COUNT) * 100) : 0;
          return (
            <WKText style={styles.accuracy}>
              Doğruluk: {correct}/{QUESTION_COUNT} ({accuracy}%)
            </WKText>
          );
        })()}

        {/* Question breakdown */}
        <WKText style={styles.breakdownTitle}>Soru Dökümü</WKText>
        {questions.map((word, i) => {
          const ans = myAnswers[i];
          const icon = !ans ? '⏱' : ans.correct ? '✅' : '❌';
          return (
            <View key={i} style={styles.breakdownRow}>
              <WKText style={styles.breakdownIcon}>{icon}</WKText>
              <View style={styles.breakdownInfo}>
                <WKText style={styles.breakdownGerman}>{word.german}</WKText>
                <WKText style={styles.breakdownTurkish}>{word.turkish}</WKText>
              </View>
              {ans && (
                <WKText style={styles.breakdownTime}>
                  {ans.answeredAt && battle.questionStartedAt
                    ? `${((ans.answeredAt - (battle.questionStartedAt + i * 14500)) / 1000).toFixed(1)}s`
                    : ''}
                </WKText>
              )}
            </View>
          );
        })}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.playAgainBtn} onPress={handlePlayAgain}>
            <WKText style={styles.playAgainText}>⚔️ Tekrar Oyna</WKText>
          </Pressable>
          <Pressable style={styles.homeBtn} onPress={() => router.push('/(app)/battle/history')}>
            <WKText style={styles.homeText}>Geçmişi Gör</WKText>
          </Pressable>
          <Pressable style={styles.homeBtn} onPress={handleHome}>
            <WKText style={styles.homeText}>Ana Sayfa</WKText>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
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
  resultEmoji: {
    fontSize: 72,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  scoreCol: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  scoreName: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    maxWidth: 100,
  },
  scoreNum: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
  },
  scoreWinner: {
    color: Colors.accent.gold,
  },
  scoreDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 28,
    fontWeight: '300',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
  },
  rewardLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rewardValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  accuracy: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  breakdownTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  breakdownIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownGerman: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  breakdownTurkish: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  breakdownTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  actions: {
    gap: 12,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  playAgainBtn: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: {
    color: Colors.battle.purple,
    fontWeight: '800',
    fontSize: 17,
  },
  homeBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  homeText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: 15,
  },
});
