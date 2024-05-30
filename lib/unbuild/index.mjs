// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META, unpackMeta } from "./meta.mjs";
import { isContextPrelude, isWarningPrelude } from "./prelude.mjs";
import {
  map,
  filterNarrow,
  compileGet,
  reduceEntry,
  listEntry,
} from "../util/index.mjs";
import {
  EVAL_CLOSURE_FRAME,
  extendScope,
  getMode,
  unpackScope,
  useStrict,
} from "./scope/index.mjs";
import {
  checkModuleDeclaration,
  hasUseStrictDirective,
} from "./query/index.mjs";
import { AranError, AranTypeError } from "../error.mjs";
import { isNodeProgram, isRootProgram } from "../program.mjs";
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
 *   warnings: import("./warning").Warning[],
 *   evals: {
 *     [k in import("../path").Path]
 *     ?: import("../program").DeepLocalContext
 *   },
 * }}
 */
const unsequenceProgram = ({ head, tail }) => ({
  root: removeProgramDuplicateHeader(tail),
  evals: reduceEntry(map(filterNarrow(head, isContextPrelude), getData)),
  warnings: map(filterNarrow(head, isWarningPrelude), getData),
});

/**
 * @type {(
 *   root: (
 *     | estree.Program
 *     | import("../program").EarlySyntaxError
 *   ),
 * ) => (
 *     | estree.Program
 *     | import("../program").EarlySyntaxError
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
 *   program: import("../program").Program,
 * ) => "strict" | "sloppy"}
 */
const getRootProgramMode = (program) => {
  if (program.root.type === "EarlySyntaxError") {
    return "strict";
  } else if (program.root.type === "Program") {
    if (program.kind === "module") {
      return "strict";
    } else if (program.kind === "script") {
      return hasUseStrictDirective(program.root.body) ? "strict" : "sloppy";
    } else if (program.kind === "eval") {
      if (program.situ === "global") {
        return hasUseStrictDirective(program.root.body) ? "strict" : "sloppy";
      } else if (program.situ === "local.root") {
        if (program.context.mode === "strict") {
          return "strict";
        } else if (program.context.mode === "sloppy") {
          return hasUseStrictDirective(program.root.body) ? "strict" : "sloppy";
        } else {
          throw new AranTypeError(program.context.mode);
        }
      } else if (program.situ === "local.deep") {
        throw new AranError("not a root program", program);
      } else {
        throw new AranTypeError(program);
      }
    } else {
      throw new AranTypeError(program);
    }
  } else {
    throw new AranTypeError(program.root);
  }
};

/**
 * @type {(
 *   program: import("../program").Program,
 *   config: {
 *     global_declarative_record: "native" | "emulate",
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./warning").Warning[],
 *   evals: {
 *     [k in import("../path").Path]
 *     ?: import("../program").DeepLocalContext
 *   },
 * }}
 */
export const unbuild = (
  program,
  { global_declarative_record, early_syntax_error },
) => {
  if (isRootProgram(program)) {
    return unsequenceProgram(
      unbuildProgram(
        {
          node: checkModuleProgram(program.root),
          path: program.path,
          meta: ROOT_META,
        },
        null,
        {
          sort: getProgramSort(program),
          mode: getRootProgramMode(program),
          global_declarative_record,
          early_syntax_error,
        },
      ),
    );
  } else if (isNodeProgram(program)) {
    const scope = unpackScope(program.context.scope);
    return unsequenceProgram(
      unbuildProgram(
        {
          node: checkModuleProgram(program.root),
          path: program.path,
          meta: unpackMeta(program.context.meta),
        },
        extendScope(
          program.root.type === "Program" &&
            hasUseStrictDirective(program.root.body)
            ? useStrict(scope)
            : scope,
          EVAL_CLOSURE_FRAME,
        ),
        {
          sort: "eval.local.deep",
          mode: getMode(scope),
          global_declarative_record,
          early_syntax_error,
        },
      ),
    );
  } else {
    throw new AranTypeError(program);
  }
};
