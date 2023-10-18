/* eslint-disable local/strict-console */

import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup } from "./setup.mjs";

const {
  SyntaxError,
  Reflect: { apply },
  console,
  console: { warn },
} = globalThis;

/**
 * @template L
 * @typedef {import("../type/options.js").Options<L>} Options
 */

/**
 * @template L
 * @typedef {import("../type/options.js").UserOptions<L>} UserOptions
 */

/**
 * @typedef {import("../type/advice.d.ts").LinkData} Link
 */

/**
 * @typedef {import("../type/options.d.ts").AdviceKind} AdviceKind
 */

/**
 * @typedef {estree.Variable} EstreeVariable
 */

/**
 * @typedef {import("../type/advice.d.ts").Variable} Variable
 */

/**
 * @template V
 * @template L
 * @typedef {import("../type/advice.d.ts").Point<V, L>} Point
 */

/**
 * @typedef {import("../type/advice.d.ts").Label} Label
 */

/**
 * @template V
 * @template L
 * @typedef {import("../type/advice.d.ts").Advice<V, L>} Advice
 */

const DEFAULT_ESCAPE = /** @type {estree.Variable} */ ("$ARAN");

const DEFAULT_INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

const DEFAULT_ADVICE = {
  kind: /** @type {AdviceKind} */ ("object"),
  variable: /** @type {estree.Variable} */ ("__ARAN_ADVICE__"),
};

const DEFAULT_ROOT = /** @type {import("../type/options.d.ts").Root} */ (
  "main"
);

/**
 * @type {import("../type/options.d.ts").Locate<string>}
 */
export const locateDefault = (path, root) => `${root}.${path}`;

/**
 * @type {import("../type/options.d.ts").GlobalOptions<string>}
 */
const default_options = {
  kind: "script",
  site: "global",
  enclave: true,
  strict: false,
  root: DEFAULT_ROOT,
  context: null,
  pointcut: false,
  advice: DEFAULT_ADVICE,
  intrinsic: DEFAULT_INTRINSIC,
  escape: DEFAULT_ESCAPE,
  locate: locateDefault,
};

/**
 * @type {<L>(
 *   options: Options<L>,
 * ) => import("./unbuild/index.mjs").Options}
 */
const extractUnbuildOptions = (options) => {
  if (options.site === "global") {
    return {
      ...options,
      path: null,
      context: { strict: false, root: options.root },
    };
  } else if (options.enclave) {
    return {
      ...options,
      path: null,
      context: { strict: options.strict, root: options.root },
    };
  } else {
    return {
      ...options,
      path: /** @type {unbuild.Path} */ (
        /** @type {string} */ (options.context.path)
      ),
    };
  }
};

/**
 * @type {(
 *   options: {
 *     intrinsic: estree.Variable,
 *     global: estree.Variable,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setupRaw = ({ intrinsic, global }) =>
  generateSetup(intrinsic, global);

/**
 * @type {(
 *   options?: null | undefined | {
 *     intrinsic?: estree.Variable,
 *     global?: estree.Variable,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setup = (options) =>
  setupRaw({
    ...options,
    intrinsic: DEFAULT_INTRINSIC,
    global: /** @type {estree.Variable} */ ("globalThis"),
  });

/**
 * @type {<L extends Json>(
 *   input: estree.Program,
 *   options: Options<L>,
 * ) => {
 *   root: estree.Program,
 *   logs: (unbuild.Log | rebuild.Log)[],
 * }}
 */
export const instrumentRaw = (program1, options) => {
  const root = options.context === null ? options.root : options.context.root;
  const { locate, pointcut, advice, escape, intrinsic } = options;
  const { node: node1, logs: unbuild_log_array } = unbuild(
    program1,
    extractUnbuildOptions(options),
  );
  const { node: node2, logs: weave_log_array } = weave(
    /** @type {aran.Program<weave.ArgAtom>} */ (/** @type {unknown} */ (node1)),
    { root, locate, pointcut, advice },
  );
  const { node: program2, logs: rebuild_log_array } = rebuild(
    /** @type {aran.Program<rebuild.Atom>} */ (/** @type {unknown} */ (node2)),
    { root, escape, intrinsic, advice: advice.variable },
  );
  return {
    root: program2,
    logs: [...unbuild_log_array, ...weave_log_array, ...rebuild_log_array],
  };
};

/**
 * @template {Json} L
 * @param {estree.Program} input
 * @param {null | undefined | UserOptions<L>} user_options
 * @return {estree.Program}
 */
export const instrument = (input, user_options) => {
  const { root: output, logs } = instrumentRaw(input, {
    ...user_options,
    ...default_options,
  });
  for (const log of logs) {
    if (log.name === "SyntaxError") {
      throw new SyntaxError(log.message);
    } else {
      // eslint-disable-next-line local/no-impure
      apply(warn, console, [`${log.name}: ${log.message}}`]);
    }
  }
  return output;
};
