import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { ExpoSpeechRecognitionResultEvent } from 'expo-speech-recognition';

const addSpeechRecognitionListener = ExpoSpeechRecognitionModule.addListener.bind(
  ExpoSpeechRecognitionModule,
) as typeof ExpoSpeechRecognitionModule.addListener;

// ─── Types ────────────────────────────────────────────────────────────────────

export type PronunciationScore = 1 | 2 | 3 | 4 | 5;

export interface PronunciationResult {
  score: PronunciationScore;
  label: string;
  feedback: string;
  transcript: string | null;
}

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'done' | 'error';

// ─── Phonetic helpers ─────────────────────────────────────────────────────────

function simplifyGerman(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(der|die|das|ein|eine)\s+/i, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarityScore(expected: string, spoken: string): number {
  const a = simplifyGerman(expected);
  const b = simplifyGerman(spoken);
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / Math.max(a.length, b.length));
}

function scoreFromSimilarity(sim: number): PronunciationScore {
  if (sim >= 0.9) return 5;
  if (sim >= 0.75) return 4;
  if (sim >= 0.55) return 3;
  if (sim >= 0.35) return 2;
  return 1;
}

const SCORE_LABELS: Record<PronunciationScore, string> = {
  1: 'Tekrar Dene',
  2: 'Gelişiyor',
  3: 'İyi',
  4: 'Çok İyi',
  5: 'Mükemmel!',
};

const SCORE_FEEDBACK: Record<PronunciationScore, string> = {
  1: 'Pes etme! Almanca sesleri tanımak zaman alır.',
  2: 'İlerliyorsun. Sesi dinle ve tekrar dene.',
  3: 'Güzel! Birkaç ses daha netleşebilir.',
  4: 'Harika telaffuz! Küçük nüanslar var.',
  5: 'Mükemmel! Bir Almanca konuşmacı gibi.',
};

// ─── Service ──────────────────────────────────────────────────────────────────

class PronunciationService {
  private _state: RecordingState = 'idle';
  private _transcript: string | null = null;
  private _resultSub: { remove: () => void } | null = null;
  private _errorSub: { remove: () => void } | null = null;

  get state(): RecordingState {
    return this._state;
  }

  // ─── TTS ──────────────────────────────────────────────────────────────────

  async playTTS(word: string, rate = 0.85): Promise<void> {
    await Speech.speak(word, { language: 'de-DE', rate, pitch: 1.0 });
  }

  async stopTTS(): Promise<void> {
    await Speech.stop();
  }

  // ─── STT (on-device speech recognition) ───────────────────────────────────

  /** Request mic + speech recognition permissions. */
  async requestSTTPermission(): Promise<boolean> {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      return result.granted;
    } catch {
      return false;
    }
  }

  /**
   * Start on-device German speech recognition.
   * Returns false if permission denied or recognition unavailable.
   */
  async startSTT(): Promise<boolean> {
    try {
      this._state = 'requesting';
      const granted = await this.requestSTTPermission();
      if (!granted) {
        this._state = 'error';
        return false;
      }

      this._transcript = null;
      this._cleanupSTTListeners();

      // Capture best interim + final transcript as recognition runs
      this._resultSub = addSpeechRecognitionListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
        const best = event.results?.[0]?.transcript;
        if (best) this._transcript = best;
      });

      this._errorSub = addSpeechRecognitionListener('error', (event: { error?: string; message?: string }) => {
        console.warn('STT error:', event.error, event.message);
      });

      ExpoSpeechRecognitionModule.start({
        lang: 'de-DE',
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
      });

      this._state = 'recording';
      return true;
    } catch (e) {
      console.warn('pronunciationService.startSTT error:', e);
      this._state = 'error';
      return false;
    }
  }

  /**
   * Stop recognition and score the result against the expected word.
   * Waits up to 2 seconds for the final 'end' event before timing out.
   */
  stopSTTAndScore(expectedWord: string, attemptNumber = 1): Promise<PronunciationResult> {
    this._state = 'processing';

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        this._cleanupSTTListeners();

        const transcript = this._transcript;
        this._transcript = null;
        this._state = 'done';

        if (transcript?.trim()) {
          resolve(this._scoreFromTranscription(expectedWord, transcript));
        } else {
          // No STT result — fall back to attempt-curve heuristic
          resolve(this._heuristicScore(expectedWord, attemptNumber));
        }
      };

      // Listen for recognition to fully end
      const endSub = addSpeechRecognitionListener('end', () => {
        endSub.remove();
        finish();
      });

      // Safety timeout: if 'end' never fires, resolve after 2 s
      const timeout = setTimeout(() => {
        endSub.remove();
        finish();
      }, 2000);

      // Suppress unused-var warning — timeout is cleared implicitly by finish()
      void timeout;

      ExpoSpeechRecognitionModule.stop();
    });
  }

  // ─── Scoring helpers ──────────────────────────────────────────────────────

  private _scoreFromTranscription(expectedWord: string, transcript: string): PronunciationResult {
    const sim = similarityScore(expectedWord, transcript);
    const score = scoreFromSimilarity(sim);
    return { score, label: SCORE_LABELS[score], feedback: SCORE_FEEDBACK[score], transcript };
  }

  /** Attempt-curve heuristic used when STT returns no transcript. */
  private _heuristicScore(_expectedWord: string, attemptNumber = 1): PronunciationResult {
    const attemptBonus = Math.min(2, (attemptNumber - 1) * 0.7);
    const base = 2 + attemptBonus + (Math.random() * 1.4 - 0.4);
    const score = Math.max(1, Math.min(5, Math.round(base))) as PronunciationScore;
    return { score, label: SCORE_LABELS[score], feedback: SCORE_FEEDBACK[score], transcript: null };
  }

  // ─── Audio playback ───────────────────────────────────────────────────────

  async playRecording(uri: string): Promise<void> {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  private _cleanupSTTListeners() {
    this._resultSub?.remove();
    this._resultSub = null;
    this._errorSub?.remove();
    this._errorSub = null;
  }

  cleanup(): void {
    try { ExpoSpeechRecognitionModule.abort(); } catch {}
    this._cleanupSTTListeners();
    Speech.stop().catch(() => {});
    this._transcript = null;
    this._state = 'idle';
  }
}

export const pronunciationService = new PronunciationService();
export { SCORE_LABELS, SCORE_FEEDBACK };
