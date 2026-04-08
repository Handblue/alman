import { create } from 'zustand';
import { Battle, BattlePlayer, battleService, buildOptions, DEFAULT_ELO } from '@/services/battleService';
import { Word } from '@/data/words';

interface BattleState {
  // Current battle
  battleId: string | null;
  battle: Battle | null;
  myUid: string | null;

  // Matchmaking
  isSearching: boolean;
  searchError: string | null;

  // Question UI state (local, not synced)
  selectedOptionIndex: number | null;
  hasAnswered: boolean;
  timeLeft: number; // seconds

  // Derived helpers
  me: BattlePlayer | null;
  opponent: BattlePlayer | null;
  myScore: number;
  opponentScore: number;
  currentWord: Word | null;
  options: string[];
  correctIndex: number;
  eloChange: number;
  isWinner: boolean | null; // null = draw

  // Actions
  startSearch: (xp: number, elo?: number) => Promise<void>;
  cancelSearch: () => void;
  setBattle: (battle: Battle) => void;
  selectOption: (index: number) => Promise<void>;
  setTimeLeft: (t: number) => void;
  reset: () => void;
}

const initialState = {
  battleId: null,
  battle: null,
  myUid: null,
  isSearching: false,
  searchError: null,
  selectedOptionIndex: null,
  hasAnswered: false,
  timeLeft: 12,
  me: null,
  opponent: null,
  myScore: 0,
  opponentScore: 0,
  currentWord: null,
  options: [],
  correctIndex: 0,
  eloChange: 0,
  isWinner: null,
};

function deriveFromBattle(battle: Battle, myUid: string) {
  const me = battle.player1.uid === myUid ? battle.player1 : battle.player2;
  const opponent = battle.player1.uid === myUid ? battle.player2 : battle.player1;
  const myScore = battle.scores[myUid] ?? 0;
  const opponentScore = battle.scores[opponent?.uid ?? ''] ?? 0;
  const currentWord = battle.questions[battle.currentQuestion] ?? null;
  const { options, correctIndex } = currentWord ? buildOptions(currentWord) : { options: [], correctIndex: 0 };

  const eloChange = battle.eloChanges?.[myUid] ?? 0;
  let isWinner: boolean | null = null;
  if (battle.status === 'finished') {
    if (battle.winnerId === null) isWinner = null; // draw
    else isWinner = battle.winnerId === myUid;
  }

  return { me, opponent, myScore, opponentScore, currentWord, options, correctIndex, eloChange, isWinner };
}

export const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,

  startSearch: async (xp, elo = DEFAULT_ELO) => {
    set({ isSearching: true, searchError: null });

    // Lazy import authService to avoid issues in test environments
    let uid: string;
    try {
      const { authService } = await import('@/services/authService');
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Giriş yapılmamış');
      uid = user.uid;
    } catch (e: any) {
      set({ isSearching: false, searchError: e.message });
      return;
    }

    try {
      const battleId = await battleService.findMatch({ xp, elo });
      set({ battleId, myUid: uid, isSearching: false });

      // Subscribe to live updates
      battleService.subscribe(battleId, (battle) => {
        const derived = deriveFromBattle(battle, uid);
        set({
          battle,
          ...derived,
          // Reset question UI when question changes
          ...(battle.status === 'question' ? { selectedOptionIndex: null, hasAnswered: false, timeLeft: 12 } : {}),
        });
      });

      // Schedule bot if we're waiting (player1 = creator)
      const battle = await battleService.getBattle(battleId);
      if (battle?.player1.uid === uid && battle.status === 'waiting') {
        battleService.scheduleBot(battleId, () => {
          // Bot added — Firestore subscription handles UI update
        });
      }
    } catch (e: any) {
      set({ isSearching: false, searchError: e.message ?? 'Eşleşme hatası' });
    }
  },

  cancelSearch: () => {
    battleService.cleanup();
    set({ ...initialState });
  },

  setBattle: (battle) => {
    const { myUid } = get();
    if (!myUid) return;
    const derived = deriveFromBattle(battle, myUid);
    set({ battle, ...derived });
  },

  selectOption: async (index) => {
    const { battleId, battle, myUid, hasAnswered } = get();
    if (!battleId || !battle || !myUid || hasAnswered) return;

    const currentWord = battle.questions[battle.currentQuestion];
    if (!currentWord) return;

    const { correctIndex } = buildOptions(currentWord);
    const correct = index === correctIndex;

    set({ selectedOptionIndex: index, hasAnswered: true });

    await battleService.submitAnswer(battleId, battle.currentQuestion, index, correct);
  },

  setTimeLeft: (t) => set({ timeLeft: t }),

  reset: () => {
    battleService.cleanup();
    set({ ...initialState });
  },
}));
