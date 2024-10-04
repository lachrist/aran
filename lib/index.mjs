import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup as generateSetupInner } from "./setup.mjs";
import { guardSetupConf, guardFile, guardConf } from "./guard.mjs";
import { AranTypeError } from "./report";
import {
  annotateModuleProgram,
  annotateScriptProgram,
  EstreeSentrySyntaxError,
  ROOT_PATH,
} from "estree-sentry";
import { AranInputError, AranSyntaxError } from "./report.mjs";

export {
  AranExecError,
  AranTypeError,
  AranInputError,
  AranSyntaxError,
  AranClashError,
  AranPointcutError,
} from "./report.mjs";

///////////
// setup //
///////////

/**
 * @type {(
 *   conf: unknown,
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
export const generateSetup = (conf) => {
  const { global_variable, intrinsic_variable } = guardSetupConf("conf", conf);
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

////////////////
// instrument //
////////////////

/**
 * @type {(
 *   standard_pointcut: import("./config").StandardPointcut | null,
 *   flexible_pointcut: import("./config").FlexiblePointcut | null,
 * ) => import("./config").Pointcut}
 */
const toPointcut = (standard_pointcut, flexible_pointcut) => {
  if (flexible_pointcut !== null) {
    if (standard_pointcut !== null) {
      throw new AranInputError({
        conditions: [
          {
            target: "conf.flexible_pointcut",
            actual: flexible_pointcut,
          },
        ],
        target: "conf.standard_pointcut",
        actual: standard_pointcut,
        expect: "null",
      });
    }
    return {
      type: "flexible",
      data: flexible_pointcut,
    };
  }
  if (standard_pointcut === null) {
    throw new AranInputError({
      conditions: [
        {
          target: "conf.flexible_pointcut",
          actual: flexible_pointcut,
        },
      ],
      target: "conf.standard_pointcut",
      actual: standard_pointcut,
      expect: "not null",
    });
  }
  return {
    type: "standard",
    data: standard_pointcut,
  };
};

/**
 * @type {(
 *   conf: Omit<
 *     import(".").Conf<
 *       import("./hash").FilePath,
 *       import("./hash").Hash,
 *     >,
 *     "digest"
 *   >,
 * ) => import("./config").Config}
 */
const toConfig = ({
  mode,
  standard_pointcut,
  flexible_pointcut,
  initial_state,
  global_declarative_record,
  global_variable,
  intrinsic_variable,
  advice_variable,
  escape_prefix,
}) => ({
  mode,
  pointcut: toPointcut(standard_pointcut, flexible_pointcut),
  initial_state,
  global_declarative_record,
  // eslint-disable-next-line object-shorthand
  global_variable: /** @type {import("estree-sentry").VariableName} */ (
    global_variable
  ),
  // eslint-disable-next-line object-shorthand
  intrinsic_variable: /** @type {import("estree-sentry").VariableName} */ (
    intrinsic_variable
  ),
  // eslint-disable-next-line object-shorthand
  advice_variable: /** @type {import("estree-sentry").VariableName} */ (
    advice_variable
  ),
  // eslint-disable-next-line object-shorthand
  escape_prefix: /** @type {import("estree-sentry").VariableName} */ (
    escape_prefix
  ),
});

/**
 * @type {(
 *  digest: import(".").Digest<
 *    import("./hash").FilePath,
 *    import("./hash").Hash,
 *  >,
 *  file_path: import("./hash").FilePath,
 * ) => import("estree-sentry").Annotate<
 *   import("./hash").HashProp
 * >}
 */
const compileAnnotate = (digest, file_path) => (node, node_path, kind) => ({
  _hash: digest(node, node_path, file_path, kind),
});

/**
 * @type {(
 *   file: import(".").File<import("./hash").FilePath>,
 *   digest: import(".").Digest<
 *     import("./hash").FilePath,
 *     import("./hash").Hash,
 *   >,
 * ) => import("./source").Source}
 */
const toSource = ({ kind, root, path, situ }, digest) => {
  try {
    switch (kind) {
      case "script": {
        if (situ.type !== "global") {
          throw new AranInputError({
            conditions: [{ target: "file.kind", actual: kind }],
            target: "file.situ.type",
            expect: "global",
            actual: situ.type,
          });
        }
        return {
          kind,
          situ,
          root: annotateScriptProgram(
            root,
            ROOT_PATH,
            compileAnnotate(digest, path),
          ),
        };
      }
      case "module": {
        if (situ.type !== "global") {
          throw new AranInputError({
            conditions: [{ target: "file.kind", actual: kind }],
            target: "file.situ.type",
            expect: "global",
            actual: situ.type,
          });
        }
        return {
          kind,
          situ,
          root: annotateModuleProgram(
            root,
            ROOT_PATH,
            compileAnnotate(digest, path),
          ),
        };
      }
      case "eval": {
        return {
          kind,
          situ,
          root: annotateScriptProgram(
            root,
            ROOT_PATH,
            compileAnnotate(digest, path),
          ),
        };
      }
      default: {
        throw new AranTypeError(kind);
      }
    }
  } catch (error) {
    if (!(error instanceof EstreeSentrySyntaxError)) {
      throw error;
    }
    throw new AranSyntaxError(error.message, {
      type: "simple",
      ...error.cause,
    });
  }
};

/**
 * @type {(
 *   file: unknown,
 *   conf: unknown,
 * ) => import("estree-sentry").Program<{}> & {
 *   _aran_warning_array: import("./unbuild/prelude/warning").Warning[],
 * }}
 */
export const instrument = (raw_file, raw_conf) => {
  const file = guardFile("file", raw_file);
  const conf = guardConf("conf", raw_conf);
  const source = toSource(file, conf.digest);
  const config = toConfig(conf);
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
  return {
    ...root4,
    _aran_warning_array: warnings,
  };
};
