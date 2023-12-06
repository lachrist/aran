import { compileGet, findIndex, flatMap, slice } from "../../util/index.mjs";

const getConsequent = compileGet("consequent");

/**
 * @type {(
 *   node: estree.SwitchStatement,
 * ) => estree.Statement[]}
 */
export const listSwitchRemainder = (node) => {
  const index = findIndex(node.cases, (node) => node.test === null);
  if (index === -1 || index === node.cases.length - 1) {
    return [];
  } else {
    return flatMap(slice(node.cases, index, node.cases.length), getConsequent);
  }
};
