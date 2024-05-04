// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META, unpackMeta } from "./meta.mjs";
import { isContextPrelude, isWarningPrelude } from "./prelude.mjs";
import { map, filterNarrow, compileGet, reduceEntry } from "../util/index.mjs";
import {
  EVAL_CLOSURE_FRAME,
  extendScope,
  getMode,
  unpackScope,
  useStrict,
} from "./scope/index.mjs";
import { checkModuleDeclaration, isProgramStrict } from "./query/index.mjs";
import { AranTypeError } from "../error.mjs";
import { isNodeProgram, isRootProgram } from "../program.mjs";

const ROOT_PATH = /** @type {unbuild.Path} */ ("$");

const getData = compileGet("data");

/**
 * @type {(
 *   node: import("../sequence").Sequence<
 *     import("./prelude").ProgramPrelude,
 *     aran.Program<unbuild.Atom>,
 *   >,
 * ) => {
 *   root: aran.Program<unbuild.Atom>,
 *   warnings: import("./warning").Warning[],
 *   evals: {
 *     [k in unbuild.Path]
 *     ?: import("../context").Context
 *   },
 * }}
 */
const unsequenceProgram = ({ head, tail }) => ({
  root: tail,
  evals: reduceEntry(map(filterNarrow(head, isContextPrelude), getData)),
  warnings: map(filterNarrow(head, isWarningPrelude), getData),
});

/**
 * @type {<B>(
 *   program: import("../program").RootProgram<B>,
 * ) => import("../sort").RootSort}
 */
const getRootSort = (program) => {
  if (program.kind === "module") {
    return {
      kind: "module",
      mode: "strict",
      situ: "global",
    };
  } else if (program.kind === "script") {
    return {
      kind: "script",
      mode: isProgramStrict(program.root) ? "strict" : "sloppy",
      situ: "global",
    };
  } else if (program.kind === "eval") {
    if (program.context.type === "global") {
      return {
        kind: "eval",
        mode: isProgramStrict(program.root) ? "strict" : "sloppy",
        situ: "global",
      };
    } else if (program.context.type === "local") {
      return {
        kind: "eval",
        mode:
          program.context.mode === "strict" || isProgramStrict(program.root)
            ? "strict"
            : "sloppy",
        situ: "global",
      };
    } else {
      throw new AranTypeError(program.context);
    }
  } else {
    throw new AranTypeError(program);
  }
};

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
 * @type {<B>(
 *   program: import("../program").Program<B>,
 *   config: {
 *     global_declarative_record: "native" | "emulate",
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => {
 *   root: aran.Program<unbuild.Atom>,
 *   warnings: import("./warning").Warning[],
 *   evals: {
 *     [k in unbuild.Path]
 *     ?: import("../context").Context
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
          path: ROOT_PATH,
          meta: ROOT_META,
        },
        null,
        {
          sort: getRootSort(program),
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
          path: ROOT_PATH,
          meta: unpackMeta(program.context.meta),
        },
        extendScope(
          isProgramStrict(program.root) ? useStrict(scope) : scope,
          EVAL_CLOSURE_FRAME,
        ),
        {
          sort: {
            kind: "eval",
            mode: isProgramStrict(program.root) ? "strict" : getMode(scope),
            situ: "local",
          },
          global_declarative_record,
          early_syntax_error,
        },
      ),
    );
  } else {
    throw new AranTypeError(program);
  }
};
