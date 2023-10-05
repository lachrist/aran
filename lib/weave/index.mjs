import { makeReadGlobalExpression } from "./node.mjs";
import { weaveProgram } from "./visit.mjs";

/**
 * @type {<S, L extends Json>(
 *   program: aran.Program<weave.ArgAtom<S>>,
 *   options: {
 *     advice: estree.Variable,
 *     root: unbuild.Root,
 *     location: "inline" | "extract",
 *     locate: (root: unbuild.Root, origin: S, target: weave.Path) => L,
 *     pointcut: import("../../type/advice.d.ts").Pointcut<L>,
 *   }
 * ) => aran.Program<weave.ResAtom>}
 */
export const weave = (program, options) =>
  weaveProgram(
    { node: program, path: /** @type {weave.Path} */ ("$") },
    {
      ...options,
      advice: makeReadGlobalExpression(options.advice),
    },
  );
