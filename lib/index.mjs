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
 * @typedef {import("../type/options.js").RootOptions<L>} RootOptions
 */

/**
 * @template L
 * @typedef {import("../type/options.js").NodeOptions<L>} NodeOptions
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

const DEFAULT_BASE = /** @type {import("../type/options.d.ts").Base} */ (
  "main"
);

/**
 * @type {import("../type/options.d.ts").Locate<string>}
 */
export const locateDefault = (path, root) => `${root}.${path}`;

/**
 * @type {import("../type/options.d.ts").GlobalUserOptions<string>}
 */
const default_options = {
  kind: "script",
  situ: "global",
  plug: "alien",
  mode: "sloppy",
  base: DEFAULT_BASE,
  context: null,
  pointcut: false,
  advice: DEFAULT_ADVICE,
  intrinsic: DEFAULT_INTRINSIC,
  escape: DEFAULT_ESCAPE,
  locate: locateDefault,
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
  const { node: node1, logs: unbuild_log_array } = unbuild(program1, options);
  const { node: node2, logs: weave_log_array } = weave(
    /** @type {aran.Program<weave.ArgAtom>} */ (/** @type {unknown} */ (node1)),
    options,
  );
  const { node: program2, logs: rebuild_log_array } = rebuild(
    /** @type {aran.Program<rebuild.Atom>} */ (/** @type {unknown} */ (node2)),
    options,
  );
  return {
    root: program2,
    logs: [...unbuild_log_array, ...weave_log_array, ...rebuild_log_array],
  };
};

/**
 * @type {(options: any) => any}
 */
const convert = (options) =>
  /** @type {any} */ ({
    ...options,
    program: {
      kind: options.kind,
      situ: options.situ,
      plug: options.plug,
    },
    context: options.context ?? { mode: options.mode },
  });

/**
 * @template {Json} L
 * @param {estree.Program} input
 * @param {null | undefined | UserOptions<L>} options
 * @return {estree.Program}
 */
export const instrument = (input, options) => {
  const { root: output, logs } = instrumentRaw(
    input,
    convert({ ...options, ...default_options }),
  );
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
