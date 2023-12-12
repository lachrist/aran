import { isDeclarationHeader, isLookupHeader } from "../header.mjs";
import { compileGet, filter, filterNarrow, map } from "../util/index.mjs";
import { rebuildProgram } from "./program.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

const getVariable = compileGet("variable");

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   options: {
 *     situ: {
 *       kind: "module" | "script" | "eval",
 *     },
 *     intrinsic: estree.Variable,
 *     escape: estree.Variable,
 *   },
 * ) => {
 *   node: estree.Program,
 *   clashes: estree.Variable[],
 * }}
 */
export const rebuild = (node, { situ: { kind }, intrinsic, escape }) => {
  const singleton = [escape];
  return {
    node: rebuildProgram(
      node,
      /** @type {any} */ ({
        intrinsic,
        escape,
      }),
      { kind },
    ),
    clashes: filter(
      [
        ...map(filterNarrow(node.head, isDeclarationHeader), getVariable),
        ...map(filterNarrow(node.head, isLookupHeader), getVariable),
        intrinsic,
      ],
      (variable) => apply(startsWith, variable, singleton),
    ),
  };
};
