# QA de idiomas y adaptación — Móvil

## Alcance

Validar inicio/recuperación de sesión, caja y cobro, recibo, alertas, pedidos para llevar/domicilios, perfil y configuración de impresora. Recorrer los estados de carga, vacío, error de red, validación, éxito y confirmación en español (`es`), inglés (`en`), portugués (`pt`) y francés (`fr`). Usar cuentas y pedidos sintéticos.

## Comprobación automatizada

Desde `app-movil`:

```bash
npm run i18n:audit
npm test
npm run lint
npm run typecheck
```

`i18n:audit` carga y compara los cuatro idiomas de `translations.json`, caja, domicilios, cocina, configuración de impresora y los mensajes de `mobileCopy.ts`. Informa claves faltantes, vacías y posibles textos heredados sin traducir. `--strict-untranslated` convierte los candidatos no revisados en error. Las palabras y frases cortas que son compartidas correctamente con portugués se mantienen en una lista explícita; no se permite añadir excepciones sin revisión humana.

## Matriz de pruebas en dispositivo

Ejecutar en una APK/development build de la rama, no solo en Expo Go. Antes de empezar, registrar modelo, versión de Android, versión de la app, tamaño/densidad y escala de texto del sistema. Recorrer las cuatro lenguas en cada configuración y revisar que las pantallas sigan siendo operables.

| Dispositivo/modelo | Android | Tamaño/densidad | Escala de texto | Idiomas | Estado |
| --- | --- | --- | --- | --- | --- |
| Pendiente de asignar | Pendiente | Pendiente | 1.0× | es, en, pt, fr | No ejecutado |
| Pendiente de asignar | Pendiente | Pendiente | 1.3× | es, en, pt, fr | No ejecutado |
| Pendiente de asignar | Pendiente | Pendiente | 1.5× | es, en, pt, fr | No ejecutado |

Comprobar títulos, campos y mensajes largos, cortes, superposición con barras del sistema/navegación, botones, diálogos, recibo completo y desplazamiento. Probar la impresora solo si hay un equipo físico disponible; registrar por separado idioma, conexión y resultado del respaldo PDF. No marcar una combinación como aprobada sin ejecutarla.

## Registro de evidencia y defectos

Ejecución local en la rama QA (2026-10-22): auditoría de **897 claves** en seis catálogos, 0 faltantes, 0 vacías y 0 candidatos sin revisar; `npm test` pasó (6 pruebas). La prueba en APK y las capturas físicas siguen pendientes; no se presentan como ejecutados recorridos que requieren teléfono.

Hallazgos de calidad reproducidos en archivos sin cambios de esta HU:

| ID | Verificación | Resultado observado | Estado |
| --- | --- | --- | --- |
| MOB-QA-04-01 | `npm run typecheck` | Falla en `src/features/auth/services/mappers/mapClientRegisterRequest.ts:21`: `string \| undefined` no es asignable a `string`. | Defecto preexistente en `qa` |
| MOB-QA-04-02 | `npm run lint` | Termina con código 0 y una advertencia `react-hooks/set-state-in-effect` en `InvoicePrinterPicker.tsx:99`. | Advertencia preexistente en `qa` |

El auditor de idiomas pasa. Las excepciones portuguesas registradas son cognados/expresiones equivalentes revisadas manualmente. No se generó APK en esta revisión.

Por ejecución, registrar fecha/hora, commit/versión, idioma, modelo/Android, tamaño/densidad, escala de texto, pantalla/flujo, resultado y ruta de captura. Para defectos, agregar ID, severidad, pasos, resultado esperado/observado, estado y captura. Usar datos sintéticos y excluir credenciales, tokens y datos personales de las imágenes.
