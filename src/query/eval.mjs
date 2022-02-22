import {mapCurry, hasOwnProperty} from "../util.mjs";
import {some, filter} from "array-lite";

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
          mapCurry(filter(ownKeys(any), isNodeKey), get, any),
          hasDirectEvalCall,
        );
      }
    } else {
      return some(mapCurry(ownKeys(any), get, any), hasDirectEvalCall);
    }
  } else {
    return false;
  }
};
