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
import { AranTypeError, AranWarningError } from "./error.mjs";
export { ROOT_PATH } from "./path.mjs";

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
 * @type {(
 *   mode: "embed" | "console" | "ignore" | "throw",
 *   warnings: import("./unbuild/warning").Warning[],
 *   program: estree.Program,
 * ) => estree.Program & {
 *   _aran_warning_array_?: import("./unbuild/warning").Warning[],
 * }}
 */
const warn = (mode, warnings, program) => {
  switch (mode) {
    case "embed": {
      return {
        ...program,
        _aran_warning_array_: warnings,
      };
    }
    case "console": {
      for (const warning of warnings) {
        // eslint-disable-next-line no-console
        console.warn(warning);
      }
      return program;
    }
    case "ignore": {
      return program;
    }
    case "throw": {
      if (warnings.length === 0) {
        return program;
      } else {
        throw new AranWarningError(warnings[0]);
      }
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {<L>(
 *   program: import("./program").Program,
 *   config: null | undefined | Partial<import("./config").Config<L>>,
 * ) => estree.Program & {
 *   _aran_warning_array_?: import("./unbuild/warning").Warning[],
 * }}
 */
export const instrument = (raw_program, raw_config) => {
  const program = sanitizeProgram("program", Object(raw_program));
  const config = sanitizeConfig("config", Object(raw_config));
  const { root: root2, warnings, evals } = unbuild(program, config);
  const { root: root3 } = weave(
    {
      root: /** @type {aran.Program<import("./weave/atom").ArgAtom>} */ (
        /** @type {aran.Program<any>} */ (root2)
      ),
      evals,
    },
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
  return warn(config.warning, warnings, root4);
};
