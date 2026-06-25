const { withAppBuildGradle } = require('@expo/config-plugins');

const withAndroid16KB = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      
      // Check if it already has packagingOptions
      if (buildGradle.includes('packagingOptions {') && !buildGradle.includes('useLegacyPackaging')) {
        config.modResults.contents = buildGradle.replace(
          /packagingOptions\s*\{/,
          'packagingOptions {\n        jniLibs {\n            useLegacyPackaging = true\n        }'
        );
      } else if (!buildGradle.includes('packagingOptions')) {
        // Find android block end and insert before it
        config.modResults.contents = buildGradle.replace(
          /android\s*\{/,
          'android {\n    packagingOptions {\n        jniLibs {\n            useLegacyPackaging = true\n        }\n    }'
        );
      }
    }
    return config;
  });
};

module.exports = withAndroid16KB;
