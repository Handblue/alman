import { shuffleArray } from '@/utils/shuffleArray';

test('returns same length', () => {
  expect(shuffleArray([1, 2, 3, 4, 5]).length).toBe(5);
});

test('contains same elements', () => {
  const arr = [1, 2, 3, 4, 5];
  expect([...shuffleArray(arr)].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
});
