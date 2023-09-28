import { map, some, filter, hasOwn } from "../../util/index.mjs";

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
/** @type {(node: estree.Node) => boolean} */
export const isDirectEvalCall = (node) =>
  node.type === "CallExpression" &&
  !node.optional &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  node.arguments.length > 0 &&
  node.arguments[0].type !== "SpreadElement";

/** @type {(key: unknown) => boolean} */
const isNodeKey = (key) =>
  key !== "type" &&
  key !== "loc" &&
  key !== "range" &&
  key !== "start" &&
  key !== "end";

/** @type {(object: object) => object is estree.Node} */
const isEstreeNode = (object) => hasOwn(object, "type");

/** @type {(any: unknown) => boolean} */
export const hasDirectEvalCall = (any) => {
  if (isArray(any)) {
    return some(any, hasDirectEvalCall);
  } else if (typeof any === "object" && any !== null) {
    if (isEstreeNode(any)) {
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
          map(
            filter(ownKeys(any), isNodeKey),
            (key) => /** @type {any} */ (any)[key],
          ),
          hasDirectEvalCall,
        );
      }
    } else {
      return some(
        map(ownKeys(any), (key) => /** @type {any} */ (any)[key]),
        hasDirectEvalCall,
      );
    }
  } else {
    return false;
  }
};
