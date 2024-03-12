// eslint-disable-next-line local/no-deep-import
import { unbuildRootProgram, unbuildNodeProgram } from "./visitors/program.mjs";
import { ROOT_META, unpackMeta } from "./meta.mjs";
import { isContextPrelude, isWarningPrelude } from "./prelude.mjs";
import { map, filterNarrow, compileGet, reduceEntry } from "../util/index.mjs";
import { unpackScope, useStrict } from "./scope/index.mjs";
import { isProgramStrict } from "./query/index.mjs";
import { AranTypeError } from "../error.mjs";
import { isNodeProgram, isRootProgram } from "../program.mjs";

const ROOT_PATH = /** @type {unbuild.Path} */ ("$");

const getData = compileGet("data");

/**
 * @type {(
 *   node: import("./node").ProgramSequence
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
      unbuildRootProgram(
        {
          node: program.root,
          path: ROOT_PATH,
          meta: ROOT_META,
        },
        global_declarative_record,
        { sort: getRootSort(program), early_syntax_error },
      ),
    );
  } else if (isNodeProgram(program)) {
    const scope = unpackScope(program.context.scope);
    return unsequenceProgram(
      unbuildNodeProgram(
        {
          node: program.root,
          path: ROOT_PATH,
          meta: unpackMeta(program.context.meta),
        },
        isProgramStrict(program.root) ? useStrict(scope) : scope,
        { early_syntax_error },
      ),
    );
  } else {
    throw new AranTypeError(program);
  }
};
