import { map, some, filter } from "array-lite";

import { get, hasOwn, partialx_ } from "../util/index.mjs";

const {
  Array: { isArray },
  Reflect: { ownKeys },
} = globalThis;

// Optional apply is not direct eval call:
//
// > (((x) => eval?.("x")) (123))
// Uncaught ReferenceError: x is not defined
//
// Spread apply is not direct eval call:
//
// (((x) => eval?.(...["x"])) (123))
// Uncaught ReferenceError: x is not defined
export const isDirectEvalCall = (node) =>
  node.type === "CallExpression" &&
  !node.optional &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  node.arguments.length > 0 &&
  node.arguments[0].type !== "SpreadElement";

const isNodeKey = (key) =>
  key !== "type" &&
  key !== "loc" &&
  key !== "range" &&
  key !== "start" &&
  key !== "end";

export const hasDirectEvalCall = (any) => {
  if (isArray(any)) {
    return some(any, hasDirectEvalCall);
  } else if (typeof any === "object" && any !== null) {
    if (hasOwn(any, "type")) {
      if (isDirectEvalCall(any)) {
        return true;
      } else if (
        any.type === "ArrowFunctionExpression" ||
        any.type === "FunctionExpression" ||
        any.type === "FunctionDeclaration"
      ) {
        return false;
      } else {
        return some(
          map(filter(ownKeys(any), isNodeKey), partialx_(get, any)),
          hasDirectEvalCall,
        );
      }
    } else {
      return some(map(ownKeys(any), partialx_(get, any)), hasDirectEvalCall);
    }
  } else {
    return false;
  }
};
