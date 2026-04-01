import { renderHook, act } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { useSpeech } from '@/hooks/useSpeech';

// Mock expo-speech
jest.mock('expo-speech');

describe('useSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useSpeech());

    expect(result.current.status).toBe('idle');
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should speak german text', async () => {
    const mockSpeak = jest.fn().mockResolvedValue(undefined);
    (Speech.speak as jest.Mock).mockImplementation(mockSpeak);

    const { result } = renderHook(() => useSpeech());

    await act(async () => {
      await result.current.speak('Hallo Welt');
    });

    expect(mockSpeak).toHaveBeenCalledWith(
      'Hallo Welt',
      expect.objectContaining({
        language: 'de-DE',
        rate: 1.0,
        pitch: 1.0,
      })
    );
  });

  it('should stop speech', async () => {
    const mockStop = jest.fn().mockResolvedValue(undefined);
    (Speech.stop as jest.Mock).mockImplementation(mockStop);

    const { result } = renderHook(() => useSpeech());

    // Set initial speaking state
    act(() => {
      result.current.speak('Test');
    });

    await act(async () => {
      await result.current.stop();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should handle custom language and rate', async () => {
    const mockSpeak = jest.fn().mockResolvedValue(undefined);
    (Speech.speak as jest.Mock).mockImplementation(mockSpeak);

    const { result } = renderHook(() => useSpeech());

    await act(async () => {
      await result.current.speak('Hallo', {
        language: 'de',
        rate: 1.5,
        pitch: 0.8,
      });
    });

    expect(mockSpeak).toHaveBeenCalledWith(
      'Hallo',
      expect.objectContaining({
        language: 'de',
        rate: 1.5,
        pitch: 0.8,
      })
    );
  });

  it('should handle speech errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (Speech.speak as jest.Mock).mockRejectedValue(new Error('Speech error'));

    const { result } = renderHook(() => useSpeech());

    await act(async () => {
      await result.current.speak('Error test');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isSpeaking).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
