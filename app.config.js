const appJson = require('./app.json');

module.exports = ({ config }) => {
  const expoConfig = config ?? appJson.expo;
  const appEnvironment = process.env.APP_ENV ?? 'development';
  const isProduction = appEnvironment === 'production';
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

  return { ...expoConfig, plugins };
};
