/* eslint-disable local/strict-console */

import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup } from "./setup.mjs";
import {
  sanitizeConfig,
  sanitizeContext,
  sanitizeProgram,
  sanitizeSetupConfig,
} from "./sanitize.mjs";
import { AranClashError } from "./error.mjs";

const { Object } = globalThis;

/**
 * @type {(
 *   config?: null | undefined | {
 *     global?: estree.Variable,
 *     intrinsic?: estree.Variable,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setup = (config) =>
  generateSetup(sanitizeSetupConfig("config", Object(config)));

/**
 * @type {<B, L>(
 *   program: import("./program").Program<B>,
 *   context: import("./context").Context,
 *   config: null | undefined | Partial<import("./config").Config<B, L>>,
 * ) => estree.Program & {
 *   warnings: import("./unbuild/warning").Warning[],
 * }}
 */
export const instrument = (raw_program, raw_context, raw_config) => {
  const { root: root1, base } = sanitizeProgram("program", Object(raw_program));
  const context = sanitizeContext(
    "context",
    Object(raw_context),
    root1.sourceType,
  );
  const config = sanitizeConfig("options", Object(raw_config));
  const { root: root2, warnings, evals } = unbuild({ root: root1 }, context);
  const { root: root3 } = weave(
    {
      root: /** @type {aran.Program<weave.ArgAtom>} */ (
        /** @type {aran.Program<any>} */ (root2)
      ),
      base,
    },
    { kind: context.source, evals },
    config,
  );
  const { root: root4, clashes } = rebuild(
    {
      root: /** @type {aran.Program<rebuild.Atom>} */ (
        /** @type {aran.Program<any>} */ (root3)
      ),
    },
    config,
  );
  for (const clash of clashes) {
    throw new AranClashError(clash);
  }
  return { ...root4, warnings };
};
