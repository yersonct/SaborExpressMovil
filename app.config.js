const fs = require('node:fs');
const appJson = require('./app.json');

module.exports = ({ config }) => {
  const expoConfig = config ?? appJson.expo;
  const appEnvironment = process.env.APP_ENV ?? 'development';
  const isProduction = appEnvironment === 'production';
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);
  if (
    isProduction &&
    process.env.EAS_BUILD === 'true' &&
    process.env.EAS_BUILD_PLATFORM === 'android' &&
    !googleServicesFile
  ) {
    throw new Error('Configura GOOGLE_SERVICES_JSON como archivo de EAS para Android.');
  }
  const androidConfig = { ...expoConfig.android };
  delete androidConfig.googleServicesFile;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (isProduction && (!apiUrl || !/^https:\/\//i.test(apiUrl))) {
    throw new Error(
      'La compilación de producción requiere EXPO_PUBLIC_API_URL configurada con HTTPS.'
    );
  }

  const plugins = expoConfig.plugins.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') {
      return plugin;
    }

    return [
      plugin[0],
      {
        ...plugin[1],
        android: {
          ...plugin[1]?.android,
          usesCleartextTraffic: !isProduction,
        },
      },
    ];
  });

  return { ...expoConfig, plugins, android: { ...androidConfig, ...(googleServicesFile ? { googleServicesFile } : {}) } };
};
