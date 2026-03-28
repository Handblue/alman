// Fix for Expo SDK 55 "winter" runtime which uses import.meta
// This needs to be defined before any Expo modules load
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = {};
}

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn((key, value) => store.set(key, value)),
      getString: jest.fn((key) => store.get(key)),
      getNumber: jest.fn((key) => store.get(key)),
      getBoolean: jest.fn((key) => store.get(key)),
      delete: jest.fn((key) => store.delete(key)),
    })),
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
