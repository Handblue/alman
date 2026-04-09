/**
 * SM-2 Spaced Repetition Algorithm
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Quality scale used:
 *   known    → 5  (correct response, no hesitation)
 *   learning → 3  (correct but required effort)
 *   unknown  → 1  (blackout / wrong)
 */

export interface SRSData {
  easeFactor: number;   // starts at 2.5, min 1.3
  interval: number;     // days until next review
  repetitions: number;  // consecutive successful reviews
}

export const SRS_DEFAULTS: SRSData = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

const QUALITY_MAP: Record<'known' | 'learning' | 'unknown', number> = {
  known: 5,
  learning: 3,
  unknown: 1,
};

/**
 * Run one SM-2 step and return updated SRS data + next review date.
 */
export function sm2(
  current: SRSData,
  rating: 'known' | 'learning' | 'unknown'
): { srs: SRSData; nextReview: Date } {
  const quality = QUALITY_MAP[rating];
  let { easeFactor, interval, repetitions } = current;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
    repetitions += 1;
  } else {
    // Failed: reset streak, review tomorrow
    repetitions = 0;
    interval = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    srs: { easeFactor, interval, repetitions },
    nextReview,
  };
}

/**
 * Returns true if a card is due for review (nextReview <= now).
 */
export function isDue(nextReview: string): boolean {
  return new Date(nextReview) <= new Date();
}
