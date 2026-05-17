import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/services/authService';

const WS_URL = 'http://45.143.11.97';

export type RTPhase = 'idle' | 'connecting' | 'searching' | 'playing' | 'done' | 'error';

export interface RTQuestion {
  word: string;
  options: string[];
  correctAnswer: string;
}

interface RTBattleState {
  phase: RTPhase;
  battleId: string | null;
  opponentName: string;
  questions: RTQuestion[];
  currentQuestionIndex: number;
  myScore: number;
  opponentScore: number;
  opponentAnswered: number;
  winnerId: string | null;
  isDraw: boolean;
  error: string | null;

  findMatch: () => void;
  cancelSearch: () => void;
  sendAnswer: (questionIndex: number, answer: string) => void;
  disconnect: () => void;
  reset: () => void;
  advanceQuestion: () => void;
  recordCorrect: () => void;
}

let _socket: Socket | null = null;

const initialState = {
  phase: 'idle' as RTPhase,
  battleId: null,
  opponentName: 'Rakip',
  questions: [],
  currentQuestionIndex: 0,
  myScore: 0,
  opponentScore: 0,
  opponentAnswered: 0,
  winnerId: null,
  isDraw: false,
  error: null,
};

export const useRealtimeBattleStore = create<RTBattleState>((set, get) => ({
  ...initialState,

  findMatch: () => {
    const token = authService.getToken();
    if (!token) { set({ error: 'Oturum bulunamadı', phase: 'error' }); return; }

    // Reuse existing socket or create a new one
    if (!_socket || !_socket.connected) {
      _socket = io(`${WS_URL}/battle`, {
        auth: { token },
        transports: ['websocket'],
      });
    }

    set({ phase: 'connecting', error: null });

    _socket.off('connect');
    _socket.off('connect_error');
    _socket.off('searching');
    _socket.off('match_found');
    _socket.off('opponent_score');
    _socket.off('battle_realtime_done');
    _socket.off('player_disconnected');
    _socket.off('search_cancelled');

    _socket.on('connect', () => {
      _socket?.emit('find_match');
      set({ phase: 'searching' });
    });

    _socket.on('connect_error', (err) => {
      set({ phase: 'error', error: err.message });
    });

    _socket.on('searching', () => {
      set({ phase: 'searching' });
    });

    _socket.on('match_found', (data: {
      battleId: string;
      questions: RTQuestion[];
      opponentName: string;
    }) => {
      set({
        phase: 'playing',
        battleId: data.battleId,
        questions: data.questions,
        opponentName: data.opponentName,
        currentQuestionIndex: 0,
        myScore: 0,
        opponentScore: 0,
        opponentAnswered: 0,
      });
    });

    _socket.on('opponent_score', (data: { score: number; answered: number }) => {
      set({ opponentScore: data.score, opponentAnswered: data.answered });
    });

    _socket.on('battle_realtime_done', (data: {
      winnerId: string | null;
      isDraw: boolean;
      scores: Record<string, number>;
    }) => {
      const myId = authService.getCurrentUser()?.id ?? '';
      set({
        phase: 'done',
        winnerId: data.winnerId,
        isDraw: data.isDraw,
        myScore: data.scores[myId] ?? get().myScore,
        opponentScore: Object.entries(data.scores)
          .find(([id]) => id !== myId)?.[1] ?? get().opponentScore,
      });
    });

    _socket.on('player_disconnected', () => {
      set({ error: 'Rakip bağlantısı kesildi', phase: 'done', winnerId: authService.getCurrentUser()?.id ?? null, isDraw: false });
    });

    // If already connected, just emit find_match directly
    if (_socket.connected) {
      _socket.emit('find_match');
      set({ phase: 'searching' });
    }
  },

  cancelSearch: () => {
    _socket?.emit('cancel_search');
    set({ phase: 'idle' });
  },

  sendAnswer: (questionIndex, answer) => {
    const { battleId } = get();
    if (!_socket || !battleId) return;
    _socket.emit('answer', { battleId, questionIndex, answer });
  },

  advanceQuestion: () => {
    set(s => ({ currentQuestionIndex: s.currentQuestionIndex + 1 }));
  },

  recordCorrect: () => {
    set(s => ({ myScore: s.myScore + 1 }));
  },

  disconnect: () => {
    _socket?.disconnect();
    _socket = null;
    set({ phase: 'idle' });
  },

  reset: () => {
    _socket?.disconnect();
    _socket = null;
    set(initialState);
  },
}));
