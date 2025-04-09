// Instrumentation //
/** @type {import("../../context.d.ts").Context} */
const {
  log,
  target: js_code_1,
  aran: { setupile, transpile, retropile },
  astring: { generate },
  acorn: { parse },
} = /** @type {any} */ (globalThis).__context;
// Override console to use custom logger //
globalThis.console = /** @type {any} */ ({ log });
// Setup (should be ran once) //
const setup_js_ast = setupile({});
const setup_code = generate(setup_js_ast);
const _intrinsic_record = globalThis.eval(setup_code);
// Instrument (identity) and evaluate target //
const js_ast_1 = parse(js_code_1, { sourceType: "script", ecmaVersion: 2024 });
const aran_ast_1 = transpile({ kind: "eval", path: "main", root: js_ast_1 });
const js_ast_2 = retropile(aran_ast_1);
const js_code_2 = generate(js_ast_2);
globalThis.eval(js_code_2);
