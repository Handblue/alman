import { create } from 'zustand';

export type TTSCacheEntry = {
  text: string;
  language: string;
  timestamp: number;
  useCount: number;
};

export interface TTSStoreState {
  cache: Map<string, TTSCacheEntry>;
  addToCache: (text: string, language: string) => void;
  getEntry: (text: string, language: string) => TTSCacheEntry | undefined;
  isInCache: (text: string, language: string) => boolean;
  clearCache: () => void;
  getCacheSize: () => number;
}

export const useTTSStore = create<TTSStoreState>((set, get) => {
  const generateKey = (text: string, language: string) => `${language}:${text}`;

  return {
    cache: new Map(),
    
    addToCache: (text: string, language: string) => {
      const key = generateKey(text, language);
      const existing = get().cache.get(key);
      
      if (existing) {
        existing.useCount += 1;
        existing.timestamp = Date.now();
      } else {
        set(state => {
          const newCache = new Map(state.cache);
          newCache.set(key, {
            text,
            language,
            timestamp: Date.now(),
            useCount: 1,
          });
          return { cache: newCache };
        });
      }
    },

    getEntry: (text: string, language: string) => {
      return get().cache.get(generateKey(text, language));
    },

    isInCache: (text: string, language: string) => {
      return get().cache.has(generateKey(text, language));
    },

    getCacheSize: () => {
      return get().cache.size;
    },

    clearCache: () => {
      set({ cache: new Map() });
    },
  };
});
