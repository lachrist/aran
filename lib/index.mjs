import { trans } from "./trans/index.mjs";
import {
  weaveStandard as weaveStandardInner,
  weaveFlexible as weaveFlexibleInner,
} from "./weave/index.mjs";
import { retro } from "./retro/index.mjs";
import { setupile as setupileInner } from "./setup/index.mjs";
import {
  guardFile,
  guardFlexibleWeaveConfig,
  guardInstrumentConfig,
  guardProgram,
  guardRetroConfig,
  guardSetupConfig,
  guardStandardWeaveConfig,
  guardTransConfig,
} from "./guard.mjs";

export {
  AranExecError,
  AranTypeError,
  AranInputError,
  AranSyntaxError,
  AranClashError,
  AranPointcutError,
} from "./error.mjs";

export { compileIntrinsicRecord } from "./runtime/index.mjs";

/**
 * @type {(
 *   conf: unknown,
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
export const setupile = (conf) => setupileInner(guardSetupConfig("conf", conf));

/**
 * @deprecated use setupile instead
 */
export const generateSetup = setupile;

/**
 * @type {<A extends import("./lang/syntax.d.ts").Atom>(
 *   file: unknown,
 *   conf: unknown,
 * ) => import("./lang/syntax.d.ts").Program<A>}
 */
export const transpile = (file, conf) =>
  /** @type {import("./lang/syntax.d.ts").Program<any>} */ (
    trans(guardFile("file", file), guardTransConfig("conf", conf))
  );

/**
 * @type {(
 *   root: unknown,
 *   conf: unknown,
 * ) => import("./weave/atom.d.ts").ResProgram}
 */
export const weaveStandard = (root, conf) =>
  weaveStandardInner(
    guardProgram("root", root),
    guardStandardWeaveConfig("conf", conf),
  );

/**
 * @type {(
 *   root: unknown,
 *   conf: unknown,
 * ) => import("./weave/atom.d.ts").ResProgram}
 */
export const weaveFlexible = (root, conf) =>
  weaveFlexibleInner(
    guardProgram("root", root),
    guardFlexibleWeaveConfig("conf", conf),
  );

/**
 * @type {(
 *   root: unknown,
 *   conf: unknown,
 * ) => import("estree-sentry").Program<{}>}
 */
export const retropile = (root, conf) =>
  retro(guardProgram("root", root), guardRetroConfig("conf", conf));

/**
 * @type {(
 *   file: unknown,
 *   conf: unknown,
 * ) => import("estree-sentry").Program<{}> & {
 *   warnings: import("./trans/prelude/warning.d.ts").Warning[],
 * }}
 */
export const instrument = (raw_file, raw_conf) => {
  const file = guardFile("file", raw_file);
  const conf = guardInstrumentConfig("conf", raw_conf);
  const aran1 = trans(file, conf);
  const { warnings } = aran1;
  /** @type {import("./weave/atom.d.ts").ArgProgram} */
  const aran2 = /** @type {import("./lang/syntax.d.ts").Program<any>} */ (
    aran1
  );
  const aran3 = weaveStandard(aran2, conf);
  /** @type {import("./retro/atom.d.ts").Program} */
  const aran4 = /** @type {import("./lang/syntax.d.ts").Program<any>} */ (
    aran3
  );
  const root = retro(aran4, conf);
  return { ...root, warnings };
};
