import { unbuild } from "./trans/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./retro/index.mjs";
import { generateSetup as generateSetupInner } from "./setup.mjs";
import {
  guardFile,
  guardInstrumentConfig,
  guardSetupConfig,
} from "./guard.mjs";

export {
  isClosureKind,
  isProgramKind,
  isSegmentKind,
  listParameter,
} from "./weave/index.mjs";

export {
  AranExecError,
  AranTypeError,
  AranInputError,
  AranSyntaxError,
  AranClashError,
  AranPointcutError,
} from "./error.mjs";

/**
 * @type {(
 *   conf: unknown,
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
export const generateSetup = (conf) => {
  const { global_variable, intrinsic_variable } = guardSetupConfig(
    "conf",
    conf,
  );
  return generateSetupInner({
    // eslint-disable-next-line object-shorthand
    global_variable: /** @type {import("estree-sentry").VariableName} */ (
      global_variable
    ),
    // eslint-disable-next-line object-shorthand
    intrinsic_variable: /** @type {import("estree-sentry").VariableName} */ (
      intrinsic_variable
    ),
  });
};

/**
 * @type {(
 *   file: unknown,
 *   conf: unknown,
 * ) => import("estree-sentry").Program<{}> & {
 *   warnings: import("./trans/prelude/warning").Warning[],
 * }}
 */
export const instrument = (raw_file, raw_conf) => {
  const file = guardFile("file", raw_file);
  const conf = guardInstrumentConfig("conf", raw_conf);
  const aran1 = unbuild(file, conf);
  const aran2 = weave(
    /** @type {import("./weave/atom").ArgProgram} */ (
      /** @type {import("./lang/syntax").Program<any>} */ (aran1)
    ),
    conf,
  );
  const root2 = rebuild(
    /** @type {import("./retro/atom").Program} */ (
      /** @type {import("./lang/syntax").Program<any>} */ (aran2)
    ),
    conf,
  );
  return {
    ...root2,
    warnings: aran1.warnings,
  };
};
