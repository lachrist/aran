// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META } from "./meta.mjs";
import {
  getPreludeReboot,
  getPreludeSyntaxError,
  getPreludeWarning,
} from "./prelude/index.mjs";
import {
  reduceEntry,
  filterMapTree,
  return$,
  recordArray,
  listValue,
} from "../util/index.mjs";
import { hasUseStrictDirective } from "./query/index.mjs";
import { AranSyntaxError, AranTypeError } from "../error.mjs";
import { getRootSort } from "./sort.mjs";
import { hashHeader } from "../lang/index.mjs";
import { annotate } from "./annotation/index.mjs";
import {
  extendDeepEvalProgram,
  extendDeepEvalRoutine,
  extendStrict,
  makeRootScope,
} from "./scope/index.mjs";

export { cookWarning } from "./prelude/index.mjs";

/**
 * @type {<H extends import("../lang/header").Header>(
 *   headers: H[],
 * ) => H[]}
 */
const removeDuplicateHeader = (headers) =>
  listValue(recordArray(headers, hashHeader, return$));

/**
 * @type {(
 *   root: import("./atom").Program
 * ) => import("./atom").Program}
 */
const removeProgramDuplicateHeader = (root) => ({
  ...root,
  head: /** @type {any} */ (
    removeDuplicateHeader(
      /** @type {import("../lang/header").Header[]} */ (root.head),
    )
  ),
});

/**
 * @type {(
 *   node: import("../util/sequence").Sequence<
 *     import("./prelude").ProgramPrelude,
 *     import("./atom").Program,
 *   >,
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./prelude/warning").RawWarning[],
 *   reboot: import("../reboot").RebootRecord,
 * }}
 */
const unsequenceProgram = ({ write, value }) => {
  for (const { message, origin } of filterMapTree(
    write,
    getPreludeSyntaxError,
  )) {
    throw new AranSyntaxError(message, { type: "complex", hash: origin });
  }
  return {
    root: removeProgramDuplicateHeader(value),
    reboot: reduceEntry(filterMapTree(write, getPreludeReboot)),
    warnings: filterMapTree(write, getPreludeWarning),
  };
};

/**
 * @type {(
 *   source: import("../source").Source,
 * ) => import("./mode").Mode}
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
 *   program: import("../source").Source,
 * ) => import("./mode").Mode}
 */
const getSourceMode = (source) => {
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

/**
 * @type {(
 *   scope: import("./scope").Scope,
 *   mode: import("./mode").Mode,
 * ) => import("./scope").Scope}
 */
const extendMode = (scope, mode) => {
  switch (mode) {
    case "sloppy": {
      return scope;
    }
    case "strict": {
      return extendStrict(scope);
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   source: import("../source").Source,
 *   config: import("./config").Config,
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./prelude/warning").RawWarning[],
 *   reboot: import("../reboot").RebootRecord,
 * }}
 */
export const unbuild = (source, { global_declarative_record }) => {
  const mode = getSourceMode(source);
  const { report, unbound, annotation } = annotate(
    source.root,
    source.kind,
    mode,
  );
  // If report is not empty it is not safe to proceed because
  // some bindings were removed which can cause a missing
  // binding during initialization error.
  if (report.length > 0) {
    const error = report[0];
    throw new AranSyntaxError(error.message, {
      type: "complex",
      hash: error.origin,
    });
  } else {
    if (source.situ.type === "global" || source.situ.type === "local") {
      return unsequenceProgram(
        unbuildProgram(
          source.root,
          ROOT_META,
          makeRootScope({
            mode,
            root: getRootSort(source),
            annotation,
          }),
          {
            unbound,
            global_declarative_record,
          },
        ),
      );
    } else if (source.situ.type === "aran") {
      return unsequenceProgram(
        unbuildProgram(
          source.root,
          source.situ.meta,
          extendDeepEvalProgram(
            extendMode(
              extendDeepEvalRoutine(source.situ.scope, annotation),
              mode,
            ),
          ),
          { unbound, global_declarative_record },
        ),
      );
    } else {
      throw new AranTypeError(source.situ);
    }
  }
};
