import { renderHook, act } from '@testing-library/react-native';
import * as Audio from 'expo-av';
import { useAudio } from '@/hooks/useAudio';

// Mock expo-av
jest.mock('expo-av');

describe('useAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useAudio());

    expect(result.current.status).toBe('idle');
    expect(result.current.isPlaying).toBe(false);
  });

  it('should load and play audio', async () => {
    const mockSound = {
      setOnPlaybackStatusUpdate: jest.fn(),
      unloadAsync: jest.fn(),
      stopAsync: jest.fn(),
      pauseAsync: jest.fn(),
    };

    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('test-url');
    });

    expect(Audio.Sound.createAsync).toHaveBeenCalled();
    expect(result.current.status).toBe('playing');
  });

  it('should stop audio', async () => {
    const mockSound = {
      setOnPlaybackStatusUpdate: jest.fn(),
      unloadAsync: jest.fn(),
      stopAsync: jest.fn(),
      pauseAsync: jest.fn(),
    };

    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('test-url');
    });

    await act(async () => {
      await result.current.stop();
    });

    expect(mockSound.unloadAsync).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.isPlaying).toBe(false);
  });

  it('should handle playback errors', async () => {
    (Audio.Sound.createAsync as jest.Mock).mockRejectedValue(
      new Error('Audio error')
    );

    const { result } = renderHook(() => useAudio());

    await act(async () => {
      await result.current.play('invalid-url');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isPlaying).toBe(false);
  });
});
