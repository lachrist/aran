import { AranTypeError } from "../../error.mjs";
import { pairup } from "../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { bindSequence, zeroSequence } from "../../sequence.mjs";

// make //

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   input: import("../atom").Expression,
 * ) => import("./operation").SaveOperation}
 */
export const makeCallSuperOperation = (mode, input) => ({
  type: "call-super",
  mode,
  input,
});

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   result: null | import("../atom").Expression,
 *   position: "body" | "tail" ,
 * ) => import("../scope/operation").LoadOperation}
 */
export const makeWrapResultOperation = (mode, result, position) => ({
  type: "wrap-result",
  mode,
  result,
  position,
});

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   variable: import("../../estree").Variable,
 *   right: import("../atom").Expression | null,
 * ) => import("./operation").SaveOperation}
 */
export const makeInitializeOperation = (mode, variable, right) => ({
  type: "initialize",
  variable,
  mode,
  right,
});

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   kind: "method" | "getter" | "setter",
 *   key: import("../../estree").PrivateKey,
 *   value: import("../atom").Expression,
 * ) => import("./operation").SaveOperation}
 */
export const makeInitializePrivateOperation = (mode, kind, key, value) => ({
  type: "initialize-private",
  mode,
  kind,
  key,
  value,
});

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   target: import("../atom").Expression,
 *   key: import("../../estree").PrivateKey,
 * ) => import("./operation").LoadOperation}
 */
export const makeHasPrivateOperation = (mode, target, key) => ({
  type: "has-private",
  mode,
  target,
  key,
});

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   target: import("../atom").Expression,
 *   key: import("../../estree").PrivateKey,
 *   value: import("../atom").Expression,
 * ) => import("./operation").SaveOperation}
 */
export const makeDefinePrivateOperation = (mode, target, key, value) => ({
  type: "define-private",
  mode,
  target,
  key,
  value,
});

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   target: import("../atom").Expression,
 * ) => import("./operation").SaveOperation}
 */
export const makeRegisterPrivateCollectionOperation = (mode, target) => ({
  type: "register-private-collection",
  mode,
  target,
});

/**
 * @type {<O extends import("./operation").VariableOperation>(
 *   site: import("../site").LeafSite,
 *   operation: O,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   [O, O],
 *  >}
 */
export const duplicateVariableOperation = ({ path, meta }, operation) => {
  switch (operation.type) {
    case "read": {
      return zeroSequence(pairup(operation, operation));
    }
    case "typeof": {
      return zeroSequence(pairup(operation, operation));
    }
    case "discard": {
      return zeroSequence(pairup(operation, operation));
    }
    case "initialize": {
      if (operation.right === null) {
        return zeroSequence(pairup(operation, operation));
      } else {
        return bindSequence(
          cacheConstant(meta, operation.right, path),
          (right) =>
            zeroSequence(
              pairup(
                { ...operation, right: makeReadCacheExpression(right, path) },
                { ...operation, right: makeReadCacheExpression(right, path) },
              ),
            ),
        );
      }
    }
    case "write": {
      return bindSequence(cacheConstant(meta, operation.right, path), (right) =>
        zeroSequence(
          pairup(
            { ...operation, right: makeReadCacheExpression(right, path) },
            { ...operation, right: makeReadCacheExpression(right, path) },
          ),
        ),
      );
    }
    case "late-declare": {
      return zeroSequence(pairup(operation, operation));
    }
    case "write-sloppy-function": {
      return zeroSequence(pairup(operation, operation));
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").VariableLoadOperation}
 */
export const isVariableLoadOperation = (operation) =>
  operation.type === "read" ||
  operation.type === "typeof" ||
  operation.type === "discard";

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").VariableSaveOperation}
 */
export const isVariableSaveOperation = (operation) =>
  operation.type === "initialize" ||
  operation.type === "write" ||
  operation.type === "late-declare" ||
  operation.type === "write-sloppy-function";

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").RoutineLoadOperation}
 */
export const isClosureLoadOperation = (operation) =>
  operation.type === "read-this" ||
  operation.type === "read-new-target" ||
  operation.type === "read-input" ||
  operation.type === "read-error" ||
  operation.type === "get-super" ||
  operation.type === "wrap-result";

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").RoutineSaveOperation}
 */
export const isClosureSaveOperation = (operation) =>
  operation.type === "set-super" || operation.type === "call-super";

/**
 * @type {(
 *  operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").PrivateLoadOperation}
 */
export const isPrivateLoadOperation = (operation) =>
  operation.type === "get-private" || operation.type === "has-private";

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").PrivateSaveOperation}
 */
export const isPrivateSaveOperation = (operation) =>
  operation.type === "set-private" ||
  operation.type === "define-private" ||
  operation.type === "initialize-private" ||
  operation.type === "register-private-singleton" ||
  operation.type === "register-private-collection";

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").CatchLoadOperation}
 */
export const isCatchLoadOperation = (operation) =>
  operation.type === "read-error";
