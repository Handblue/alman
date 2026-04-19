// Separate babel config for Jest — excludes reanimated plugin which fails in Node
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module-resolver', { alias: { '@': '.' } }],
  ],
};
