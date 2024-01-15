// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META, unpackMeta } from "./meta.mjs";
import { makeRootScope, unpackScope, useStrict } from "./scope/index.mjs";
import { isContextPrelude, isWarningPrelude } from "./prelude.mjs";
import {
  map,
  filterNarrow,
  compileGet,
  reduceEntry,
  guard,
} from "../util/index.mjs";
import { isProgramStrict } from "./query/index.mjs";

const ROOT_PATH = /** @type {unbuild.Path} */ ("$");

const getData = compileGet("data");

/**
 * @type {(
 *   node: import("./sequence").ProgramSequence
 * ) => {
 *   root: aran.Program<unbuild.Atom>,
 *   warnings: import("./warning").Warning[],
 *   evals: {
 *     [k in unbuild.Path]
 *     ?: import("../context").InternalLocalEvalContext
 *   },
 * }}
 */
const unsequenceProgram = ({ head, tail }) => ({
  root: tail,
  evals: reduceEntry(map(filterNarrow(head, isContextPrelude), getData)),
  warnings: map(filterNarrow(head, isWarningPrelude), getData),
});

/**
 * @type {(
 *   program: {
 *     root: estree.Program,
 *   },
 *   context: import("../context").Context,
 * ) => {
 *   root: aran.Program<unbuild.Atom>,
 *   warnings: import("./warning").Warning[],
 *   evals: {
 *     [k in unbuild.Path]
 *     ?: import("../context").InternalLocalEvalContext
 *   },
 * }}
 */
export const unbuild = (program, context) =>
  unsequenceProgram(
    unbuildProgram(
      {
        node: program.root,
        path: ROOT_PATH,
        meta:
          context.source === "aran-eval" ? unpackMeta(context.meta) : ROOT_META,
      },
      guard(
        isProgramStrict(program.root),
        useStrict,
        context.source === "aran-eval"
          ? unpackScope(context.scope)
          : makeRootScope({ type: "root", context }),
      ),
      context,
    ),
  );
