import {map, some, filter} from "array-lite";

import {hasOwnProperty, partial1} from "../util.mjs";

const {
  Array: {isArray},
  Reflect: {ownKeys},
} = globalThis;

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

const get = (object, key) => object[key];

export const hasDirectEvalCall = (any) => {
  if (isArray(any)) {
    return some(any, hasDirectEvalCall);
  } else if (typeof any === "object" && any !== null) {
    if (hasOwnProperty(any, "type")) {
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
          map(filter(ownKeys(any), isNodeKey), partial1(get, any)),
          hasDirectEvalCall,
        );
      }
    } else {
      return some(map(ownKeys(any), partial1(get, any)), hasDirectEvalCall);
    }
  } else {
    return false;
  }
};
