// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META } from "./meta.mjs";
import { isContextPrelude, isWarningPrelude } from "./prelude/index.mjs";
import {
  map,
  filterNarrow,
  compileGet,
  reduceEntry,
  listEntry,
} from "../util/index.mjs";
import { getMode, unpackScope, useStrict } from "./scope/index.mjs";
import {
  checkModuleDeclaration,
  hasUseStrictDirective,
} from "./query/index.mjs";
import { AranExecError, AranTypeError } from "../report.mjs";
import { getProgramSort } from "./sort.mjs";
import { hashHeader } from "../header.mjs";

const getData = compileGet("data");

/**
 * @type {<H extends import("../header").Header>(
 *   header: H
 * ) => [string, H]}
 */
const makeHeaderEntry = (header) => [hashHeader(header), header];

/**
 * @type {<X, Y>(
 *   pair: [X, Y]
 * ) => Y}
 */
const getSecond = ([_first, second]) => second;

/**
 * @type {<H extends import("../header").Header>(
 *   headers: H[],
 * ) => H[]}
 */
const removeDuplicateHeader = (headers) =>
  map(listEntry(reduceEntry(map(headers, makeHeaderEntry))), getSecond);

/**
 * @type {(
 *   root: import("./atom").Program
 * ) => import("./atom").Program}
 */
const removeProgramDuplicateHeader = (root) => ({
  ...root,
  head: /** @type {any} */ (
    removeDuplicateHeader(
      /** @type {import("../header").Header[]} */ (root.head),
    )
  ),
});

/**
 * @type {(
 *   node: import("../sequence").Sequence<
 *     import("./prelude").ProgramPrelude,
 *     import("./atom").Program,
 *   >,
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./prelude/warning").Warning[],
 *   reboot: import("../reboot").RebootRecord,
 * }}
 */
const unsequenceProgram = ({ head, tail }) => ({
  root: removeProgramDuplicateHeader(tail),
  reboot: reduceEntry(map(filterNarrow(head, isContextPrelude), getData)),
  warnings: map(filterNarrow(head, isWarningPrelude), getData),
});

/**
 * @type {(
 *   root: (
 *     | import("../estree").Program
 *     | import("../source").EarlySyntaxError
 *   ),
 * ) => (
 *     | import("../estree").Program
 *     | import("../source").EarlySyntaxError
 *   )}
 */
export const checkModuleProgram = (root) => {
  switch (root.type) {
    case "EarlySyntaxError": {
      return root;
    }
    case "Program": {
      const message = checkModuleDeclaration(root);
      if (message === null) {
        return root;
      } else {
        return {
          type: "EarlySyntaxError",
          message,
        };
      }
    }
    default: {
      throw new AranTypeError(root);
    }
  }
};

/**
 * @type {(
 *   program: import("../source").Source,
 * ) => "strict" | "sloppy"}
 */
const getRootProgramMode = (program) => {
  switch (program.root.type) {
    case "EarlySyntaxError": {
      return "strict";
    }
    case "Program": {
      switch (program.kind) {
        case "module": {
          return "strict";
        }
        case "script": {
          return hasUseStrictDirective(program.root.body) ? "strict" : "sloppy";
        }
        case "eval": {
          switch (program.situ.type) {
            case "global": {
              return hasUseStrictDirective(program.root.body)
                ? "strict"
                : "sloppy";
            }
            case "local": {
              switch (program.situ.mode) {
                case "strict": {
                  return "strict";
                }
                case "sloppy": {
                  return hasUseStrictDirective(program.root.body)
                    ? "strict"
                    : "sloppy";
                }
                default: {
                  throw new AranTypeError(program.situ.mode);
                }
              }
            }
            case "aran": {
              throw new AranExecError("not a root program", program);
            }
            default: {
              throw new AranTypeError(program.situ);
            }
          }
        }
        default: {
          throw new AranTypeError(program);
        }
      }
    }
    default: {
      throw new AranTypeError(program.root);
    }
  }
};

/**
 * @type {(
 *   source: import("../source").Source,
 *   config: import("./config").Config,
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./prelude/warning").Warning[],
 *   reboot: import("../reboot").RebootRecord,
 * }}
 */
export const unbuild = (
  source,
  { global_declarative_record, early_syntax_error },
) => {
  if (source.situ.type === "global" || source.situ.type === "local") {
    return unsequenceProgram(
      unbuildProgram(
        {
          node: checkModuleProgram(source.root),
          path: source.path,
          meta: ROOT_META,
        },
        null,
        {
          sort: getProgramSort(source),
          mode: getRootProgramMode(source),
          global_declarative_record,
          early_syntax_error,
        },
      ),
    );
  } else if (source.situ.type === "aran") {
    const scope = unpackScope(source.situ.scope);
    return unsequenceProgram(
      unbuildProgram(
        {
          node: checkModuleProgram(source.root),
          path: source.path,
          meta: source.situ.meta,
        },
        source.root.type === "Program" &&
          hasUseStrictDirective(source.root.body)
          ? useStrict(scope)
          : scope,
        {
          sort: "eval.local.deep",
          mode: getMode(scope),
          global_declarative_record,
          early_syntax_error,
        },
      ),
    );
  } else {
    throw new AranTypeError(source.situ);
  }
};
