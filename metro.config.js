const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Ensure proper handling of environment variables
  config.resolver.platforms = ['ios', 'android', 'native', 'web'];

  return config;
})();