const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Remove deprecated watcher option that causes build warnings
if (config.watcher && config.watcher.unstable_workerThreads !== undefined) {
  delete config.watcher.unstable_workerThreads;
}

module.exports = withNativeWind(config, { input: "./global.css" });