import { AranTypeError } from "../../report.mjs";
import { hasNarrowKey } from "../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  bindTwoSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { nextMeta } from "../meta.mjs";

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
 * @type {<X>(
 *   item: X,
 * ) => [X, X]}
 */
const duplicate = (item) => [item, item];

/**
 * @type {<O extends import("./operation").Operation>(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   operation: O,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   [O, O],
 *  >}
 */
export const duplicateOperation = (hash, meta, operation) => {
  switch (operation.type) {
    // variable //
    case "read": {
      return zeroSequence(duplicate(operation));
    }
    case "typeof": {
      return zeroSequence(duplicate(operation));
    }
    case "discard": {
      return zeroSequence(duplicate(operation));
    }
    case "initialize": {
      if (operation.right === null) {
        return zeroSequence(duplicate(operation));
      } else {
        return bindSequence(
          cacheConstant(meta, operation.right, hash),
          (right) =>
            zeroSequence(
              duplicate({
                ...operation,
                right: makeReadCacheExpression(right, hash),
              }),
            ),
        );
      }
    }
    case "write": {
      return bindSequence(cacheConstant(meta, operation.right, hash), (right) =>
        zeroSequence(
          duplicate({
            ...operation,
            right: makeReadCacheExpression(right, hash),
          }),
        ),
      );
    }
    case "write-sloppy-function": {
      return zeroSequence(duplicate(operation));
    }
    case "late-declare": {
      return zeroSequence(duplicate(operation));
    }
    case "read-ambient-this": {
      return zeroSequence(duplicate(operation));
    }
    // private //
    case "define-private": {
      return bindTwoSequence(
        cacheConstant((meta = nextMeta(meta)), operation.target, hash),
        cacheConstant((meta = nextMeta(meta)), operation.value, hash),
        (target, value) =>
          zeroSequence(
            duplicate({
              ...operation,
              target: makeReadCacheExpression(target, hash),
              value: makeReadCacheExpression(value, hash),
            }),
          ),
      );
    }
    case "initialize-private": {
      return bindSequence(cacheConstant(meta, operation.value, hash), (value) =>
        zeroSequence(
          duplicate({
            ...operation,
            value: makeReadCacheExpression(value, hash),
          }),
        ),
      );
    }
    case "register-private-collection": {
      return bindSequence(
        cacheConstant(meta, operation.target, hash),
        (target) =>
          zeroSequence(
            duplicate({
              ...operation,
              target: makeReadCacheExpression(target, hash),
            }),
          ),
      );
    }
    case "register-private-singleton": {
      return bindSequence(
        cacheConstant(meta, operation.target, hash),
        (target) =>
          zeroSequence(
            duplicate({
              ...operation,
              target: makeReadCacheExpression(target, hash),
            }),
          ),
      );
    }
    case "has-private": {
      return bindSequence(
        cacheConstant(meta, operation.target, hash),
        (target) =>
          zeroSequence(
            duplicate({
              ...operation,
              target: makeReadCacheExpression(target, hash),
            }),
          ),
      );
    }
    case "get-private": {
      return bindSequence(
        cacheConstant(meta, operation.target, hash),
        (target) =>
          zeroSequence(
            duplicate({
              ...operation,
              target: makeReadCacheExpression(target, hash),
            }),
          ),
      );
    }
    case "set-private": {
      return bindTwoSequence(
        cacheConstant((meta = nextMeta(meta)), operation.target, hash),
        cacheConstant((meta = nextMeta(meta)), operation.value, hash),
        (target, value) =>
          zeroSequence(
            duplicate({
              ...operation,
              target: makeReadCacheExpression(target, hash),
              value: makeReadCacheExpression(value, hash),
            }),
          ),
      );
    }
    // super //
    case "get-super": {
      return bindSequence(cacheConstant(meta, operation.key, hash), (key) =>
        zeroSequence(
          duplicate({
            ...operation,
            key: makeReadCacheExpression(key, hash),
          }),
        ),
      );
    }
    case "set-super": {
      return bindTwoSequence(
        cacheConstant((meta = nextMeta(meta)), operation.key, hash),
        cacheConstant((meta = nextMeta(meta)), operation.value, hash),
        (key, value) =>
          zeroSequence(
            duplicate({
              ...operation,
              key: makeReadCacheExpression(key, hash),
              value: makeReadCacheExpression(value, hash),
            }),
          ),
      );
    }
    case "call-super": {
      return bindSequence(cacheConstant(meta, operation.input, hash), (input) =>
        zeroSequence(
          duplicate({
            ...operation,
            input: makeReadCacheExpression(input, hash),
          }),
        ),
      );
    }
    // result //
    case "update-result": {
      if (operation.result === null) {
        return zeroSequence(duplicate(operation));
      } else {
        return bindSequence(
          cacheConstant(meta, operation.result, hash),
          (result) =>
            zeroSequence(
              duplicate({
                ...operation,
                result: makeReadCacheExpression(result, hash),
              }),
            ),
        );
      }
    }
    case "finalize-result": {
      if (operation.result === null) {
        return zeroSequence(duplicate(operation));
      } else {
        return bindSequence(
          cacheConstant(meta, operation.result, hash),
          (result) =>
            zeroSequence(
              duplicate({
                ...operation,
                result: makeReadCacheExpression(result, hash),
              }),
            ),
        );
      }
    }
    case "backup-result": {
      return zeroSequence(duplicate(operation));
    }
    // other //
    case "read-this": {
      return zeroSequence(duplicate(operation));
    }
    case "read-new-target": {
      return zeroSequence(duplicate(operation));
    }
    case "read-input": {
      return zeroSequence(duplicate(operation));
    }
    case "read-import-meta": {
      return zeroSequence(duplicate(operation));
    }
    case "read-error": {
      return zeroSequence(duplicate(operation));
    }
    case "read-import": {
      return zeroSequence(duplicate(operation));
    }
    // default //
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
  "read": null,
  "typeof": null,
  "discard": null,
  "read-ambient-this": null,
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
