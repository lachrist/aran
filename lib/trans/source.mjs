import {
  annotateModuleProgram,
  annotateScriptProgram,
  EstreeSentrySyntaxError,
  ROOT_PATH,
} from "estree-sentry";
import { AranInputError, AranSyntaxError, AranTypeError } from "../error.mjs";
import { hasUseStrictDirective } from "./query/index.mjs";

/**
 * @type {(
 *  digest: import("./config-internal.d.ts").InternalDigest,
 *  file_path: import("./hash.d.ts").FilePath,
 * ) => import("estree-sentry").Annotate<
 *   import("./hash.d.ts").HashProp
 * >}
 */
const compileAnnotate = (digest, file_path) => (node, node_path, kind) => ({
  _hash: digest(/** @type {any} */ (node), node_path, file_path, kind),
});

/**
 * @type {(
 *   file: import("./config-internal.d.ts").InternalFile,
 *   digest: import("./config-internal.d.ts").InternalDigest,
 * ) => import("./source.d.ts").Source}
 */
export const toSource = ({ kind, root, path, situ }, digest) => {
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
 *   source: import("./source.d.ts").Source,
 * ) => import("./mode.d.ts").Mode}
 */
const getInitialMode = (source) => {
  switch (source.kind) {
    case "module": {
      return "strict";
    }
    case "script": {
      return "sloppy";
    }
    case "eval": {
      switch (source.situ.type) {
        case "global": {
          return "sloppy";
        }
        case "local": {
          return source.situ.mode;
        }
        case "aran": {
          return source.situ.scope.mode;
        }
        default: {
          throw new AranTypeError(source.situ);
        }
      }
    }
    default: {
      throw new AranTypeError(source);
    }
  }
};

/**
 * @type {(
 *   program: import("./source.d.ts").Source,
 * ) => import("./mode.d.ts").Mode}
 */
export const getSourceMode = (source) => {
  const mode = getInitialMode(source);
  switch (mode) {
    case "sloppy": {
      return hasUseStrictDirective(source.root.body) ? "strict" : "sloppy";
    }
    case "strict": {
      return "strict";
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};
