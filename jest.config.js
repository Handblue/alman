module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Prevent Expo winter runtime from loading (uses import.meta, incompatible with Jest)
    '^expo/src/winter/.*$': '<rootDir>/__mocks__/empty.js',
    '^expo/build/winter/.*$': '<rootDir>/__mocks__/empty.js',
  },
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-mmkv|@shopify/flash-list|react-native-worklets|react-native-reanimated)',
  ],
};
