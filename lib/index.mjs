/* eslint-disable local/strict-console */

import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup as generateSetupInner } from "./setup.mjs";
import {
  sanitizeConfig,
  sanitizeSource,
  sanitizeSetupConfig,
} from "./sanitize.mjs";
import { AranTypeError, AranWarningError } from "./error.mjs";
import { formatWarning } from "./warning.mjs";

export { ROOT_PATH } from "./path.mjs";
export {
  isControlKind,
  isClosureKind,
  isProgramKind,
  extractFlexibleAdvice,
  extractFlexiblePointcut,
  extractStandardAdvice,
  extractStandardPointcut,
} from "./weave/index.mjs";

const { Object, console } = globalThis;

/**
 * @type {(
 *   config?: null | undefined | {
 *     global_variable?: import("./estree").Variable,
 *     intrinsic_variable?: import("./estree").Variable,
 *   },
 * ) => import("./estree").Program & { sourceType: "script" }}
 */
export const generateSetup = (config) =>
  generateSetupInner(sanitizeSetupConfig("config", Object(config)));

/**
 * @type {(
 *   mode: "embed" | "console" | "ignore" | "throw",
 *   warnings: import("./warning").Warning[],
 *   program: import("./estree").Program,
 * ) => import("./estree").Program & {
 *   _aran_warning_array_?: import("./warning").Warning[],
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
        console.warn(formatWarning(warning));
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
 * @type {(
 *   program: import("./source").Source,
 *   config: Partial<import("./config").Config>,
 * ) => import("./estree").Program & {
 *   _aran_warning_array_?: import("./warning").Warning[],
 * }}
 */
export const instrument = (raw_source, raw_config) => {
  const source = sanitizeSource("source", Object(raw_source));
  const config = sanitizeConfig("config", Object(raw_config));
  const { root: root2, warnings, reboot } = unbuild(source, config);
  const { root: root3 } = weave(
    {
      depth:
        source.kind === "eval" && source.situ === "local.deep"
          ? source.context.depth
          : null,
      root: /** @type {import("./weave/atom").ArgProgram} */ (
        /** @type {import("./lang").Program<any>} */ (root2)
      ),
      reboot,
    },
    config,
  );
  const { root: root4 } = rebuild(
    {
      root: /** @type {import("./lang").Program<import("./rebuild/atom").Atom>} */ (
        /** @type {import("./lang").Program<any>} */ (root3)
      ),
    },
    config,
  );
  return warn(config.warning, warnings, root4);
};
