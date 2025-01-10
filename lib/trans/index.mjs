// eslint-disable-next-line local/no-deep-import
import { transProgram } from "./visitors/program.mjs";
import { ROOT_META } from "./meta.mjs";
import {
  cookWarning,
  getPreludeSyntaxError,
  getPreludeWarning,
} from "./prelude/index.mjs";
import {
  filterMapTree,
  return$,
  recordArray,
  listValue,
  map,
} from "../util/index.mjs";
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
import { getSourceMode, toSource } from "./source.mjs";

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
 * ) => import("./atom").Program & {
 *   warnings: import("./prelude/warning").Warning[],
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
    ...removeProgramDuplicateHeader(value),
    warnings: map(filterMapTree(write, getPreludeWarning), cookWarning),
  };
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
 *   file: import("./config").InternalFile,
 *   config: import("./config").InternalConfig,
 * ) => import("./atom").Program & {
 *   warnings: import("./prelude/warning").Warning[],
 * }}
 */
export const trans = (file, { global_declarative_record, digest }) => {
  const source = toSource(file, digest);
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
        transProgram(
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
        transProgram(
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
