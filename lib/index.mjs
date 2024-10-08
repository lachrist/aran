/* eslint-disable local/strict-console */

import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup as generateSetupInner } from "./setup.mjs";
import {
  sanitizeConfig,
  sanitizeSource,
  sanitizeSetupConfig,
} from "./sanitize-config.mjs";
import { concatXX } from "./util/index.mjs";
import { sanitizeSyntax } from "./sanitize-syntax.mjs";

const { Object } = globalThis;

export {
  AranExecError,
  AranTypeError,
  AranDuplicateCutError,
  AranConfigError as AranIllegalInputError,
  AranVariableClashError,
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
 *
 */
export const generateSetup = (config) =>
  generateSetupInner(sanitizeSetupConfig("config", Object(config)));

/**
 *
 * The main instrumentation function of aran.
 *
 * @type {(
 *   source: import("./source").PartialSource,
 *   config: Partial<import("./config").Config>,
 * ) => import("./estree").Program & {
 *   _aran_warning_array: import("./warning").Warning[],
 * }}
 */
export const instrument = (raw_source, raw_config) => {
  const source = sanitizeSource("source", Object(raw_source));
  const config = sanitizeConfig("config", Object(raw_config));
  // eslint-disable-next-line local/no-impure
  sanitizeSyntax(source.root, source.path);
  const { root: root2, warnings: warnings1, reboot } = unbuild(source, config);
  const { root: root3, warnings: warnings2 } = weave(
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
  return {
    ...root4,
    _aran_warning_array: concatXX(warnings1, warnings2),
  };
};
