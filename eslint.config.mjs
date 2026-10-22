import { defineConfig, globalIgnores } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  globalIgnores([
    ".expo/**",
    "android/**",
    "ios/**",
    "node_modules/**",
    "dist/**",
  ]),
  {
    rules: {
      // El app aún no usa React Compiler; conservar estos hallazgos visibles
      // como advertencias permite corregirlos por pantalla sin bloquear lint.
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);
