import { AranTypeError } from "../../error.mjs";
import { pairup } from "../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { bindSequence, zeroSequence } from "../sequence.mjs";

// make //

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   input: aran.Expression<unbuild.Atom>,
 * ) => import("./operation").SaveOperation}
 */
export const makeCallSuperOperation = (mode, input) => ({
  type: "call-super",
  mode,
  input,
});

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   kind: "method" | "getter" | "setter",
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
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
 *   target: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
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
 *   target: aran.Expression<unbuild.Atom>,
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
 * ) => import("../sequence").Sequence<
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
    case "declare": {
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
  operation.type === "declare";

/**
 * @type {(
 *   operation: import("./operation").SaveOperation,
 * ) => operation is import("./operation").ModuleOperation}
 */
export const isModuleOperation = (operation) => operation.type === "module";

/**
 * @type {(
 *   operation: import("./operation").LoadOperation,
 * ) => operation is import("./operation").ClosureLoadOperation}
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
 * ) => operation is import("./operation").ClosureSaveOperation}
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
