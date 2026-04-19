import { createMMKV } from 'react-native-mmkv';

export function createStorage(id: string) {
  return createMMKV({ id });
}

export function readStoredJson<T>(
  storage: ReturnType<typeof createMMKV>,
  key: string,
  fallback: T
): T {
  const raw = storage.getString(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[storage] Failed to parse "${key}"`, error);
    storage.remove(key);
    return fallback;
  }
}
