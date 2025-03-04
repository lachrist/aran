const {
  log,
  aran: { setupile, transpile, retropile, weaveStandard },
  astring: { generate },
  acorn: { parse },
  target,
} = /** @type {import("../context").Context} */ (
  // @ts-ignore
  context
);

/* ASPECT */

/** @type {any} */ (globalThis)[advice_global_variable] = createTraceAdvice(
  weaveStandard,
  {
    Reflect: /** @type {any} */ (globalThis.Reflect),
    Symbol: globalThis.Symbol,
    console: { log },
  },
);

/**
 * @type {import("aran").Digest<{
 *   FilePath: FilePath,
 *   NodeHash: NodeHash,
 * }>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}:${node_path}`);

globalThis.eval(generate(setupile({})));

globalThis.eval(
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
