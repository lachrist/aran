// Instrumentation //

/** @type {import("../../context.d.ts").Context} */
const {
  log,
  target,
  acorn: { parse },
  astring: { generate },
  aran: { compileIntrinsicRecord, transpile, retropile },
  linvail: { weave, createRuntime },
} = /** @type {any} */ (globalThis).__context;

const advice_global_variable = "__LINVAIL_ADVICE__";
const intrinsic_global_variable = "__INTRINSIC_RECORD__";
let counter = 0;

const intrinsics = compileIntrinsicRecord(globalThis);
const { advice, library } = createRuntime(intrinsics, {
  dir: (/** @type {unknown} */ value) => log(JSON.stringify(value)),
  wrapPrimitive: (inner) => ({ type: "primitive", inner, index: counter++ }),
});
/** @type {any} */ (globalThis)[intrinsic_global_variable] = intrinsics;
/** @type {any} */ (globalThis)[advice_global_variable] = advice;
/** @type {any} */ (globalThis).log = log;
/** @type {any} */ (globalThis).Linvail = library;
const root1 = parse(target, { sourceType: "script", ecmaVersion: 2024 });
const root2 = transpile({ path: "main", kind: "eval", root: root1 });
const root3 = weave(root2, { advice_global_variable });
const root4 = retropile(root3, { intrinsic_global_variable });
globalThis.eval(generate(root4));
