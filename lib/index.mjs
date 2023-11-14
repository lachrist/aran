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
import { filterNarrow, AranTypeError } from "./util/index.mjs";

const {
  Error,
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
 * @typedef {unbuild.Log | rebuild.Log} Log
 */

/**
 * @typedef {Exclude<Log, {name: "ClashError" | "SyntaxError"}>} Warning
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
 *   options?: null | undefined | {
 *     intrinsic?: estree.Variable,
 *     global?: estree.Variable,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setup = (options) => generateSetup(sanitizeSetupOptions(options));

/**
 * @type {(log: Log) => log is Warning}
 */
const isWarningLog = (log) =>
  log.name !== "ClashError" && log.name !== "SyntaxError";

/**
 * @type {<L>(
 *   program: estree.Program,
 *   options?: (
 *     | null
 *     | undefined
 *     | {[k in keyof Options<L>]?: Options<L>[k] }
 *   ),
 * ) => estree.Program & {
 *   warnings: Warning[],
 * }}
 */
export const instrument = (raw_program, raw_options) => {
  const program1 = sanitizeProgram(raw_program);
  const options = sanitizeInstrumentOptions(program1.sourceType, raw_options);
  const { node: node1, logs: unbuild_log_array } = unbuild(program1, options);
  const { node: node2, logs: weave_log_array } = weave(
    /** @type {aran.Program<weave.ArgAtom>} */ (/** @type {unknown} */ (node1)),
    options,
  );
  const { node: program2, logs: rebuild_log_array } = rebuild(
    /** @type {aran.Program<rebuild.Atom>} */ (/** @type {unknown} */ (node2)),
    options,
  );
  const logs = [...unbuild_log_array, ...weave_log_array, ...rebuild_log_array];
  const warnings = filterNarrow(logs, isWarningLog);
  for (const log of logs) {
    if (log.name === "SyntaxError") {
      switch (options.error) {
        case "throw": {
          throw new SyntaxError(log.message);
        }
        case "embed": {
          return {
            type: "Program",
            sourceType: program1.sourceType,
            body: [
              {
                type: "ThrowStatement",
                argument: {
                  type: "NewExpression",
                  callee: {
                    type: "MemberExpression",
                    computed: false,
                    optional: false,
                    object: {
                      type: "Identifier",
                      name: options.intrinsic,
                    },
                    property: {
                      type: "Identifier",
                      name: "SyntaxError",
                    },
                  },
                  arguments: [
                    {
                      type: "Literal",
                      value: log.message,
                    },
                  ],
                },
              },
            ],
            warnings,
          };
        }
        default: {
          throw new AranTypeError("invalid options.SyntaxError", options.error);
        }
      }
    }
  }
  for (const log of logs) {
    if (log.name === "ClashError") {
      throw new Error(log.message);
    }
  }
  if (options.warning === "silent") {
    // noop
  } else if (options.warning === "console") {
    for (const warning of warnings) {
      // eslint-disable-next-line local/no-impure
      apply(warn, console, [`${warning.name}: ${warning.message}}`]);
    }
  } else {
    throw new AranTypeError("invalid options.warning", options.warning);
  }
  return { ...program2, warnings };
};
