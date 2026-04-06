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

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([]),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/',
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, isDirectory: false, size: 1024 }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ status: 200, uri: 'file:///mock/audio.mp3' }),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mock-hash-abc123'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock useTheme hook so UI components render without ThemeProvider
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      background: '#FAFAFA',
      card: '#FFFFFF',
      text: '#212121',
      textSecondary: '#757575',
      border: '#E0E0E0',
      primary: '#1A73E8',
      accent: '#FF6D00',
      success: '#2E7D32',
      error: '#FF5252',
      warning: '#FFB300',
      info: '#00BCD4',
      gold: '#FFD700',
      purple: '#7C4DFF',
      green: '#4CAF50',
    },
    toggleTheme: jest.fn(),
  }),
}));

// Mock ThemeContext so components render without ThemeProvider
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      background: '#FAFAFA',
      card: '#FFFFFF',
      text: '#212121',
      textSecondary: '#757575',
      border: '#E0E0E0',
      primary: '#1A73E8',
      accent: '#FF6D00',
      success: '#2E7D32',
      error: '#FF5252',
      warning: '#FFB300',
    },
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-modules-core (prevents EventEmitter crash)
jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
  })),
  NativeModulesProxy: {},
  requireNativeModule: jest.fn(() => ({})),
  requireOptionalNativeModule: jest.fn(() => null),
  requireNativeViewManager: jest.fn(() => 'View'),
  NativeModule: jest.fn(),
  SharedObject: jest.fn(),
}));
