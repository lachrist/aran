/* eslint-disable local/strict-console */

import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup } from "./setup.mjs";
import {
  sanitizeConfig,
  sanitizeProgram,
  sanitizeSetupConfig,
} from "./sanitize.mjs";
import { listAlias } from "./util/index.mjs";
import { AranError } from "./error.mjs";

const { Object } = globalThis;

/**
 * @type {(
 *   config?: null | undefined | {
 *     global_variable?: estree.Variable,
 *     intrinsic_variable?: estree.Variable,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setup = (config) =>
  generateSetup(sanitizeSetupConfig("config", Object(config)));

/**
 * @type {<B, L>(
 *   program: import("./program").Program<B>,
 *   config: null | undefined | Partial<import("./config").Config<B, L>>,
 * ) => estree.Program & {
 *   warnings: import("./unbuild/warning").Warning[],
 * }}
 */
export const instrument = (raw_program, raw_config) => {
  const program = sanitizeProgram("program", Object(raw_program));
  const config = sanitizeConfig("config", Object(raw_config));
  const { root: root2, warnings, evals } = unbuild(program, config);
  if (config.debug_alias) {
    const aliases = listAlias(root2);
    if (aliases.length > 0) {
      throw new AranError("Unexpected alias", aliases);
    }
  }
  const { root: root3 } = weave(
    {
      root: /** @type {aran.Program<weave.ArgAtom>} */ (
        /** @type {aran.Program<any>} */ (root2)
      ),
      base: program.base,
    },
    { evals },
    config,
  );
  const { root: root4 } = rebuild(
    {
      root: /** @type {aran.Program<rebuild.Atom>} */ (
        /** @type {aran.Program<any>} */ (root3)
      ),
    },
    config,
  );
  return { ...root4, warnings };
};
