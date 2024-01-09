import { isDeclarationHeader, isStaticLookupHeader } from "../header.mjs";
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
 *   clashes: estree.Variable[],
 * }}
 */
export const rebuild = ({ root: node }, options, { intrinsic, escape }) => {
  const singleton = [escape];
  return {
    root: rebuildProgram(
      node,
      /** @type {any} */ ({
        intrinsic,
        escape,
      }),
      options,
    ),
    clashes: filter(
      [
        ...map(filterNarrow(node.head, isDeclarationHeader), getVariable),
        ...map(filterNarrow(node.head, isStaticLookupHeader), getVariable),
        intrinsic,
      ],
      (variable) =>
        variable === intrinsic || apply(startsWith, variable, singleton),
    ),
  };
};
