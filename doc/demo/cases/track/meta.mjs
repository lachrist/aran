// Instrumentation //

/** @type {import("../../context").Context} */
const {
  log,
  target,
  acorn: { parse },
  astring: { generate },
  aran: { setupile, transpile, retropile },
  linvail: { weave, createRuntime },
} = /** @type {any} */ (globalThis).__context;

const advice_global_variable = "__LINVAIL_ADVICE__";
const dir = (/** @type {unknown} */ value) => log(JSON.stringify(value));

const intrinsics = globalThis.eval(generate(setupile({})));
const { advice, library } = createRuntime(intrinsics, { dir, count: true });
Reflect.defineProperty(globalThis, advice_global_variable, { value: advice });
Reflect.defineProperty(globalThis, "Linvail", { value: library });
Reflect.defineProperty(globalThis, "log", { value: log });
const root1 = parse(target, { sourceType: "script", ecmaVersion: 2024 });
const root2 = transpile({ path: "main", kind: "eval", root: root1 });
const root3 = weave(root2, { advice_global_variable });
const root4 = retropile(root3);
globalThis.eval(generate(root4));
