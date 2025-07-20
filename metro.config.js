const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver to handle web platform properly
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Remove this alias block to use the official react-native-maps everywhere
// config.resolver.alias = {
//   ...config.resolver.alias,
//   // Use react-native-web-maps for web platform
//   'react-native-maps': 'react-native-web-maps',
// };

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Handle platform-specific modules in resolver
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;