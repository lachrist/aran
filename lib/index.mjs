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
import { filterNarrow } from "./util/index.mjs";
import { AranTypeError, AranInputError, AranClashError } from "./error.mjs";

const {
  SyntaxError,
  Reflect: { apply },
  console,
  console: { warn },
} = globalThis;

/**
 * @type {(
 *   options?: null | undefined | {
 *     global?: estree.Variable,
 *     intrinsic?: estree.Variable,
 *     escape?: estree.Variable | null,
 *     exec?: estree.Variable | null,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setup = (options) =>
  generateSetup(sanitizeSetupOptions("options", options));

/**
 * @type {(
 *   log: import("../type/options.js").Log,
 * ) => log is import("../type/options.js").Warning}
 */
const isWarningLog = (log) =>
  log.name !== "ClashError" && log.name !== "SyntaxError";

/**
 * @type {<L>(
 *   program: estree.Program,
 *   options?: import("../type/options.js").UserOptions<L>,
 * ) => estree.Program & {
 *   warnings: import("../type/options.js").Warning[],
 * }}
 */
export const instrument = (raw_program, raw_options) => {
  const program1 = sanitizeProgram("program", raw_program);
  const options = sanitizeInstrumentOptions(
    "options",
    raw_options,
    program1.sourceType,
  );
  if ((program1.sourceType === "module") !== (options.kind === "module")) {
    throw new AranInputError(
      `program.sourceType`,
      options.kind === "module" ? "module" : "script",
      program1.sourceType,
    );
  }
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
      throw new AranClashError(log.message);
    }
  }
  if (options.warning === "silent") {
    // noop
  } else if (options.warning === "console") {
    for (const warning of warnings) {
      // eslint-disable-next-line local/no-impure
      apply(warn, console, [`${warning.name}: ${warning.message}`]);
    }
  } else {
    throw new AranTypeError("invalid options.warning", options.warning);
  }
  return { ...program2, warnings };
};
