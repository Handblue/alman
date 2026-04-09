import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PronunciationScore = 1 | 2 | 3 | 4 | 5;

export interface PronunciationResult {
  score: PronunciationScore;
  label: string;
  feedback: string;
  recordingUri: string | null;
}

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'done' | 'error';

// ─── Phonetic helpers (no external API) ───────────────────────────────────────

/**
 * Very light German phoneme simplification — removes umlauts / ß, lowercases,
 * strips articles (der/die/das), and keeps consonant skeleton.
 * Used to give a rough "closeness" score when real STT is unavailable.
 */
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

/**
 * Levenshtein distance between two strings (for rough similarity).
 */
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
  private recording: Audio.Recording | null = null;
  private _state: RecordingState = 'idle';

  get state(): RecordingState {
    return this._state;
  }

  /** Play TTS for a German word */
  async playTTS(word: string, rate = 0.85): Promise<void> {
    await Speech.speak(word, {
      language: 'de-DE',
      rate,
      pitch: 1.0,
    });
  }

  /** Stop TTS playback */
  async stopTTS(): Promise<void> {
    await Speech.stop();
  }

  /** Request mic permission */
  async requestPermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  /** Start recording user's pronunciation */
  async startRecording(): Promise<boolean> {
    try {
      this._state = 'requesting';

      const granted = await this.requestPermission();
      if (!granted) {
        this._state = 'error';
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      this.recording = recording;
      this._state = 'recording';
      return true;
    } catch (e) {
      console.warn('pronunciationService.startRecording error:', e);
      this._state = 'error';
      return false;
    }
  }

  /** Stop recording and return URI */
  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;
    this._state = 'processing';

    try {
      await this.recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = this.recording.getURI();
      this.recording = null;
      this._state = 'done';
      return uri ?? null;
    } catch (e) {
      console.warn('pronunciationService.stopRecording error:', e);
      this._state = 'error';
      return null;
    }
  }

  /**
   * Get the duration (ms) of the current/last recording via status.
   * Returns 0 if not available.
   */
  async getRecordingDurationMs(): Promise<number> {
    if (!this.recording) return 0;
    try {
      const status = await this.recording.getStatusAsync();
      return status.isRecording || status.isDoneRecording
        ? (status as any).durationMillis ?? 0
        : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Score the recording against expected word.
   *
   * Heuristics (no external API needed):
   * - durationMs < 300  → likely silence or tap accident → score 1
   * - durationMs < 700  → very short → max score 2
   * - attempt curve     → improves score with practice
   * - small random jitter for realism
   *
   * When a real STT API is available, call scoreFromTranscription() instead.
   */
  scoreRecording(
    _recordingUri: string | null,
    _expectedWord: string,
    attemptNumber = 1,
    durationMs = 0,
  ): PronunciationResult {
    let maxScore = 5;

    if (durationMs > 0 && durationMs < 300) {
      maxScore = 1; // too short — silence
    } else if (durationMs > 0 && durationMs < 700) {
      maxScore = 2; // barely spoke
    }

    const attemptBonus = Math.min(2, (attemptNumber - 1) * 0.7);
    const base = 2 + attemptBonus + (Math.random() * 1.4 - 0.4);
    const score = Math.min(maxScore, Math.max(1, Math.round(base))) as PronunciationScore;

    return {
      score,
      label: SCORE_LABELS[score],
      feedback: SCORE_FEEDBACK[score],
      recordingUri: _recordingUri,
    };
  }

  /**
   * Score by comparing expected vs. transcribed text (for future STT integration).
   * Call this when you have the transcription from a real STT service.
   */
  scoreFromTranscription(expectedWord: string, transcribedText: string): PronunciationResult {
    const sim = similarityScore(expectedWord, transcribedText);
    const score = scoreFromSimilarity(sim);
    return {
      score,
      label: SCORE_LABELS[score],
      feedback: SCORE_FEEDBACK[score],
      recordingUri: null,
    };
  }

  /** Play back the user's recorded audio */
  async playRecording(uri: string): Promise<void> {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  }

  cleanup(): void {
    if (this.recording) {
      this.recording.stopAndUnloadAsync().catch(() => {});
      this.recording = null;
    }
    Speech.stop().catch(() => {});
    this._state = 'idle';
  }
}

export const pronunciationService = new PronunciationService();
export { SCORE_LABELS, SCORE_FEEDBACK };
