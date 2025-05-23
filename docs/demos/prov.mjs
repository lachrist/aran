import { createDemo } from './demo.mjs';
const content = document.getElementsByClassName('page-content')[0];
content.appendChild(createDemo({
  location: globalThis.location,
  version: "0.0.0",
  base: "// Target //\n\nconst { log, Linvail } = globalThis;\n\nconst num = 123;\n\nlog(Linvail.is(num, num)); // ✅ true\nlog(Linvail.is(num, 123)); // ✅ false\nlog(Linvail.is([num].map((x) => x)[0], num)); // ✅ true\n",
  meta: "// Instrumentation //\n\n/** @type {import(\"../../context.d.ts\").Context} */\nconst {\n  log,\n  target,\n  acorn: { parse },\n  astring: { generate },\n  aran: { compileIntrinsicRecord, transpile, retropile },\n  linvail: { weave, createRuntime },\n} = /** @type {any} */ (globalThis).__context;\n\nconst advice_global_variable = \"__LINVAIL_ADVICE__\";\nconst intrinsic_global_variable = \"__INTRINSIC_RECORD__\";\nlet counter = 0;\n\nconst intrinsics = compileIntrinsicRecord(globalThis);\nconst { advice, library } = createRuntime(intrinsics, {\n  dir: (/** @type {unknown} */ value) => log(JSON.stringify(value)),\n  wrapPrimitive: (inner) => ({ type: \"primitive\", inner, index: counter++ }),\n});\n/** @type {any} */ (globalThis)[intrinsic_global_variable] = intrinsics;\n/** @type {any} */ (globalThis)[advice_global_variable] = advice;\n/** @type {any} */ (globalThis).log = log;\n/** @type {any} */ (globalThis).Linvail = library;\nconst root1 = parse(target, { sourceType: \"script\", ecmaVersion: 2024 });\nconst root2 = transpile({ path: \"main\", kind: \"eval\", root: root1 });\nconst root3 = weave(root2, { advice_global_variable });\nconst root4 = retropile(root3, { intrinsic_global_variable });\nglobalThis.eval(generate(root4));\n",
  worker: './worker.mjs',
  header_class: 'wrapper',
}));
