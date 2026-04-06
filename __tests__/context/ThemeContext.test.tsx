// Unmock both so we test the REAL ThemeContext implementation
jest.unmock('@/hooks/useTheme');
jest.unmock('@/context/ThemeContext');

import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

test('defaults to dark theme', () => {
  const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
  expect(result.current.isDark).toBe(true);
});

test('toggles theme', () => {
  const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
  act(() => result.current.toggleTheme());
  expect(result.current.isDark).toBe(false);
});
