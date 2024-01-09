import { isDeclarationHeader, isStaticLookupHeader } from "../header.mjs";
import { compileGet, filterNarrow, map } from "../util/index.mjs";
import { clash } from "./clash.mjs";
import { rebuildProgram } from "./program.mjs";
export { reportClash } from "./clash.mjs";

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
 *   options: {
 *     kind: "module" | "script",
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
export const rebuild = ({ root: node }, options, config) => ({
  root: rebuildProgram(node, /** @type {any} */ (config), options),
  clashes: filterNarrow(
    map(
      [
        ...map(filterNarrow(node.head, isDeclarationHeader), getVariable),
        ...map(filterNarrow(node.head, isStaticLookupHeader), getVariable),
      ],
      (variable) => clash(variable, config),
    ),
    isNotNullClash,
  ),
});
