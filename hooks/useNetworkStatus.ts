import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const CHECK_URL = 'http://45.143.11.97/api';
const POLL_INTERVAL_MS = 30_000;
const TIMEOUT_MS = 5_000;

async function checkOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(CHECK_URL, { method: 'HEAD', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = () => {
    checkOnline().then(setIsOnline).catch(() => setIsOnline(false));
  };

  useEffect(() => {
    check();

    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') check();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return isOnline;
}
