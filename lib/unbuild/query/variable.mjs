/* eslint-disable local/no-label */
/* eslint-disable local/no-impure */

import { flatMap, includes } from "../../util/index.mjs";
import { listPatternVariable } from "./hoist.mjs";
import { listChild } from "./child.mjs";

/**
 * @type {(
 *   nodes: estree.Node[],
 *   variable: estree.Variable,
 * ) => boolean}
 */
export const hasFreeVariable = (nodes, variable) => {
  for (const node of nodes) {
    if (
      variable === "argument" &&
      (node.type === "FunctionExpression" ||
        node.type === "FunctionDeclaration")
    ) {
      return false;
    }
    if (
      node.type === "CatchClause" &&
      node.param !== null &&
      includes(listPatternVariable(node.param), variable)
    ) {
      return false;
    }
    if (
      (node.type === "FunctionExpression" ||
        node.type === "FunctionDeclaration" ||
        node.type === "ArrowFunctionExpression") &&
      includes(flatMap(node.params, listPatternVariable), variable)
    ) {
      return false;
    }
    if (node.type === "BlockStatement" || node.type === "StaticBlock") {
      for (const child of node.body) {
        if (
          (child.type === "FunctionDeclaration" ||
            child.type === "ClassDeclaration") &&
          child.id !== null &&
          child.id.name === variable
        ) {
          return false;
        }
        if (child.type === "VariableDeclaration") {
          for (const declarator of child.declarations) {
            if (includes(listPatternVariable(declarator.id), variable)) {
              return false;
            }
          }
        }
      }
    }
    if (node.type === "Identifier" && node.name === variable) {
      return true;
    }
    if (hasFreeVariable(listChild(node), variable)) {
      return true;
    }
  }
  return false;
};
