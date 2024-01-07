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
import { AranClashError } from "./error.mjs";

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
 * @type {<L>(
 *   program: estree.Program,
 *   options?: import("../type/options.js").PartialOptions<L>,
 * ) => estree.Program & {
 *   warnings: import("./unbuild/log").Log[],
 * }}
 */
export const instrument = (raw_program, raw_options) => {
  const program1 = sanitizeProgram("program", raw_program);
  const argv = sanitizeInstrumentOptions(
    "options",
    raw_options,
    program1.sourceType,
  );
  const { node: node1, logs } = unbuild(program1, argv);
  const node2 = weave(
    /** @type {aran.Program<weave.ArgAtom>} */ (/** @type {unknown} */ (node1)),
    argv,
  );
  const { node: program2, clashes } = rebuild(
    /** @type {aran.Program<rebuild.Atom>} */ (/** @type {unknown} */ (node2)),
    argv,
  );
  for (const clash of clashes) {
    throw new AranClashError(clash, argv.escape);
  }
  return { ...program2, warnings: logs };
};
