module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    // Specific @/ overrides MUST come before the catch-all '^@/(.*)$'
    '^@/firebase$': '<rootDir>/__mocks__/firebase-config.js',
    '^@/hooks/useTheme$': '<rootDir>/__mocks__/use-theme.js',
    '^@/services/notificationService$': '<rootDir>/__mocks__/notification-service.js',
    '^@/services/offlineQueueService$': '<rootDir>/__mocks__/offline-queue-service.js',
    // Catch-all for remaining @/ imports
    '^@/(.*)$': '<rootDir>/$1',
    // Prevent Expo winter runtime from loading (uses import.meta, incompatible with Jest)
    '^expo/src/winter/.*$': '<rootDir>/__mocks__/empty.js',
    '^expo/build/winter/.*$': '<rootDir>/__mocks__/empty.js',
    // Map firebase modules to mocks (ESM incompatible with Jest)
    '^firebase/firestore$': '<rootDir>/__mocks__/firebase-firestore.js',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase-auth.js',
    '^firebase/app$': '<rootDir>/__mocks__/firebase-app.js',
    '^firebase/storage$': '<rootDir>/__mocks__/firebase-storage.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/expo-vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/__mocks__/expo-vector-icons.js',
    // Relative firebase imports
    '^\\.\\./firebase$': '<rootDir>/__mocks__/firebase-config.js',
    '^\\.\\./\\.\\./firebase$': '<rootDir>/__mocks__/firebase-config.js',
    '^../config/firebase$': '<rootDir>/__mocks__/firebase-config.js',
    '^../../config/firebase$': '<rootDir>/__mocks__/firebase-config.js',
  },
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-mmkv|@shopify/flash-list|react-native-worklets|react-native-reanimated)',
  ],
};
