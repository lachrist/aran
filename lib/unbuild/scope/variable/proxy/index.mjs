import { AranExecError, AranTypeError } from "../../../../error.mjs";
import {
  hasOwn,
  liftSequenceX_,
  mapSequence,
  NULL_SEQUENCE,
  zeroSequence,
  flatenTree,
  recordArray,
} from "../../../../util/index.mjs";
import {
  makeWriteCacheEffect,
  makeReadCacheExpression,
  cacheConstant,
} from "../../../cache.mjs";
import {
  incorporateEffect,
  initSyntaxErrorExpression,
} from "../../../prelude/index.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  listExpressionEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   status: import(".").Status,
 *   closure: import("..").Closure,
 * ) => import(".").Status}
 */
const updateStatus = (status, closure) => {
  switch (status) {
    case "live": {
      return "live";
    }
    case "dead": {
      switch (closure) {
        case "internal": {
          return "dead";
        }
        case "external": {
          return "schrodinger";
        }
        default: {
          throw new AranTypeError(closure);
        }
      }
    }
    case "schrodinger": {
      return "schrodinger";
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {(
 *   initial: import("../../../annotation/hoisting").Initial,
 * ) => "live" | "dead"}
 */
const getInitialStatus = (initial) => {
  if (initial === "self-class") {
    return "dead";
  } else if (initial === "self-function") {
    return "live";
  } else if (
    initial === "arguments" ||
    initial === "undefined" ||
    initial === "deadzone" ||
    initial === "import"
  ) {
    throw new AranExecError("unexpected initial value in proxy frame", {
      initial,
    });
  } else {
    throw new AranTypeError(initial);
  }
};

/**
 * @type {(
 *   proxy_binding: {
 *     proxy: import("../../../cache").WritableCache,
 *     binding: import("../../../annotation/hoisting").Binding,
 *   },
 * ) => import("estree-sentry").VariableName}
 */
const getBindingKey = ({ binding: { variable } }) => variable;

/**
 * @type {(
 *   proxy_binding: {
 *     proxy: import("../../../cache").WritableCache,
 *     binding: import("../../../annotation/hoisting").Binding,
 *   },
 * ) => import(".").Binding}
 */
const getBindingVal = ({ proxy, binding: { initial, write, duplicable } }) => ({
  status: getInitialStatus(initial),
  duplicable,
  write,
  proxy,
});

/**
 * @type {import("../../api").Setup<
 *   import(".").RawProxyFrame,
 *   never,
 *   import(".").ProxyFrame
 * >}
 */
export const setupProxyFrame = (_hash, _meta, { bindings }) =>
  zeroSequence({
    type: "proxy",
    record: recordArray(bindings, getBindingKey, getBindingVal),
  });

/**
 * @type {import("../../api").PerformMaybeEffect<
 *   import(".").ProxyFrame,
 *   import("..").LateDeclareVariableOperation,
 *   import("../../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const listProxyLateDeclareEffect = (
  hash,
  _meta,
  { record },
  operation,
) => {
  if (hasOwn(record, operation.variable)) {
    const binding = record[operation.variable];
    if (binding.duplicable) {
      return NULL_SEQUENCE;
    } else {
      switch (operation.conflict) {
        case "report": {
          return liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression(
              `Duplicate variable '${operation.variable}'`,
              hash,
            ),
            hash,
          );
        }
        case "ignore": {
          return NULL_SEQUENCE;
        }
        default: {
          throw new AranTypeError(operation.conflict);
        }
      }
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: unknown,
 * ) => import("../../../atom").Expression}
 */
const makeLiveReadExpression = (hash, { proxy }, _operation) =>
  makeReadCacheExpression(proxy, hash);

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: unknown,
 * ) => import("../../../atom").Expression}
 */
const makeLiveTypeofExpression = (hash, { proxy }, _operation) =>
  makeUnaryExpression("typeof", makeReadCacheExpression(proxy, hash), hash);

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../../util/tree").Tree<import("../../../atom").Effect>}
 */
const listLiveWriteEffect = (hash, { write, proxy }, { variable, right }) => {
  switch (write) {
    case "perform": {
      return makeWriteCacheEffect(proxy, right, hash);
    }
    case "ignore": {
      return listExpressionEffect(right, hash);
    }
    case "report": {
      return [
        listExpressionEffect(right, hash),
        makeExpressionEffect(makeThrowConstantExpression(variable, hash), hash),
      ];
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {<O extends {
 *   variable: import("estree-sentry").VariableName,
 *   closure: import("..").Closure,
 * }>(
 *   perform: (
 *     hash: import("../../../hash").Hash,
 *     binding: import(".").Binding,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 * ) => import("../../api").PerformMaybeExpression<
 *   import(".").ProxyFrame,
 *   O,
 *   never,
 * >}
 */
const compile =
  (perform) =>
  (hash, _meta, { record }, operation) => {
    if (hasOwn(record, operation.variable)) {
      const binding = record[operation.variable];
      const status = updateStatus(binding.status, operation.closure);
      switch (status) {
        case "live": {
          return zeroSequence(perform(hash, binding, operation));
        }
        case "dead": {
          return zeroSequence(
            makeThrowDeadzoneExpression(operation.variable, hash),
          );
        }
        case "schrodinger": {
          return zeroSequence(
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(binding.proxy, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              makeThrowDeadzoneExpression(operation.variable, hash),
              perform(hash, binding, operation),
              hash,
            ),
          );
        }
        default: {
          throw new AranTypeError(status);
        }
      }
    } else {
      return null;
    }
  };

export const makeProxyReadExpression = compile(makeLiveReadExpression);

export const makeProxyTypeofExpression = compile(makeLiveTypeofExpression);

/**
 * @type {import("../../api").PerformMaybeExpression<
 *   import(".").ProxyFrame,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
export const makeProxyDiscardExpression = (
  hash,
  _meta,
  { record },
  operation,
) => {
  if (hasOwn(record, operation.variable)) {
    return zeroSequence(makePrimitiveExpression(false, hash));
  } else {
    return null;
  }
};

/**
 * @type {import("../../api").PerformMaybeExpression<
 *   import(".").ProxyFrame,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
export const makeProxyReadAmbientThisExpression = (
  hash,
  _meta,
  _frame,
  _operation,
) => zeroSequence(makeIntrinsicExpression("undefined", hash));

/**
 * @type {import("../../api").PerformMaybeEffect<
 *   import(".").ProxyFrame,
 *   import("..").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listProxyWriteEffect = (hash, meta, { record }, operation) => {
  if (hasOwn(record, operation.variable)) {
    const binding = record[operation.variable];
    const status = updateStatus(binding.status, operation.closure);
    switch (status) {
      case "live": {
        return zeroSequence(listLiveWriteEffect(hash, binding, operation));
      }
      case "dead": {
        return zeroSequence(
          makeExpressionEffect(
            makeThrowDeadzoneExpression(operation.variable, hash),
            hash,
          ),
        );
      }
      case "schrodinger": {
        return incorporateEffect(
          mapSequence(cacheConstant(meta, operation.right, hash), (right) =>
            makeConditionalEffect(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(binding.proxy, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(operation.variable, hash),
                  hash,
                ),
              ],
              flatenTree(
                listLiveWriteEffect(hash, binding, {
                  variable: operation.variable,
                  right: makeReadCacheExpression(right, hash),
                }),
              ),
              hash,
            ),
          ),
          hash,
        );
      }
      default: {
        throw new AranTypeError(status);
      }
    }
  } else {
    return null;
  }
};

// This should never be called because proxy are currently only used
// for the self binding of classes which cannot contain sloppy function.
export const listProxyWriteSloppyFunctionEffect = listProxyWriteEffect;

/**
 * @type {import("../../api").PerformMaybe<
 *   import(".").ProxyFrame,
 *   import("..").InitializeVariableOperation,
 *   never,
 *   [
 *     import("../../../atom").Effect,
 *     import(".").ProxyFrame,
 *   ],
 * >}
 */
export const listProxyInitializeEffect = (
  hash,
  _meta,
  { record },
  operation,
) => {
  if (hasOwn(record, operation.variable)) {
    const binding = record[operation.variable];
    if (binding.status === "dead") {
      return zeroSequence([
        makeWriteCacheEffect(
          binding.proxy,
          operation.right === null
            ? makePrimitiveExpression("undefined", hash)
            : operation.right,
          hash,
        ),
        {
          type: "proxy",
          record: {
            ...record,
            [operation.variable]: {
              ...binding,
              status: "live",
            },
          },
        },
      ]);
    } else {
      throw new AranExecError("Duplicate variable initialization", {
        hash,
        record,
        operation,
      });
    }
  } else {
    return null;
  }
};
