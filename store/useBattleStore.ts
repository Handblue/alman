import { create } from 'zustand';
import { battleApiService, BattleQuestion, BattleResult } from '@/services/battleApiService';

export type BattlePhase =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'between'      // brief pause after answering, before next question
  | 'submitting'
  | 'done_p1'      // challenger submitted, waiting for challengee
  | 'result';      // final result visible

interface LocalAnswer {
  questionIndex: number;
  answer: string;
  timeMs: number;
}

interface BattleState {
  // ── Metadata ──────────────────────────────────────────────────────────
  battleId: string | null;
  role: 'challenger' | 'challengee' | null;
  opponentName: string;

  // ── Questions ─────────────────────────────────────────────────────────
  questions: BattleQuestion[];
  timePerQuestion: number; // ms

  // ── Question UI ───────────────────────────────────────────────────────
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  hasAnswered: boolean;
  timeLeft: number; // seconds
  questionStartMs: number;

  // ── Collected answers ─────────────────────────────────────────────────
  localAnswers: LocalAnswer[];

  // ── Phase ─────────────────────────────────────────────────────────────
  phase: BattlePhase;
  error: string | null;

  // ── Result ────────────────────────────────────────────────────────────
  result: BattleResult | null;
  p1SubmitResult: { score: number; total: number; message: string } | null;

  // ── Result ────────────────────────────────────────────────────────────
  myScore: number;
  opponentScore: number;
  isWinner: boolean | null;

  // ── Actions ───────────────────────────────────────────────────────────
  loadBattle: (battleId: string, role: 'challenger' | 'challengee', opponentName: string) => Promise<void>;
  selectAnswer: (answer: string) => void;
  advanceQuestion: () => void;
  submitAnswers: () => Promise<void>;
  setTimeLeft: (t: number) => void;
  reset: () => void;
}

const defaults: Omit<BattleState, 'loadBattle' | 'selectAnswer' | 'advanceQuestion' | 'submitAnswers' | 'setTimeLeft' | 'reset'> = {
  battleId: null,
  role: null,
  opponentName: 'Rakip',
  questions: [],
  timePerQuestion: 10_000,
  currentQuestionIndex: 0,
  selectedAnswer: null,
  hasAnswered: false,
  timeLeft: 10,
  questionStartMs: 0,
  localAnswers: [],
  phase: 'idle',
  error: null,
  result: null,
  p1SubmitResult: null,
  myScore: 0,
  opponentScore: 0,
  isWinner: null,
};

export const useBattleStore = create<BattleState>((set, get) => ({
  ...defaults,

  // ── Load questions from API and enter playing phase ──────────────────
  loadBattle: async (battleId, role, opponentName) => {
    set({ battleId, role, opponentName, phase: 'loading', error: null, localAnswers: [], currentQuestionIndex: 0 });
    try {
      const data = await battleApiService.getQuestions(battleId);
      set({
        questions: data.questions,
        timePerQuestion: data.timePerQuestion,
        timeLeft: Math.round(data.timePerQuestion / 1000),
        phase: 'playing',
        questionStartMs: Date.now(),
        selectedAnswer: null,
        hasAnswered: false,
      });
    } catch (e: any) {
      set({ phase: 'idle', error: e.message ?? 'Sorular yüklenemedi' });
    }
  },

  // ── Player selects an answer ─────────────────────────────────────────
  selectAnswer: (answer) => {
    const { hasAnswered, currentQuestionIndex, localAnswers, questionStartMs, timePerQuestion } = get();
    if (hasAnswered) return;

    const timeMs = Math.min(Date.now() - questionStartMs, timePerQuestion);
    const newAnswers = [...localAnswers, { questionIndex: currentQuestionIndex, answer, timeMs }];

    set({ selectedAnswer: answer, hasAnswered: true, localAnswers: newAnswers, phase: 'between' });
  },

  // ── Move to next question (called after between-pause) ───────────────
  advanceQuestion: () => {
    const { currentQuestionIndex, questions, timePerQuestion, phase } = get();
    // Guard against double-call from timer + between-timeout racing
    if (phase !== 'playing' && phase !== 'between') return;
    const next = currentQuestionIndex + 1;

    if (next >= questions.length) {
      // All questions answered — go to submit
      get().submitAnswers();
      return;
    }

    set({
      currentQuestionIndex: next,
      selectedAnswer: null,
      hasAnswered: false,
      timeLeft: Math.round(timePerQuestion / 1000),
      questionStartMs: Date.now(),
      phase: 'playing',
    });
  },

  // ── Submit all answers to API ─────────────────────────────────────────
  submitAnswers: async () => {
    const { battleId, role, localAnswers, questions, phase } = get();
    if (!battleId || !role) return;
    if (phase === 'submitting' || phase === 'done_p1' || phase === 'result') return;

    // If the last question timed out (no answer recorded), add a blank
    const answeredIndices = new Set(localAnswers.map((a) => a.questionIndex));
    const allAnswers = [...localAnswers];
    for (let i = 0; i < questions.length; i++) {
      if (!answeredIndices.has(i)) {
        allAnswers.push({ questionIndex: i, answer: '', timeMs: questions.length * 10_000 });
      }
    }

    set({ phase: 'submitting' });
    try {
      if (role === 'challenger') {
        const res = await battleApiService.submitAsChallenger(battleId, allAnswers);
        set({ phase: 'done_p1', p1SubmitResult: res });
      } else {
        const res = await battleApiService.submitAsChallengee(battleId, allAnswers);
        const myScore = res.score;
        const opponentScore = res.opponentScore;
        set({
          phase: 'result',
          result: res,
          myScore,
          opponentScore,
          isWinner: res.isDraw ? null : res.isWinner,
        });
      }
    } catch (e: any) {
      set({ phase: 'idle', error: e.message ?? 'Cevaplar gönderilemedi' });
    }
  },

  setTimeLeft: (t) => set({ timeLeft: t }),

  reset: () => set({ ...defaults }),
}));
