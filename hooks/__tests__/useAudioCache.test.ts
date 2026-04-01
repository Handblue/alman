import { renderHook, act } from '@testing-library/react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { useAudioCache } from '@/hooks/useAudioCache';

// Mock modules
jest.mock('expo-file-system');
jest.mock('expo-crypto');

describe('useAudioCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize cache directory', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    const { result } = renderHook(() => useAudioCache());

    await act(async () => {
      await result.current.initializeCache();
    });

    expect(FileSystem.getInfoAsync).toHaveBeenCalled();
  });

  it('should generate cache key from text', async () => {
    (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('abc123hash');

    const { result } = renderHook(() => useAudioCache());

    const key = await act(async () => {
      return await result.current.getCacheKey('Hallo Welt', 'tts');
    });

    expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.MD5,
      'Hallo Welt'
    );
  });

  it('should check if audio is cached', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('abc123hash');

    const { result } = renderHook(() => useAudioCache());

    await result.current.initializeCache();

    const cached = await act(async () => {
      return await result.current.isCached('Hallo', 'tts');
    });

    expect(cached).toBe(true);
  });

  it('should save audio to cache', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('abc123hash');

    const { result } = renderHook(() => useAudioCache());

    await result.current.initializeCache();

    const filePath = await act(async () => {
      return await result.current.saveCache('Hallo', 'base64audiodata', 'tts');
    });

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    expect(filePath).toBeTruthy();
  });

  it('should clear entire cache', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAudioCache());

    await act(async () => {
      await result.current.initializeCache();
    });

    const cleared = await act(async () => {
      return await result.current.clearCache();
    });

    expect(cleared).toBe(true);
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('should calculate cache size in MB', async () => {
    const { result } = renderHook(() => useAudioCache());

    act(() => {
      // Simulate cache stats
      result.current.cacheStats.totalSize = 5242880; // 5 MB
    });

    const sizeMB = result.current.getCacheSizeInMB();
    expect(sizeMB).toBe(5);
  });
});
