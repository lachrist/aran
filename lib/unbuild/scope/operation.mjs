import { AranTypeError } from "../../error.mjs";
import { hasNarrowKey, pairup } from "../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { bindSequence, zeroSequence } from "../../sequence.mjs";

//////////
// make //
//////////

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
 *   result: import("../atom").Expression | null,
 * ) => import("../scope/operation").SaveOperation}
 */
export const makeUpdateResultOperation = (mode, result) => ({
  type: "update-result",
  mode,
  result,
});

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   result: import("../atom").Expression | null,
 * ) => import("../scope/operation").LoadOperation}
 */
export const makeFinalizeResultOperation = (mode, result) => ({
  type: "finalize-result",
  mode,
  result,
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

///////////////
// duplicate //
///////////////

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

////////
// is //
////////

/**
 * @type {{[
 *   key in import("./operation").VariableLoadOperation["type"]
 * ]: null}}
 */
const VARIABLE_LOAD_TYPE_RECORD = {
  read: null,
  typeof: null,
  discard: null,
};

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").VariableLoadOperation}
 */
export const isVariableLoadOperation = (operation) =>
  hasNarrowKey(VARIABLE_LOAD_TYPE_RECORD, operation.type);

/**
 * @type {{[
 *   key in import("./operation").VariableSaveOperation["type"]
 * ]: null}}
 */
const VARIABLE_SAVE_TYPE_RECORD = {
  "initialize": null,
  "write": null,
  "late-declare": null,
  "write-sloppy-function": null,
};

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").VariableSaveOperation}
 */
export const isVariableSaveOperation = (operation) =>
  hasNarrowKey(VARIABLE_SAVE_TYPE_RECORD, operation.type);

/**
 * @type {{[
 *   key in import("./operation").RoutineLoadOperation["type"]
 * ]: null}}
 */
const ROUTINE_LOAD_TYPE_RECORD = {
  "read-this": null,
  "read-new-target": null,
  "read-input": null,
  "get-super": null,
  "finalize-result": null,
  "backup-result": null,
};

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").RoutineLoadOperation}
 */
export const isRoutineLoadOperation = (operation) =>
  hasNarrowKey(ROUTINE_LOAD_TYPE_RECORD, operation.type);

/**
 * @type {{[
 *   key in import("./operation").RoutineSaveOperation["type"]
 * ]: null}}
 */
const ROUTINE_SAVE_TYPE_RECORD = {
  "set-super": null,
  "call-super": null,
  "update-result": null,
};

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").RoutineSaveOperation}
 */
export const isRoutineSaveOperation = (operation) =>
  hasNarrowKey(ROUTINE_SAVE_TYPE_RECORD, operation.type);

/**
 * @type {{[
 *  key in import("./operation").PrivateLoadOperation["type"]
 * ]: null}}
 */
const PRIVATE_LOAD_TYPE_RECORD = {
  "get-private": null,
  "has-private": null,
};

/**
 * @type {(
 *  operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").PrivateLoadOperation}
 */
export const isPrivateLoadOperation = (operation) =>
  hasNarrowKey(PRIVATE_LOAD_TYPE_RECORD, operation.type);

/**
 * @type {{[
 *  key in import("./operation").PrivateSaveOperation["type"]
 * ]: null}}
 */
const PRIVATE_SAVE_TYPE_RECORD = {
  "set-private": null,
  "define-private": null,
  "initialize-private": null,
  "register-private-singleton": null,
  "register-private-collection": null,
};

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").PrivateSaveOperation}
 */
export const isPrivateSaveOperation = (operation) =>
  hasNarrowKey(PRIVATE_SAVE_TYPE_RECORD, operation.type);

/**
 * @type {{[
 *  key in import("./operation").CatchLoadOperation["type"]
 * ]: null}}
 */
const CATCH_LOAD_TYPE_RECORD = {
  "read-error": null,
};

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").CatchLoadOperation}
 */
export const isCatchLoadOperation = (operation) =>
  hasNarrowKey(CATCH_LOAD_TYPE_RECORD, operation.type);
