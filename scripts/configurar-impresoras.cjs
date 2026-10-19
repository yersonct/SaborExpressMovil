// Ejecutar desde la raíz de app-movil, después de copiar el contenido del ZIP.
// Aplica cambios ADITIVOS y realiza copias de respaldo.
const fs = require('node:fs');
const path = require('node:path');
const appFile = path.resolve(process.cwd(), 'app.json');
const easFile = path.resolve(process.cwd(), 'eas.json');
if (!fs.existsSync(appFile) || !fs.existsSync(easFile)) {
  console.error('Ejecuta este script desde la carpeta app-movil que contiene app.json y eas.json.');
  process.exit(1);
}
const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, obj) => {
  fs.copyFileSync(file, file + '.before-printers.bak');
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
};
const app = load(appFile);
app.expo ||= {};
app.expo.android ||= {};
app.expo.android.permissions ||= [];
if (!app.expo.android.permissions.includes('android.permission.BLUETOOTH_CONNECT')) {
  app.expo.android.permissions.push('android.permission.BLUETOOTH_CONNECT');
}
app.expo.plugins ||= [];
if (!app.expo.plugins.some((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === '@ricka7x/expo-thermal-printer')) {
  app.expo.plugins.push(['@ricka7x/expo-thermal-printer', {
    bluetoothPermission: 'SaborExpress necesita Bluetooth para imprimir recibos.'
  }]);
}
const eas = load(easFile);
eas.build ||= {};
eas.build.preview ||= { distribution: 'internal' };
eas.build.preview.android ||= {};
eas.build.preview.android.buildType = 'apk';
save(appFile, app);
save(easFile, eas);
console.log('Configuración de Bluetooth y perfil APK aplicada. Revisa git diff antes de compilar.');
