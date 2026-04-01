import { useCallback, useRef, useState } from 'react';
import * as Audio from 'expo-av';
import { AVPlaybackStatus } from 'expo-av';
import { useAudioCache } from './useAudioCache';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'error';

export function useAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const { readCache, saveCache, isCached, initializeCache } = useAudioCache();

  // Initialize cache on mount
  useCallback(() => {
    initializeCache();
  }, [initializeCache])();

  const play = useCallback(async (url: string, cacheKey?: string) => {
    try {
      // Check if audio is cached
      let audioUrl = url;
      if (cacheKey) {
        const cachedPath = await readCache(cacheKey, 'audio');
        if (cachedPath) {
          console.log(`[Audio Cache] Using cached audio: ${cacheKey}`);
          audioUrl = cachedPath;
        }
      }

      // Stop previous audio if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      setStatus('loading');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setStatus('playing');
      setIsPlaying(true);

      // Listen for playback completion
      sound.setOnPlaybackStatusUpdate((playbackStatus: AVPlaybackStatus) => {
        if (playbackStatus.isLoaded) {
          if (playbackStatus.didJustFinish) {
            setIsPlaying(false);
            setStatus('idle');
          }
        } else if (playbackStatus.error) {
          setStatus('error');
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      setStatus('error');
      setIsPlaying(false);
    }
  }, [readCache]);

  const stop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setStatus('idle');
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }, []);

  return { play, stop, pause, status, isPlaying, readCache, saveCache, isCached };
}
