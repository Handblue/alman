import { renderHook, act } from '@testing-library/react-native';
import { useTTSStore } from '@/store/useTTSStore';

describe('useTTSStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useTTSStore());
    act(() => {
      result.current.clearCache();
    });
  });

  it('should initialize with empty cache', () => {
    const { result } = renderHook(() => useTTSStore());

    expect(result.current.getCacheSize()).toBe(0);
  });

  it('should add entry to cache', () => {
    const { result } = renderHook(() => useTTSStore());

    act(() => {
      result.current.addToCache('Hallo Welt', 'de-DE');
    });

    expect(result.current.getCacheSize()).toBe(1);
  });

  it('should check if text is in cache', () => {
    const { result } = renderHook(() => useTTSStore());

    act(() => {
      result.current.addToCache('Hallo', 'de-DE');
    });

    expect(result.current.isInCache('Hallo', 'de-DE')).toBe(true);
    expect(result.current.isInCache('Goodbye', 'de-DE')).toBe(false);
  });

  it('should get cache entry', () => {
    const { result } = renderHook(() => useTTSStore());

    act(() => {
      result.current.addToCache('Hallo Welt', 'de-DE');
    });

    const entry = result.current.getEntry('Hallo Welt', 'de-DE');

    expect(entry).toBeDefined();
    expect(entry?.text).toBe('Hallo Welt');
    expect(entry?.language).toBe('de-DE');
    expect(entry?.useCount).toBe(1);
  });

  it('should increment useCount on subsequent adds', () => {
    const { result } = renderHook(() => useTTSStore());

    act(() => {
      result.current.addToCache('Hallo', 'de-DE');
      result.current.addToCache('Hallo', 'de-DE');
      result.current.addToCache('Hallo', 'de-DE');
    });

    const entry = result.current.getEntry('Hallo', 'de-DE');
    expect(entry?.useCount).toBe(3);
  });

  it('should clear cache', () => {
    const { result } = renderHook(() => useTTSStore());

    act(() => {
      result.current.addToCache('Hallo', 'de-DE');
      result.current.addToCache('Guten Tag', 'de-DE');
    });

    expect(result.current.getCacheSize()).toBe(2);

    act(() => {
      result.current.clearCache();
    });

    expect(result.current.getCacheSize()).toBe(0);
  });

  it('should handle different languages separately', () => {
    const { result } = renderHook(() => useTTSStore());

    act(() => {
      result.current.addToCache('Hallo', 'de-DE');
      result.current.addToCache('Hallo', 'en-US');
    });

    expect(result.current.getCacheSize()).toBe(2);
    expect(result.current.isInCache('Hallo', 'de-DE')).toBe(true);
    expect(result.current.isInCache('Hallo', 'en-US')).toBe(true);
  });
});
