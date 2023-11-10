import { listLog } from "./log.mjs";
import { rebuildProgram } from "./visit.mjs";

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   options: {
 *     escape: estree.Variable,
 *     intrinsic: estree.Variable,
 *     advice: estree.Variable,
 *     base: import("../../type/options.d.ts").Base,
 *   },
 * ) => {
 *   node: estree.Program,
 *   logs: rebuild.Log[],
 * }}
 */
export const rebuild = (node1, options) => {
  const node2 = rebuildProgram(node1, options);
  return {
    node: node2,
    logs: listLog(node2),
  };
};
