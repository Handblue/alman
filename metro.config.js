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
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// Substitute Node.js-only transports in engine.io-client with browser equivalents
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('polling-xhr.node') ||
    moduleName.includes('websocket.node') ||
    moduleName.includes('globals.node')
  ) {
    return context.resolveRequest(context, moduleName.replace('.node', ''), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
