import { makeReadGlobalExpression } from "./node.mjs";
import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {weave.TargetPath} */ ("$");

/**
 * @type {<L extends Json>(
 *   program: aran.Program<weave.ArgAtom>,
 *   options: {
 *     advice: estree.Variable,
 *     root: import("../../type/options.d.ts").Root,
 *     location: "inline" | "extract",
 *     locate: (
 *       root: import("../../type/options.d.ts").Root,
 *       origin: weave.OriginPath,
 *       target: weave.TargetPath,
 *     ) => L,
 *     pointcut: import("../../type/advice.d.ts").Pointcut<L>,
 *   }
 * ) => aran.Program<weave.ResAtom>}
 */
export const weave = (program, options) =>
  weaveProgram(
    { node: program, path: ROOT },
    {
      ...options,
      advice: makeReadGlobalExpression(options.advice),
    },
  );
