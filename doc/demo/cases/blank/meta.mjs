// Instrumentation //
/** @type {import("../../context.d.ts").Context} */
const {
  log,
  target,
  aran: { compileIntrinsicRecord, transpile, retropile },
  astring: { generate },
  acorn: { parse },
} = /** @type {any} */ (globalThis).__context;

// Setup the intrinsic record for retropilation //
const intrinsic_global_variable = "__INTRINSIC_RECORD__";
const intrinsics = compileIntrinsicRecord(globalThis);
/** @type {any} */ (globalThis)[intrinsic_global_variable] = intrinsics;

// Transform: JSCode => ESTree => AranTree => ESTree => JSCode //
const code1 = target;
const estree1 = parse(code1, { sourceType: "script", ecmaVersion: 2024 });
const root = transpile({ kind: "eval", path: "main", root: estree1 });
log(JSON.stringify(root, null, 2));
const estree2 = retropile(root);
const code2 = generate(estree2);

//Exectute //
globalThis.eval(code2);
