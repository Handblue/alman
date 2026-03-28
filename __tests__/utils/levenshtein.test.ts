import { levenshtein, isCloseEnough } from '@/utils/levenshtein';

test('exact match = 0', () => expect(levenshtein('Hund', 'Hund')).toBe(0));
test('one char off = 1', () => expect(levenshtein('Hund', 'Hunu')).toBe(1));
test('accepts typo within threshold', () => expect(isCloseEnough('schule', 'Schule')).toBe(true));
test('rejects clearly wrong answer', () => expect(isCloseEnough('xyz', 'Schule')).toBe(false));
