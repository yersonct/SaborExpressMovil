# Estructura limpia de frontend móvil

Bloque objetivo para organizar el proyecto sin tocar el comportamiento actual.

## Bloque objetivo

app-movil/src/
├── app/
│ ├── navigation/
│ ├── screens/
│ └── routes/
├── architecture/
├── components/
├── features/
│ ├── auth/
│ ├── orders/
│ ├── notifications/
│ ├── waiter/
│ ├── cart/
│ └── userPreferences/
├── hooks/
├── locales/
├── shared/
│ ├── api/
│ ├── network/
│ ├── storage/
│ └── utils/
└── constants/

## Mapeo con el proyecto actual

- [app-movil/src/features](../features) -> módulos funcionales
- [app-movil/src/locales](../locales) -> traducciones
- [app-movil/src/features/userPreferences/context/ClientPreferencesContext.tsx](../features/userPreferences/context/ClientPreferencesContext.tsx) -> preferencias + idioma
- [app-movil/src/features/waiter/hooks/useWaiterSocket.ts](../features/waiter/hooks/useWaiterSocket.ts) -> WebSocket del waiter

## Principios

- Feature-first.
- Los hooks y servicios quedan dentro del dominio que los usa.
- El real-time va separado del UI.
- Las preferencias globales se centralizan en shared/context.
- La migración se hace por feature para evitar romper la app.
