import { useCallback, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const FS = FileSystem as any;
const CACHE_DIR = `${FS.documentDirectory ?? 'file:///tmp/'}audio-cache`;

export type CacheStats = {
  totalSize: number;
  fileCount: number;
};

export function useAudioCache() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({ totalSize: 0, fileCount: 0 });

  // Initialize cache directory
  const initializeCache = useCallback(async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      await updateCacheStats();
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }, []);

  // Generate cache key from text (MD5 hash)
  const getCacheKey = useCallback(async (text: string, prefix: string = 'audio'): Promise<string> => {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        text
      );
      return `${prefix}_${hash}`;
    } catch (error) {
      console.error('Error generating cache key:', error);
      return `${prefix}_${Date.now()}`;
    }
  }, []);

  // Get file path for cached audio
  const getCachePath = useCallback(async (text: string, prefix: string = 'audio'): Promise<string> => {
    const key = await getCacheKey(text, prefix);
    return `${CACHE_DIR}/${key}.wav`;
  }, [getCacheKey]);

  // Check if audio is cached
  const isCached = useCallback(async (text: string, prefix: string = 'audio'): Promise<boolean> => {
    try {
      const filePath = await getCachePath(text, prefix);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }, [getCachePath]);

  // Read cached audio file
  const readCache = useCallback(async (text: string, prefix: string = 'audio'): Promise<string | null> => {
    try {
      const cached = await isCached(text, prefix);
      if (!cached) return null;
      
      const filePath = await getCachePath(text, prefix);
      return filePath;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, [getCachePath, isCached]);

  // Save audio to cache
  const saveCache = useCallback(async (
    text: string,
    audioData: string,
    prefix: string = 'audio'
  ): Promise<string | null> => {
    try {
      const filePath = await getCachePath(text, prefix);
      await FS.writeAsStringAsync(filePath, audioData, {
        encoding: FS.EncodingType?.Base64,
      });
      await updateCacheStats();
      return filePath;
    } catch (error) {
      console.error('Error saving to cache:', error);
      return null;
    }
  }, [getCachePath]);

  // Update cache statistics
  const updateCacheStats = useCallback(async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;

      for (const file of files) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}/${file}`);
          if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') {
            totalSize += fileInfo.size;
          }
        } catch (error) {
          console.error(`Error getting file info for ${file}:`, error);
        }
      }

      setCacheStats({ totalSize, fileCount: files.length });
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  }, []);

  // Clear entire cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR);
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      setCacheStats({ totalSize: 0, fileCount: 0 });
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, []);

  // Clear cache by prefix (e.g., 'tts' for text-to-speech)
  const clearCacheByPrefix = useCallback(async (prefix: string): Promise<boolean> => {
    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const toDelete = files.filter(f => f.startsWith(prefix));

      for (const file of toDelete) {
        await FileSystem.deleteAsync(`${CACHE_DIR}/${file}`);
      }

      await updateCacheStats();
      return true;
    } catch (error) {
      console.error('Error clearing cache by prefix:', error);
      return false;
    }
  }, [updateCacheStats]);

  // Get cache size in MB
  const getCacheSizeInMB = useCallback((): number => {
    return parseFloat((cacheStats.totalSize / (1024 * 1024)).toFixed(2));
  }, [cacheStats]);

  return {
    initializeCache,
    getCacheKey,
    getCachePath,
    isCached,
    readCache,
    saveCache,
    clearCache,
    clearCacheByPrefix,
    updateCacheStats,
    cacheStats,
    getCacheSizeInMB,
  };
}
