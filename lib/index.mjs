/* eslint-disable local/strict-console */

import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup } from "./setup.mjs";
import {
  sanitizeInstrumentOptions,
  sanitizeProgram,
  sanitizeSetupOptions,
} from "./sanitize.mjs";

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
 * @template V
 * @template L
 * @typedef {import("../type/advice.d.ts").Advice<V, L>} Advice
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
 * @typedef {import("../type/advice.d.ts").LinkData} Link
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
export const setup = (options) => setupRaw(sanitizeSetupOptions(options));

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
 * @type {<L>(
 *   program: estree.Program,
 *   options?: (
 *     | null
 *     | undefined
 *     | {[k in keyof Options<L>]?: Options<L>[k] }
 *   ),
 * ) => estree.Program}
 */
export const instrument = (program, options) => {
  const { root, logs } = instrumentRaw(
    sanitizeProgram(program),
    sanitizeInstrumentOptions(program.sourceType, options),
  );
  for (const log of logs) {
    if (log.name === "SyntaxError") {
      throw new SyntaxError(log.message);
    } else {
      // eslint-disable-next-line local/no-impure
      apply(warn, console, [`${log.name}: ${log.message}}`]);
    }
  }
  return root;
};
