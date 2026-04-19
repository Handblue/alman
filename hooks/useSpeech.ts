import { useCallback, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { useTTSStore } from '@/store/useTTSStore';

export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'error';

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechIdRef = useRef<string | null>(null);
  const { addToCache, isInCache } = useTTSStore();

  const speak = useCallback(async (text: string, options?: { language?: string; rate?: number; pitch?: number }) => {
    try {
      const language = options?.language || 'de-DE';
      
      // Check if already in TTS cache
      if (isInCache(text, language)) {
        // Just play from cache (in-memory)
        console.log(`[TTS Cache] Using cached TTS for: "${text}"`);
      }

      setStatus('loading');

      // Stop any ongoing speech
      if (isSpeaking) {
        await Speech.stop();
      }

      const speechOptions = {
        language,
        rate: options?.rate || 1.0,
        pitch: options?.pitch || 1.0,
        onStart: () => {
          setStatus('speaking');
          setIsSpeaking(true);
        },
        onDone: () => {
          // Add to cache after successful playback
          addToCache(text, language);
          setStatus('idle');
          setIsSpeaking(false);
        },
        onStopped: () => {
          setStatus('idle');
          setIsSpeaking(false);
        },
        onError: (error: any) => {
          console.error('Speech error:', error);
          setStatus('error');
          setIsSpeaking(false);
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Speech.speak error:', error);
      setStatus('error');
      setIsSpeaking(false);
    }
  }, [isSpeaking, addToCache, isInCache]);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
      setStatus('idle');
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await Speech.pause();
      setIsSpeaking(false);
      setStatus('idle');
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }, []);

  const isSpeechAvailable = useCallback(async (): Promise<boolean> => {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('Error checking speech availability:', error);
      return false;
    }
  }, []);

  return { speak, stop, pause, status, isSpeaking, isSpeechAvailable };
}
