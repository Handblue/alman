const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.resolver.blockList = [
  new RegExp(path.join(__dirname, 'wortkrieg').replace(/\\/g, '/') + '/.*'),
];

// Support CSS modules (needed by @expo/log-box on web)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

// Prefer CJS over ESM to avoid import.meta issues on web
config.resolver.resolverMainFields = ['react-native', 'main', 'module'];

module.exports = config;
