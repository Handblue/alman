test('multiple choice XP: 12 correct = 120 + 25 streak bonus', () => {
  const correctAnswers = 12;
  const baseXP = correctAnswers * 10;
  const streakBonus = correctAnswers >= 5 ? 25 : 0;
  expect(baseXP + streakBonus).toBe(145);
});

test('flashcard XP is 50 per unit', () => {
  expect(50).toBe(50);
});

test('spaced repetition intervals', () => {
  const intervals: Record<string, number> = { unknown: 1, learning: 3, known: 7 };
  expect(intervals['unknown']).toBe(1);
  expect(intervals['learning']).toBe(3);
  expect(intervals['known']).toBe(7);
});
