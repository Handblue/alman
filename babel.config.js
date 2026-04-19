module.exports = function (api) {
  const isTest = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
  api.cache(!isTest);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin must be excluded in Jest — it requires native modules unavailable in Node
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
      ['module-resolver', { alias: { '@': '.' } }],
    ],
  };
};
