import { createDemo } from './demo.mjs';
const content = document.getElementsByClassName('page-content')[0];
content.appendChild(createDemo({
  location: globalThis.location,
  version: "0.0.0",
  base: "// Target //\n123;\n",
  meta: "// Instrumentation //\n/** @type {import(\"../../context.d.ts\").Context} */\nconst {\n  log,\n  target,\n  aran: { compileIntrinsicRecord, transpile, retropile },\n  astring: { generate },\n  acorn: { parse },\n} = /** @type {any} */ (globalThis).__context;\n\n// Setup the intrinsic record for retropilation //\nconst intrinsic_global_variable = \"__INTRINSIC_RECORD__\";\nconst intrinsics = compileIntrinsicRecord(globalThis);\n/** @type {any} */ (globalThis)[intrinsic_global_variable] = intrinsics;\n\n// Transform: JSCode => ESTree => AranTree => ESTree => JSCode //\nconst code1 = target;\nconst estree1 = parse(code1, { sourceType: \"script\", ecmaVersion: 2024 });\nconst root = transpile({ kind: \"eval\", path: \"main\", root: estree1 });\nlog(JSON.stringify(root, null, 2));\nconst estree2 = retropile(root);\nconst code2 = generate(estree2);\n\n//Exectute //\nglobalThis.eval(code2);\n",
  worker: './worker.mjs',
  header_class: 'wrapper',
}));
