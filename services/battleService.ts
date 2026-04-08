import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';
import { WORDS, Word } from '@/data/words';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BattlePlayer {
  uid: string;
  displayName: string;
  xp: number;
  elo: number;
  ready: boolean;
  isBot?: boolean;
}

export interface BattleAnswer {
  optionIndex: number;
  correct: boolean;
  answeredAt: number; // unix ms
}

export type BattleStatus =
  | 'waiting'    // player1 created, waiting for player2
  | 'countdown'  // both joined, 3s countdown
  | 'question'   // showing a question
  | 'between'    // brief pause between questions (showing results)
  | 'finished';  // battle over

export interface Battle {
  id: string;
  status: BattleStatus;
  player1: BattlePlayer;
  player2: BattlePlayer | null;
  questions: Word[];
  currentQuestion: number;   // 0-4
  scores: Record<string, number>;
  answers: Record<string, Record<number, BattleAnswer>>; // uid → questionIdx → answer
  createdAt: number;
  startedAt: number | null;
  questionStartedAt: number | null; // for timer sync
  finishedAt: number | null;
  winnerId: string | null;
  eloChanges: Record<string, number>;
  isBot: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_COUNT = 5;
const QUESTION_TIME_MS = 12_000;    // 12s per question
const MATCHMAKING_TIMEOUT_MS = 8_000; // 8s then spawn bot
const BETWEEN_DURATION_MS = 2_500;  // 2.5s between questions
const ELO_K = 32;
const DEFAULT_ELO = 1200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickQuestions(): Word[] {
  const pool = [...WORDS];
  const picked: Word[] = [];
  while (picked.length < QUESTION_COUNT && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

/** Returns 4 Turkish options where one is correct */
export function buildOptions(word: Word): { options: string[]; correctIndex: number } {
  const correct = word.turkish;
  const distractors = WORDS.filter(w => w.id !== word.id && w.turkish !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.turkish);

  const options = [...distractors, correct].sort(() => Math.random() - 0.5);
  return { options, correctIndex: options.indexOf(correct) };
}

function calcElo(
  playerElo: number,
  opponentElo: number,
  result: 0 | 0.5 | 1,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(playerElo + ELO_K * (result - expected));
}

function botDisplayName(): string {
  const names = ['KI-Bot', 'RoboLerner', 'DeutschBot', 'WortKampf-KI', 'AlmanBot'];
  return names[Math.floor(Math.random() * names.length)];
}

// ─── Service ──────────────────────────────────────────────────────────────────

class BattleService {
  private unsubscribeBattle: Unsubscribe | null = null;
  private botTimer: ReturnType<typeof setTimeout> | null = null;
  private questionTimer: ReturnType<typeof setTimeout> | null = null;

  /** Find an open battle or create one */
  async findMatch(player: { xp: number; elo?: number }): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const playerElo = player.elo ?? DEFAULT_ELO;
    const me: BattlePlayer = {
      uid: user.uid,
      displayName: user.displayName ?? user.uid.slice(0, 8),
      xp: player.xp,
      elo: playerElo,
      ready: false,
    };

    // Look for a waiting battle
    const battlesRef = collection(db, 'battles');
    const q = query(battlesRef, where('status', '==', 'waiting'), limit(5));
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const battle = d.data() as Battle;
      // Don't join own battle
      if (battle.player1.uid === user.uid) continue;

      // Join this battle
      await updateDoc(doc(db, 'battles', battle.id), {
        player2: me,
        status: 'countdown',
        startedAt: Date.now(),
      });
      return battle.id;
    }

    // No match found — create a new battle and wait
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newBattle: Battle = {
      id: battleId,
      status: 'waiting',
      player1: { ...me, ready: true },
      player2: null,
      questions: pickQuestions(),
      currentQuestion: 0,
      scores: { [user.uid]: 0 },
      answers: {},
      createdAt: Date.now(),
      startedAt: null,
      questionStartedAt: null,
      finishedAt: null,
      winnerId: null,
      eloChanges: {},
      isBot: false,
    };

    await setDoc(doc(db, 'battles', battleId), newBattle);
    return battleId;
  }

  /** Spawn AI bot after timeout (called by creator if nobody joins) */
  scheduleBot(battleId: string, onBotAdded: () => void): void {
    this.clearBotTimer();
    this.botTimer = setTimeout(async () => {
      const battleRef = doc(db, 'battles', battleId);
      const snap = await getDoc(battleRef);
      if (!snap.exists()) return;
      const battle = snap.data() as Battle;
      if (battle.status !== 'waiting') return; // someone joined

      const bot: BattlePlayer = {
        uid: `bot_${Date.now()}`,
        displayName: botDisplayName(),
        xp: battle.player1.xp + Math.floor((Math.random() - 0.5) * 200),
        elo: battle.player1.elo + Math.floor((Math.random() - 0.5) * 100),
        ready: true,
        isBot: true,
      };

      await updateDoc(battleRef, {
        player2: bot,
        status: 'countdown',
        startedAt: Date.now(),
        isBot: true,
        [`scores.${bot.uid}`]: 0,
      });

      onBotAdded();
    }, MATCHMAKING_TIMEOUT_MS);
  }

  clearBotTimer(): void {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }

  /** Start showing the first question (called after countdown) */
  async startQuestion(battleId: string, questionIndex: number): Promise<void> {
    await updateDoc(doc(db, 'battles', battleId), {
      status: 'question',
      currentQuestion: questionIndex,
      questionStartedAt: Date.now(),
    });

    // Auto-advance if time runs out (host side drives this)
    this.clearQuestionTimer();
    this.questionTimer = setTimeout(async () => {
      await this.advanceQuestion(battleId, questionIndex);
    }, QUESTION_TIME_MS + 500);
  }

  /** Record a player's answer */
  async submitAnswer(
    battleId: string,
    questionIndex: number,
    optionIndex: number,
    correct: boolean,
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const answer: BattleAnswer = {
      optionIndex,
      correct,
      answeredAt: Date.now(),
    };

    const points = correct ? 100 : 0;

    await updateDoc(doc(db, 'battles', battleId), {
      [`answers.${user.uid}.${questionIndex}`]: answer,
      [`scores.${user.uid}`]: await this._incrementScore(battleId, user.uid, points),
    });

    // Check if both players answered
    const snap = await getDoc(doc(db, 'battles', battleId));
    if (!snap.exists()) return;
    const battle = snap.data() as Battle;

    const p1Answered = !!battle.answers[battle.player1.uid]?.[questionIndex];
    const p2Uid = battle.player2?.uid;
    const p2Answered = p2Uid ? !!battle.answers[p2Uid]?.[questionIndex] : true; // bot auto-answers

    if (p1Answered && p2Answered) {
      this.clearQuestionTimer();
      await this.advanceQuestion(battleId, questionIndex);
    }

    // Simulate bot answer
    if (battle.isBot && battle.player2?.isBot && p2Uid) {
      const botCorrect = Math.random() > 0.4; // 60% correct
      const botDelay = 2000 + Math.random() * 5000;
      setTimeout(async () => {
        const botAnswer: BattleAnswer = {
          optionIndex: botCorrect ? -1 : 0,
          correct: botCorrect,
          answeredAt: Date.now(),
        };
        const botPoints = botCorrect ? 100 : 0;
        await updateDoc(doc(db, 'battles', battleId), {
          [`answers.${p2Uid}.${questionIndex}`]: botAnswer,
          [`scores.${p2Uid}`]: await this._incrementScore(battleId, p2Uid, botPoints),
        });

        // Re-check advancement
        const snap2 = await getDoc(doc(db, 'battles', battleId));
        if (!snap2.exists()) return;
        const b2 = snap2.data() as Battle;
        const playerAnswered = !!b2.answers[b2.player1.uid]?.[questionIndex];
        if (playerAnswered) {
          this.clearQuestionTimer();
          await this.advanceQuestion(battleId, questionIndex);
        }
      }, botDelay);
    }
  }

  private async _incrementScore(
    battleId: string,
    uid: string,
    addPoints: number,
  ): Promise<number> {
    const snap = await getDoc(doc(db, 'battles', battleId));
    if (!snap.exists()) return addPoints;
    const battle = snap.data() as Battle;
    return (battle.scores[uid] ?? 0) + addPoints;
  }

  async advanceQuestion(battleId: string, completedIndex: number): Promise<void> {
    const snap = await getDoc(doc(db, 'battles', battleId));
    if (!snap.exists()) return;
    const battle = snap.data() as Battle;
    if (battle.status === 'finished') return;
    if (battle.currentQuestion !== completedIndex) return; // already advanced

    const next = completedIndex + 1;

    if (next >= QUESTION_COUNT) {
      await this.finishBattle(battleId);
    } else {
      await updateDoc(doc(db, 'battles', battleId), {
        status: 'between',
        currentQuestion: next,
      });

      setTimeout(async () => {
        await this.startQuestion(battleId, next);
      }, BETWEEN_DURATION_MS);
    }
  }

  async finishBattle(battleId: string): Promise<void> {
    const snap = await getDoc(doc(db, 'battles', battleId));
    if (!snap.exists()) return;
    const battle = snap.data() as Battle;
    if (battle.status === 'finished') return;

    const p1uid = battle.player1.uid;
    const p2uid = battle.player2?.uid ?? '';
    const p1score = battle.scores[p1uid] ?? 0;
    const p2score = battle.scores[p2uid] ?? 0;

    let winnerId: string | null = null;
    if (p1score > p2score) winnerId = p1uid;
    else if (p2score > p1score) winnerId = p2uid;
    // else draw

    // ELO calculation
    const p1elo = battle.player1.elo;
    const p2elo = battle.player2?.elo ?? DEFAULT_ELO;
    const p1result: 0 | 0.5 | 1 = winnerId === p1uid ? 1 : winnerId === null ? 0.5 : 0;
    const p2result: 0 | 0.5 | 1 = winnerId === p2uid ? 1 : winnerId === null ? 0.5 : 0;
    const newP1elo = calcElo(p1elo, p2elo, p1result);
    const newP2elo = calcElo(p2elo, p1elo, p2result);

    await updateDoc(doc(db, 'battles', battleId), {
      status: 'finished',
      finishedAt: Date.now(),
      winnerId,
      eloChanges: {
        [p1uid]: newP1elo - p1elo,
        [p2uid]: newP2elo - p2elo,
      },
    });
  }

  /** Subscribe to live battle updates */
  subscribe(battleId: string, callback: (battle: Battle) => void): Unsubscribe {
    this.cleanup();
    this.unsubscribeBattle = onSnapshot(
      doc(db, 'battles', battleId),
      snap => {
        if (snap.exists()) callback(snap.data() as Battle);
      },
    );
    return this.unsubscribeBattle;
  }

  /** Get a single battle snapshot */
  async getBattle(battleId: string): Promise<Battle | null> {
    const snap = await getDoc(doc(db, 'battles', battleId));
    return snap.exists() ? (snap.data() as Battle) : null;
  }

  clearQuestionTimer(): void {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }
  }

  cleanup(): void {
    if (this.unsubscribeBattle) {
      this.unsubscribeBattle();
      this.unsubscribeBattle = null;
    }
    this.clearBotTimer();
    this.clearQuestionTimer();
  }
}

export const battleService = new BattleService();
export { QUESTION_COUNT, QUESTION_TIME_MS, BETWEEN_DURATION_MS, DEFAULT_ELO };
