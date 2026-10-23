import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { auditSourceTextMap, auditTranslationCatalog, summarizeAudit } from './i18n-audit-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireFromProject = createRequire(path.join(root, 'package.json'));
const cache = new Map();
const intentionalPortugueseCognates = [
  'Código de 6 dígitos', 'Enviar Código', 'Verificar Código', 'Ocultar QR',
  'Mesa Ocupada', 'PIN (4 dígitos)', '🍳 Preparando...', '📍 Mesa {table}',
  'Cobrar Pedido', 'Tipo de Pedido:', 'TOTAL A COBRAR:', 'Mesa {table} liberada',
  'Mesa {table}', 'Mesa {number}', 'Liberar mesa {number}', 'Pedido #{id}',
  'Atendido por', 'Confirmar pedido', 'Ver menos pedidos', 'Confirmar entrega',
  'Ver mapa', 'Por preparar', 'Pedido #{{id}}', 'Cancelar pedido',
  'Cobrar ${{amount}}', 'Código enviado',
];

function resolveSource(specifier, parentFile) {
  const base = specifier.startsWith('@/')
    ? path.join(root, 'src', specifier.slice(2))
    : path.resolve(path.dirname(parentFile), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.json`, path.join(base, 'index.ts')];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`Could not resolve module ${specifier} from ${parentFile}`);
  return file;
}

function loadModule(file) {
  const resolved = path.resolve(file);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));

  const loadedModule = { exports: {} };
  cache.set(resolved, loadedModule);
  let source = fs.readFileSync(resolved, 'utf8');
  if (path.basename(resolved) === 'mobileCopy.ts') source += '\nexport const __qaCopy = copy;\n';
  const output = ts.transpileModule(source, {
    fileName: resolved,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      baseUrl: root,
      paths: { '@/*': ['src/*'] },
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      return loadModule(resolveSource(specifier, resolved));
    }
    return requireFromProject(specifier);
  };
  new Function('require', 'module', 'exports', '__filename', '__dirname', output)(
    localRequire, loadedModule, loadedModule.exports, resolved, path.dirname(resolved),
  );
  return loadedModule.exports;
}

function printAudit(summary) {
  console.log(`${summary.status} ${summary.name}: ${summary.keyCount} claves`);
  for (const [label, findings] of [
    ['Faltantes', summary.missing],
    ['Vacías', summary.empty],
    ['Posiblemente sin traducir (revisión manual)', summary.untranslated],
  ]) {
    console.log(`  ${label}: ${findings.length}`);
    for (const finding of findings.slice(0, 30)) {
      console.log(`    ${finding.locale} ${finding.key}: ${JSON.stringify(finding.value ?? '')}`);
    }
    if (findings.length > 30) console.log(`    ... ${findings.length - 30} más`);
  }
}

const sourceTexts = loadModule(path.join(root, 'src/locales/mobileCopy.ts')).__qaCopy;
const catalogs = [
  ['src/locales/translations.json', loadModule(path.join(root, 'src/locales/translations.json'))],
  ['CashierTranslations.ts', loadModule(path.join(root, 'src/locales/CashierTranslations.ts')).TRANSLATIONS],
  ['DeliveryTranslations.ts', loadModule(path.join(root, 'src/locales/DeliveryTranslations.ts')).TRANSLATIONS],
  ['TableroTranslations.ts', loadModule(path.join(root, 'src/locales/TableroTranslations.ts')).translations],
  ['PrinterSettingsTranslations.ts', loadModule(path.join(root, 'src/locales/PrinterSettingsTranslations.ts')).PRINTER_SETTINGS_COPY],
];

let failed = false;
for (const [name, catalog] of catalogs) {
  const result = summarizeAudit(
    name,
    auditTranslationCatalog(catalog, { allowIdenticalValuesByLocale: { pt: intentionalPortugueseCognates } }),
    process.argv.includes('--strict-untranslated'),
  );
  printAudit(result);
  failed ||= result.status === 'FAIL';
}
const sourceResult = summarizeAudit(
  'mobileCopy.ts (mensajes de alertas, validaciones y errores)',
  auditSourceTextMap(sourceTexts, { pt: intentionalPortugueseCognates }),
  process.argv.includes('--strict-untranslated'),
);
printAudit(sourceResult);
failed ||= sourceResult.status === 'FAIL';
if (failed) process.exitCode = 1;
