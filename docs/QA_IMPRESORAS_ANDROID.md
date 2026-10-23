# HU-QA-03 — Validación física de impresoras Android

## Estado

La matriz está preparada, pero las pruebas físicas siguen **pendientes**: esta ejecución no tiene un teléfono Android ni impresoras conectados. No se atribuyen resultados a modelos que no se probaron.

## Preparar la ejecución

1. Instala en un teléfono real una APK de desarrollo que incluya los módulos Bluetooth nativos. Expo Go no sirve para esta prueba. Se puede compilar con `eas build --platform android --profile development` o instalar una compilación local con `npx expo run:android --device`.
2. Registra el modelo exacto del teléfono, la versión de Android, el modelo/variante de la impresora, el firmware si está disponible y el identificador de compilación de SaborExpress.
3. Ejecuta cada protocolo por separado. Para Bluetooth clásico Android muestra los dispositivos ya emparejados; para BLE la aplicación realiza una búsqueda activa. No mezcles ambos resultados en una sola fila.
4. En cada intento registra búsqueda, conexión, envío de prueba, confirmación del protocolo, salida física del papel y desconexión. Adjunta evidencia sin datos de clientes.
5. Repite una vez con Bluetooth apagado, impresora apagada o protocolo incompatible para comprobar el mensaje traducido y el botón **Abrir o guardar PDF**.

Los perfiles de EAS ya incluyen `development` con `developmentClient: true`. Una compilación de desarrollo es necesaria porque Expo Go no incorpora los módulos Bluetooth nativos del proyecto. Consulta la [guía de Expo para usar development builds](https://docs.expo.dev/develop/development-builds/use-development-builds/) y la [guía de permisos de Expo](https://docs.expo.dev/guides/permissions/).

## Cómo interpretar la confirmación

- **Bluetooth clásico ESC/POS en Android:** una operación de envío resuelta confirma que la biblioteca terminó de enviar los bytes. La impresora no informa de forma fiable si avanzó papel, así que registra por separado la observación física. `ACK: N/A` para este transporte.
- **BLE MXW01:** el flujo espera el ACK de inicio del protocolo antes de enviar los datos. Registra el ACK y la salida física como resultados distintos.
- **BLE PD01 legado:** se comprueba que terminen las escrituras BLE, pero el protocolo usado no confirma la salida física. Registra `ACK: no disponible` y observa el papel.
- **Modelo/protocolo incompatible:** registra el error de protocolo y comprueba que la selección no quede guardada como predeterminada. La pantalla de factura debe permitir abrir/guardar el PDF y mostrar el mensaje en el idioma activo.

El envío de prueba exitoso es el criterio de producto para guardar una impresora. No se debe describir como prueba de que salió papel cuando el protocolo no ofrece esa confirmación. La documentación del [módulo ESC/POS usado por Android](https://github.com/Ricka7x/expo-thermal-printer) detalla que Android usa Bluetooth Classic SPP, lista dispositivos emparejados y no obtiene estado de papel de forma fiable.

## Matriz BLE

Completa Android y compilación con la versión real del equipo. Usa una fila por modelo, firmware y protocolo. Valores válidos: `OK`, `FALLA`, `N/A` o `PENDIENTE`.

| Modelo y variante | Protocolo/servicio observado | Android | APK/build | Búsqueda | Conexión | Envío | ACK protocolo | Papel observado | Desconexión | Resultado, defecto y evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C9 | BLE; identificar servicio UUID y variante durante la prueba | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Sin hardware en esta ejecución |
| MXW01 | BLE MXW01 (AE30/AE01/AE02/AE03) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Sin hardware en esta ejecución |
| PD01 | BLE legado PD01 (servicio/características observados) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | N/A según protocolo implementado | Pendiente | Pendiente | Sin hardware en esta ejecución |
| Otro modelo: completar | Completar UUID/protocolo observado | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Sin hardware en esta ejecución |

## Matriz Bluetooth clásico

En Android, empareja el dispositivo desde Ajustes del sistema antes de pulsar **Buscar dispositivos** en la app. Registra el modelo exacto; el nombre anunciado no demuestra compatibilidad ESC/POS.

| Modelo y variante | Protocolo observado | Android | APK/build | Búsqueda emparejados | Conexión | Envío | ACK protocolo | Papel observado | Desconexión | Resultado, defecto y evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Impresora ESC/POS clásica: completar | Bluetooth Classic SPP | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | N/A según API | Pendiente | Pendiente | Sin hardware en esta ejecución |
| Otro modelo: completar | Completar protocolo observado | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Sin hardware en esta ejecución |

## Registro de ejecución

| Campo | Valor |
| --- | --- |
| Entorno | Android físico / APK de desarrollo |
| Fecha y zona horaria | Pendiente de ejecución física |
| Versión de Android y modelo del teléfono | Pendiente |
| Rama y commit de la app | `test/HU-QA-03-impresoras-android` / completar con el commit probado |
| Resultado general | Pendiente de ejecución física |
| Defectos | Pendiente; registrar identificador, pasos y evidencia |

## Registro de verificación de código

| Campo | Resultado |
| --- | --- |
| Fecha | 2026-10-22 (America/Bogota) |
| App / Expo SDK | `1.0.0` / `57.0.30` |
| Node / npm | `24.14.1` / `11.11.0` |
| `npm test` | 4 pruebas aprobadas en 2 archivos |
| ESLint en los archivos modificados | Aprobado |
| `npm run lint` | Falló por claves duplicadas en `src/locales/mobileCopy.ts` (líneas 196, 360, 524 y 688); también reportó una advertencia de React Hooks en `InvoicePrinterPicker.tsx:99`. |
| `npm run typecheck` | Falló por `mapClientRegisterRequest.ts:21` (`string | undefined` asignado a `string`) y las claves duplicadas de `mobileCopy.ts`. Ninguno de esos archivos forma parte de esta HU. |
| Android físico | No ejecutado: `adb` no está instalado y no se detectó un dispositivo conectado. |

## Verificaciones automáticas locales

Desde `app-movil`:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
```

Estas comprobaciones cubren código y la regla de guardar solo después del envío de prueba. No sustituyen la matriz en teléfonos e impresoras reales.
