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
import { AranTypeError, AranWarningError, formatWarning } from "./report.mjs";

const { Object, console } = globalThis;

export {
  AranExecError,
  AranTypeError,
  AranDuplicateCutError,
  AranIllegalInputError,
  AranIllegalSyntaxError,
  AranVariableClashError,
  AranWarningError,
} from "./report.mjs";

/**
 *
 * Generates a `estree.Program` that should be executed prior executing any code
 * instrumented with `config.mode` set to "normal". If `config.mode` is set to
 * `"standalone"`, the setup code is bundled with the instrumented code and this
 * function should not be used.
 *
 * Default for `config.global_variable`: `"globalThis"`.
 * Default for `config.intrinsic_variable`: `"_ARAN_INTRINSIC_"`.
 *
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
 *   warnings: import("./report").Warning[],
 *   program: import("./estree").Program,
 * ) => import("./estree").Program & {
 *   _aran_warning_array_?: import("./report").Warning[],
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
        const warning = warnings[0];
        throw new AranWarningError(warning);
      }
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   source: import("./source").PartialSource,
 *   config: Partial<import("./config").Config>,
 * ) => import("./estree").Program & {
 *   _aran_warning_array_?: import("./report").Warning[],
 * }}
 */
export const instrument = (raw_source, raw_config) => {
  const source = sanitizeSource("source", Object(raw_source));
  const config = sanitizeConfig("config", Object(raw_config));
  const { root: root2, warnings, reboot } = unbuild(source, config);
  const { root: root3 } = weave(
    {
      depth:
        source.kind === "eval" && source.situ.type === "aran"
          ? source.situ.depth
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
