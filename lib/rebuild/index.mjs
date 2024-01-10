import { isDeclareHeader, isStaticLookupHeader } from "../header.mjs";
import { compileGet, filterNarrow, map } from "../util/index.mjs";
import { checkClash } from "./mangle.mjs";
import { rebuildProgram } from "./program.mjs";

export { reportClash } from "./mangle.mjs";

const getVariable = compileGet("variable");

/**
 * @type {(
 *   clash: import("./clash").Clash | null,
 * ) => clash is import("./clash").Clash}
 */
const isNotNullClash = (clash) => clash !== null;

/**
 * @type {(
 *   program: {
 *     root: aran.Program<rebuild.Atom>,
 *   },
 *   config: {
 *     intrinsic: estree.Variable,
 *     escape: estree.Variable,
 *   },
 * ) => {
 *   root: estree.Program,
 *   clashes: import("./clash").Clash[],
 * }}
 */
export const rebuild = ({ root: node }, config) => ({
  root: rebuildProgram(node, config),
  clashes: filterNarrow(
    map(
      [
        ...map(filterNarrow(node.head, isDeclareHeader), getVariable),
        ...map(filterNarrow(node.head, isStaticLookupHeader), getVariable),
      ],
      (variable) => checkClash(variable, config),
    ),
    isNotNullClash,
  ),
});
