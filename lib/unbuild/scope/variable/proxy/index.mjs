import { AranExecError, AranTypeError } from "../../../../report.mjs";
import {
  hasOwn,
  reduceEntry,
  map,
  concat_,
  EMPTY,
  concatX_,
} from "../../../../util/index.mjs";
import {
  cacheWritable,
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
import { forkMeta, nextMeta } from "../../../meta.mjs";
import {
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import {
  EMPTY_SEQUENCE,
  flatSequence,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { listConditionalEffect } from "../../../../node.mjs";

/**
 * @type {(
 *   baseline: import("../../../annotation/hoisting").Baseline,
 * ) => {
 *   intrinsic: import("../../../../lang").Intrinsic,
 *   status: import(".").Status,
 *   duplicable: boolean,
 * }}
 */
const initBaseline = (baseline) => {
  switch (baseline) {
    case "live": {
      return { intrinsic: "undefined", status: "live", duplicable: true };
    }
    case "dead": {
      return {
        intrinsic: "aran.deadzone",
        status: "dead",
        duplicable: true,
      };
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

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
 * @type {import("../../api").Setup<
 *   import("../../../annotation/hoisting").Binding,
 *   import("../../../prelude").MetaDeclarationPrelude,
 *   [
 *     import("estree-sentry").VariableName,
 *     import(".").Binding,
 *   ],
 * >}
 */
const setupBinding = (_hash, meta, { baseline, variable, write }) => {
  const { intrinsic, status, duplicable } = initBaseline(baseline);
  return mapSequence(cacheWritable(meta, intrinsic), (proxy) => [
    variable,
    { status, duplicable, write, proxy },
  ]);
};

/**
 * @type {import("../../api").Setup<
 *   import(".").RawProxyFrame,
 *   import("../../../prelude").MetaDeclarationPrelude,
 *   import(".").ProxyFrame
 * >}
 */
export const setupProxyFrame = (hash, meta, { bindings }) =>
  mapSequence(
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(hash, forkMeta((meta = nextMeta(meta))), binding),
      ),
    ),
    (entries) => ({
      type: "proxy",
      record: reduceEntry(entries),
    }),
  );

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
      return EMPTY_SEQUENCE;
    } else {
      switch (operation.conflict) {
        case "report": {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeExpressionEffect,
              initSyntaxErrorExpression(
                `Duplicate variable '${operation.variable}'`,
                hash,
              ),
              hash,
            ),
          );
        }
        case "ignore": {
          return EMPTY_SEQUENCE;
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
 *   hash: import("../../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: unknown,
 * ) => import("../../../atom").Expression}
 */
const makeLiveReadExpression = (hash, { proxy }, _operation) =>
  makeReadCacheExpression(proxy, hash);

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: unknown,
 * ) => import("../../../atom").Expression}
 */
const makeLiveTypeofExpression = (hash, { proxy }, _operation) =>
  makeUnaryExpression("typeof", makeReadCacheExpression(proxy, hash), hash);

/**
 * @type {(
 *   node: import("../../../atom").Expression,
 *   hash: import("../../../../hash").Hash,
 * ) => import("../../../atom").Effect[]}
 */
const wrapExpression = (node, hash) => {
  if (
    node.type === "ReadExpression" ||
    node.type === "PrimitiveExpression" ||
    node.type === "IntrinsicExpression"
  ) {
    return EMPTY;
  } else {
    return [makeExpressionEffect(node, hash)];
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../atom").Effect[]}
 */
const listLiveWriteEffect = (hash, { write, proxy }, { variable, right }) => {
  switch (write) {
    case "perform": {
      return [makeWriteCacheEffect(proxy, right, hash)];
    }
    case "ignore": {
      return wrapExpression(right, hash);
    }
    case "report": {
      return concatX_(
        wrapExpression(right, hash),
        makeExpressionEffect(makeThrowConstantExpression(variable, hash), hash),
      );
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
 *     hash: import("../../../../hash").Hash,
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
        return zeroSequence([
          makeExpressionEffect(
            makeThrowDeadzoneExpression(operation.variable, hash),
            hash,
          ),
        ]);
      }
      case "schrodinger": {
        return incorporateEffect(
          mapSequence(cacheConstant(meta, operation.right, hash), (right) =>
            listConditionalEffect(
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
              listLiveWriteEffect(hash, binding, {
                variable: operation.variable,
                right: makeReadCacheExpression(right, hash),
              }),
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

/**
 * @type {import("../../api").PerformMaybeEffect<
 *   import(".").ProxyFrame,
 *   import("..").WriteSloppyFunctionVariableOperation,
 *   never,
 * >}
 */
export const listProxyWriteSloppyFunctionEffect = (
  hash,
  meta,
  frame,
  operation,
) => {
  throw new AranExecError(
    "not implemented: proxy frame are only used in classes which cannot contain sloppy function declarations",
    {
      hash,
      meta,
      frame,
      operation,
    },
  );
};

/**
 * @type {import("../../api").PerformMaybe<
 *   import(".").ProxyFrame,
 *   import("..").InitializeVariableOperation,
 *   never,
 *   [
 *     import("../../../atom").Effect[],
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
        [
          makeWriteCacheEffect(
            binding.proxy,
            operation.right === null
              ? makePrimitiveExpression("undefined", hash)
              : operation.right,
            hash,
          ),
        ],
        {
          type: "proxy",
          record: {
            ...record,
            [operation.variable]: {
              ...binding,
              status: operation.status,
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
