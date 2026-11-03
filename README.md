# SaborExpress Móvil

Aplicación móvil de SaborExpress con Expo Router, TypeScript y React Native. La interfaz está disponible en español, inglés, portugués y francés.

## Requisitos

- Node.js 22.13 o posterior (compatible con Expo SDK 57).
- npm y, para compilar localmente la app nativa, Android Studio y Android SDK.

## Instalación

```bash
npm ci
Copy-Item .env.example .env
```

Ajusta `EXPO_PUBLIC_API_URL` en `.env` al origen de la API; en un teléfono físico, usa la IP local del equipo servidor en vez de `localhost`. `EXPO_PUBLIC_MAPTILER_KEY` es opcional. No guardes llaves privadas ni el contenido de `google-services.json` en el repositorio.

Para producción Android, configura `EXPO_PUBLIC_API_URL` con HTTPS y el archivo secreto de EAS `GOOGLE_SERVICES_JSON`. El proyecto rechaza la configuración de producción si falta alguno.

## Desarrollo

```bash
npm start
npm run android
npm run web
```

## Verificaciones

```bash
npm run lint
npm run typecheck
npm test
npm run i18n:audit
npm run build
```

`npm run build` genera el bundle de Android con Expo. Para un APK/AAB firmado, usa el perfil de EAS configurado en `eas.json` y los secretos del proyecto.

## Estructura

- `app/`: rutas y composición de pantallas.
- `src/features/`: funcionalidades de cliente, caja, cocina, domicilios, pedidos, reseñas y autenticación.
- `src/config/`: API, idioma y configuración compartida.
- `.github/workflows/`: verificaciones automáticas de calidad e idiomas.

Propietario del proyecto: [yersonct](https://github.com/yersonct).
