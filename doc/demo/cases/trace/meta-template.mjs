// Instrumentation //

/** @type {import("../../context").Context} */
const {
  log,
  aran: { setupile, transpile, retropile, weaveStandard },
  astring: { generate },
  acorn: { parse },
  target,
} = /** @type {any} */ (globalThis).__context;

const {
  eval: evalGlobal,
  Symbol,
  Reflect,
  Reflect: { defineProperty },
} = globalThis;

/* ASPECT */

const advice = createTraceAdvice(weaveStandard, {
  Reflect: /** @type {any} */ (Reflect),
  Symbol,
  console: { log },
});

defineProperty(globalThis, advice_global_variable, { value: advice });

/**
 * @type {import("aran").Digest<{
 *   FilePath: FilePath,
 *   NodeHash: NodeHash,
 * }>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}:${node_path}`);

evalGlobal(generate(setupile({})));

evalGlobal(
  generate(
    retropile(
      weaveStandard(
        transpile(
          {
            kind: "script",
            situ: { type: "global" },
            path: /** @type {FilePath} */ ("main"),
            root: parse(target, { ecmaVersion: 2024, sourceType: "script" }),
          },
          { digest },
        ),
        weave_config,
      ),
    ),
  ),
);
