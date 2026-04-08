import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useBattleStore } from '@/store/useBattleStore';
import { QUESTION_COUNT, QUESTION_TIME_MS } from '@/services/battleService';

const TICK_MS = 100;

export default function BattleQuestionScreen() {
  const router = useRouter();
  const {
    battle,
    battleId,
    myUid,
    me,
    opponent,
    myScore,
    opponentScore,
    currentWord,
    options,
    correctIndex,
    selectedOptionIndex,
    hasAnswered,
    timeLeft,
    selectOption,
    setTimeLeft,
  } = useBattleStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount / question change
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [battle?.currentQuestion]);

  // Countdown timer (local, synced to questionStartedAt)
  useEffect(() => {
    if (!battle?.questionStartedAt || battle.status !== 'question') return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - battle.questionStartedAt!;
      const remaining = Math.max(0, (QUESTION_TIME_MS - elapsed) / 1000);
      setTimeLeft(Math.ceil(remaining));
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, TICK_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [battle?.currentQuestion, battle?.questionStartedAt]);

  // Navigate when battle finishes
  useEffect(() => {
    if (battle?.status === 'finished') {
      router.replace('/battle/result');
    }
  }, [battle?.status]);

  const handleOption = useCallback((index: number) => {
    if (hasAnswered) return;
    selectOption(index);
  }, [hasAnswered, selectOption]);

  if (!currentWord || !battle) return null;

  const questionNo = battle.currentQuestion + 1;
  const timerPct = timeLeft / (QUESTION_TIME_MS / 1000);
  const timerColor = timeLeft > 6 ? Colors.status.success : timeLeft > 3 ? Colors.status.warning : Colors.status.error;

  const opponentAnswered = battle.player2
    ? !!battle.answers[battle.player2.uid]?.[battle.currentQuestion]
    : false;
  const myAnswered = myUid ? !!battle.answers[myUid]?.[battle.currentQuestion] : false;

  return (
    <LinearGradient colors={[Colors.bg.primaryDark, Colors.bg.cardDark]} style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <WKText style={styles.playerName} numberOfLines={1}>{me?.displayName ?? '—'}</WKText>
          <WKText style={styles.score}>{myScore}</WKText>
          {myAnswered && <WKText style={styles.answeredBadge}>✓</WKText>}
        </View>

        <View style={styles.questionBadge}>
          <WKText style={styles.questionNo}>{questionNo}/{QUESTION_COUNT}</WKText>
        </View>

        <View style={[styles.playerInfo, styles.playerInfoRight]}>
          {opponentAnswered && <WKText style={styles.answeredBadge}>✓</WKText>}
          <WKText style={styles.score}>{opponentScore}</WKText>
          <WKText style={styles.playerName} numberOfLines={1}>{opponent?.displayName ?? '…'}</WKText>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <Animated.View
          style={[
            styles.timerBarFill,
            { width: `${Math.round(timerPct * 100)}%`, backgroundColor: timerColor },
          ]}
        />
      </View>
      <WKText style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</WKText>

      {/* Word card */}
      <Animated.View style={[styles.wordCard, { opacity: fadeAnim }]}>
        <WKText style={styles.wordLevel}>{currentWord.level}</WKText>
        <WKText style={styles.germanWord}>{currentWord.german}</WKText>
        <WKText style={styles.exampleSentence}>{currentWord.example}</WKText>
      </Animated.View>

      {/* Options */}
      <WKText style={styles.questionPrompt}>Türkçe karşılığı nedir?</WKText>
      <View style={styles.optionsGrid}>
        {options.map((opt, i) => {
          let btnStyle = styles.optionBtn;
          let textStyle = styles.optionText;
          if (hasAnswered) {
            if (i === correctIndex) {
              btnStyle = { ...styles.optionBtn, ...styles.optionCorrect } as any;
              textStyle = { ...styles.optionText, ...styles.optionTextSelected } as any;
            } else if (i === selectedOptionIndex) {
              btnStyle = { ...styles.optionBtn, ...styles.optionWrong } as any;
              textStyle = { ...styles.optionText, ...styles.optionTextSelected } as any;
            }
          }

          return (
            <Pressable
              key={i}
              style={({ pressed }) => [btnStyle, pressed && !hasAnswered && styles.optionPressed]}
              onPress={() => handleOption(i)}
              disabled={hasAnswered}
            >
              <WKText style={styles.optionLetter}>
                {['A', 'B', 'C', 'D'][i]}
              </WKText>
              <WKText style={textStyle}>{opt}</WKText>
            </Pressable>
          );
        })}
      </View>

      {/* Between message */}
      {battle.status === 'between' && (
        <View style={styles.betweenOverlay}>
          <WKText style={styles.betweenText}>
            {selectedOptionIndex === correctIndex ? '✅ Doğru!' : '❌ Yanlış!'}
          </WKText>
          <WKText style={styles.betweenSub}>Sıradaki soru geliyor…</WKText>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  playerInfoRight: {
    justifyContent: 'flex-end',
  },
  playerName: {
    color: Colors.text.secondary,
    fontSize: 12,
    maxWidth: 80,
  },
  score: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  answeredBadge: {
    color: Colors.status.success,
    fontSize: 14,
    fontWeight: '700',
  },
  questionBadge: {
    backgroundColor: Colors.battle.purple,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionNo: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  timerBarBg: {
    height: 6,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  timerBarFill: {
    height: 6,
    borderRadius: 3,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 16,
  },
  wordCard: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.battle.purple + '55',
  },
  wordLevel: {
    color: Colors.battle.purple,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  germanWord: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  exampleSentence: {
    color: Colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  questionPrompt: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionPressed: {
    opacity: 0.7,
    borderColor: Colors.battle.purple,
  },
  optionCorrect: {
    backgroundColor: Colors.status.success + '33',
    borderColor: Colors.status.success,
  },
  optionWrong: {
    backgroundColor: Colors.status.error + '33',
    borderColor: Colors.status.error,
  },
  optionLetter: {
    color: Colors.battle.purple,
    fontWeight: '700',
    fontSize: 15,
    width: 20,
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '700',
  },
  betweenOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.battle.purple,
  },
  betweenText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  betweenSub: {
    color: Colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
});
