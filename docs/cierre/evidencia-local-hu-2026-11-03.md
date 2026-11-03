# Evidencia local de cierre móvil — 2026-11-03

## SHA y exportación

- SHA de aplicación evaluado: `09e60c9d749ef1e4b1f2a0c18313792374580cc3`.
- El export Android se ejecutó desde un archivo limpio de ese SHA, fuera del árbol de trabajo y con `EXPO_PUBLIC_API_URL=https://api.example.invalid`.
- Comando: `npm run build` (`expo export --platform android`).
- Resultado: exportación terminada; bundle `entry-9292f45e0181e82eb5407128279d2abd.hbc`, 5.547.081 bytes, SHA-256 `0887CB797846DEB642BEC9A3665AC7B1DD428AAD0FB274C5424254F85E847D65`.
- El bundle se conservó como artefacto local y no se añadió al repositorio.

## Checks locales

En el árbol de trabajo activo se ejecutaron lint, TypeScript, pruebas unitarias (8/8) y auditoría i18n estricta; terminaron correctamente. La exportación limpia confirma que los fuentes del SHA indicado también empaquetan para Android.

Estos resultados son locales. No representan un run remoto de CI, una compilación APK firmada para producción ni una instalación en dispositivo.

## Pendientes de release físico

- La configuración Gradle local de `release` usa la firma `debug`; no hay keystore de producción ni CLI/credencial EAS disponible en este entorno. No se generó ni se reporta un APK de producción.
- `adb` no está disponible y no se instaló el bundle/APK en un dispositivo físico; BLE, impresora térmica, QR, sesión y reconexión quedan pendientes.
- La medición de accesibilidad y rendimiento en dispositivos definidos sigue pendiente.
- CI remoto, smoke, reversión y SHA de release requieren publicar esta rama, run de CI y una evaluación coordinada.

## Integridad del árbol de trabajo

`app.json` tenía cambios locales previos a esta tarea. Se dejó intacto y excluido de este commit; el export de evidencia se generó desde el SHA limpio indicado arriba, no desde ese archivo modificado.
