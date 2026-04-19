import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';

export interface WidgetData {
  wordGerman: string;
  wordTurkish: string;
  streak: number;
  xpToday: number;
  goalProgress: number;
  dailyChallengeCompleted: boolean;
  weeklyRank: number;
  winRate: number;
  lastUpdated: number;
}

const APP_GROUP_ID = 'group.com.wortkrieg.widget';
const SHARED_GROUP_KEY = 'widgetData';
const ASYNC_STORAGE_KEY = 'widget_data';
const SHARED_GROUP_PREFERENCES_PACKAGE = 'react-native-shared-group-preferences';
const ACTIVE_APP_STATE: AppStateStatus = 'active';

interface SharedGroupPreferencesModule {
  setItem(key: string, value: string, appGroupIdentifier: string): Promise<void>;
  getItem(key: string, appGroupIdentifier: string): Promise<string | null>;
}

let sharedGroupPreferences: SharedGroupPreferencesModule | null | undefined;

function getSharedGroupPreferences(): SharedGroupPreferencesModule | null {
  if (sharedGroupPreferences !== undefined) {
    return sharedGroupPreferences ?? null;
  }

  try {
    const requiredModule = require(SHARED_GROUP_PREFERENCES_PACKAGE) as unknown;

    if (
      typeof requiredModule === 'object' &&
      requiredModule !== null &&
      'default' in requiredModule
    ) {
      sharedGroupPreferences =
        (requiredModule as { default?: SharedGroupPreferencesModule }).default ??
        null;
    } else {
      sharedGroupPreferences = requiredModule as SharedGroupPreferencesModule;
    }
  } catch (error) {
    console.warn(error);
    sharedGroupPreferences = null;
  }

  return sharedGroupPreferences ?? null;
}

function isWidgetData(value: unknown): value is WidgetData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.wordGerman === 'string' &&
    typeof candidate.wordTurkish === 'string' &&
    typeof candidate.streak === 'number' &&
    typeof candidate.xpToday === 'number' &&
    typeof candidate.goalProgress === 'number' &&
    typeof candidate.dailyChallengeCompleted === 'boolean' &&
    typeof candidate.weeklyRank === 'number' &&
    typeof candidate.winRate === 'number' &&
    typeof candidate.lastUpdated === 'number'
  );
}

function parseWidgetData(rawValue: string | null): WidgetData | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return isWidgetData(parsed) ? parsed : null;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

export async function writeWidgetData(data: WidgetData): Promise<void> {
  const serializedData = JSON.stringify(data);
  const nativeModule = getSharedGroupPreferences();

  if (nativeModule) {
    try {
      await nativeModule.setItem(
        SHARED_GROUP_KEY,
        serializedData,
        APP_GROUP_ID
      );
      return;
    } catch (error) {
      console.warn(error);
    }
  }

  try {
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, serializedData);
  } catch (error) {
    console.warn(error);
  }
}

export async function readWidgetData(): Promise<WidgetData | null> {
  const nativeModule = getSharedGroupPreferences();

  if (nativeModule) {
    try {
      const sharedValue = await nativeModule.getItem(
        SHARED_GROUP_KEY,
        APP_GROUP_ID
      );
      const parsedSharedValue = parseWidgetData(sharedValue);

      if (parsedSharedValue) {
        return parsedSharedValue;
      }
    } catch (error) {
      console.warn(error);
    }
  }

  try {
    const fallbackValue = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    return parseWidgetData(fallbackValue);
  } catch (error) {
    console.warn(error);
    return null;
  }
}

export function setupWidgetDataSync(getLatestData: () => WidgetData): () => void {
  void writeWidgetData(getLatestData());

  const subscription = AppState.addEventListener('change', nextState => {
    if (nextState === ACTIVE_APP_STATE) {
      void writeWidgetData(getLatestData());
    }
  });

  return () => {
    subscription.remove();
  };
}
