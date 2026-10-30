import fs from "node:fs/promises";
import ts from "typescript";
export async function resolve(specifier, context, nextResolve) {
  try { return await nextResolve(specifier, context); }
  catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND" || !specifier.startsWith(".")) throw error;
    const url = new URL(specifier + ".ts", context.parentURL);
    await fs.access(url);
    return { url: url.href, shortCircuit: true };
  }
}
export async function load(url, context, nextLoad) {
  if (!url.endsWith(".ts")) return nextLoad(url, context);
  const source = await fs.readFile(new URL(url), "utf8");
  return { format: "module", shortCircuit: true, source: ts.transpileModule(source, {
    fileName: new URL(url).pathname,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText };
}
