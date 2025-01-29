// @ts-ignore
const ts_aware_context = context;

const {
  log,
  aran: { generateSetup, transpile, retropile, weaveStandard },
  astring: { generate },
  acorn: { parse },
  target,
} = /**
 * @type {{
 *   log: (message: string) => void,
 *   aran: import("aran"),
 *   astring: {
 *     generate: (node: object) => string,
 *   },
 *   acorn: {
 *     parse: (
 *       code: string,
 *       options: {
 *         ecmaVersion: number,
 *         sourceType: "script" | "module",
 *       },
 *     ) => {
 *       type: "Program",
 *       sourceType: "script" | "module",
 *       body: object[],
 *     },
 *   },
 *   target: string,
 * }}
 */ (ts_aware_context);

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

globalThis.eval(generate(generateSetup({})));

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
