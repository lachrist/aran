import { createDemo } from './demo.mjs';
const content = document.getElementsByClassName('page-content')[0];
content.appendChild(createDemo({
  location: globalThis.location,
  version: "0.0.0",
  base: "// Target //\nconsole.log(\"Hello, World!\");\n",
  meta: "// Instrumentation //\n/** @type {import(\"../../context\").Context} */\nconst {\n  log,\n  target: js_code_1,\n  aran: { setupile, transpile, retropile },\n  astring: { generate },\n  acorn: { parse },\n} = /** @type {any} */ (globalThis).__context;\n// Override console to use custom logger //\nglobalThis.console = /** @type {any} */ ({ log });\n// Setup (should be ran once) //\nconst setup_js_ast = setupile({});\nconst setup_code = generate(setup_js_ast);\nconst _intrinsic_record = globalThis.eval(setup_code);\n// Instrument (identity) and evaluate target //\nconst js_ast_1 = parse(js_code_1, { sourceType: \"script\", ecmaVersion: 2024 });\nconst aran_ast_1 = transpile({ kind: \"eval\", path: \"main\", root: js_ast_1 });\nconst js_ast_2 = retropile(aran_ast_1);\nconst js_code_2 = generate(js_ast_2);\nglobalThis.eval(js_code_2);\n",
  worker: './worker.mjs',
  header_class: 'wrapper',
}));
