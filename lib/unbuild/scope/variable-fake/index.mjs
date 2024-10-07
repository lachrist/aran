import { AranTypeError } from "../../../report.mjs";
import {
  pairup,
  hasOwn,
  reduceEntry,
  map,
  concat_,
  EMPTY,
} from "../../../util/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
  cacheConstant,
} from "../../cache.mjs";
import {
  incorporateEffect,
  initSyntaxErrorExpression,
} from "../../prelude/index.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  flatSequence,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   baseline: "live" | "dead",
 * ) => import("../../../lang").Intrinsic}
 */
const getBaselineIntrinsic = (baseline) => {
  switch (baseline) {
    case "live": {
      return "undefined";
    }
    case "dead": {
      return "aran.deadzone";
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: import("../../annotation/hoisting").Binding,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   [
 *     import("estree-sentry").VariableName,
 *     import(".").Binding,
 *   ],
 * >}
 */
const setupBinding = (_hash, meta, binding) =>
  mapSequence(
    cacheWritable(meta, getBaselineIntrinsic(binding.baseline)),
    (proxy) =>
      pairup(binding.variable, {
        write: binding.write,
        baseline: binding.baseline,
        proxy,
      }),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   bindings: import("../../annotation/hoisting").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import(".").FakeFrame
 * >}
 */
export const setupFakeFrame = (hash, meta, bindings) =>
  mapSequence(
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(hash, forkMeta((meta = nextMeta(meta))), binding),
      ),
    ),
    (entries) => ({
      type: "fake",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../cache").Cache,
 *   },
 * ) => import("../../atom").Effect[]}
 */
const listDeadzoneWriteEffect = (hash, binding, operation) => {
  switch (binding.write) {
    case "perform": {
      return [
        makeWriteCacheEffect(
          binding.proxy,
          makeReadCacheExpression(operation.right, hash),
          hash,
        ),
      ];
    }
    case "ignore": {
      return EMPTY;
    }
    case "report": {
      return [
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, hash),
          hash,
        ),
      ];
    }
    default: {
      throw new AranTypeError(binding.write);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: import("../operation").WriteOperation,
 * ) => import("../../atom").Effect[]}
 */
const listUndefinedWriteEffect = (hash, binding, operation) => {
  switch (binding.write) {
    case "perform": {
      return [makeWriteCacheEffect(binding.proxy, operation.right, hash)];
    }
    case "ignore": {
      return [makeExpressionEffect(operation.right, hash)];
    }
    case "report": {
      return [
        makeExpressionEffect(operation.right, hash),
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, hash),
          hash,
        ),
      ];
    }
    default: {
      throw new AranTypeError(binding.write);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: import(".").Binding,
 *   operation: Exclude<
 *     import("../operation").VariableSaveOperation,
 *     import("../operation").WriteSloppyFunctionOperation
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
const listBindingSaveEffect = (hash, meta, binding, operation) => {
  switch (operation.type) {
    case "late-declare": {
      switch (binding.baseline) {
        case "dead": {
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
        case "live": {
          return EMPTY_SEQUENCE;
        }
        default: {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    case "initialize": {
      switch (binding.baseline) {
        case "dead": {
          return zeroSequence([
            makeWriteCacheEffect(
              binding.proxy,
              operation.right === null
                ? makeIntrinsicExpression("undefined", hash)
                : operation.right,
              hash,
            ),
          ]);
        }
        case "live": {
          if (operation.right === null) {
            return EMPTY_SEQUENCE;
          } else {
            return zeroSequence([
              makeWriteCacheEffect(binding.proxy, operation.right, hash),
            ]);
          }
        }
        default: {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    case "write": {
      switch (binding.baseline) {
        case "live": {
          return zeroSequence(
            listUndefinedWriteEffect(hash, binding, operation),
          );
        }
        case "dead": {
          return incorporateEffect(
            mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(binding.proxy, hash),
                  makeIntrinsicExpression("aran.deadzone", hash),
                  hash,
                ),
                listDeadzoneWriteEffect(hash, binding, {
                  variable: operation.variable,
                  right,
                }),
                [
                  makeExpressionEffect(
                    makeThrowConstantExpression(operation.variable, hash),
                    hash,
                  ),
                ],
                hash,
              ),
            ]),
            hash,
          );
        }
        default: {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").FakeFrame
 * >}
 */
export const listFakeSaveEffect = (
  hash,
  meta,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (
    (operation.type === "late-declare" ||
      operation.type === "initialize" ||
      operation.type === "write") &&
    hasOwn(frame.record, operation.variable)
  ) {
    return listBindingSaveEffect(
      hash,
      meta,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../atom").Expression}
 */
const makeBindingLoadExpression = (hash, binding, operation) => {
  switch (operation.type) {
    case "read": {
      switch (binding.baseline) {
        case "dead": {
          return makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(binding.proxy, hash),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            makeThrowDeadzoneExpression(operation.variable, hash),
            makeReadCacheExpression(binding.proxy, hash),
            hash,
          );
        }
        case "live": {
          return makeReadCacheExpression(binding.proxy, hash);
        }
        default: {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    case "typeof": {
      switch (binding.baseline) {
        case "dead": {
          return makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(binding.proxy, hash),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            makeThrowDeadzoneExpression(operation.variable, hash),
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(binding.proxy, hash),
              hash,
            ),
            hash,
          );
        }
        case "live": {
          return makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(binding.proxy, hash),
            hash,
          );
        }
        default: {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    case "discard": {
      return makePrimitiveExpression(false, hash);
    }
    case "read-ambient-this": {
      return makeIntrinsicExpression("undefined", hash);
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").FakeFrame
 * >}
 */
export const makeFakeLookupExpression = (
  hash,
  meta,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (
    (operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard") &&
    hasOwn(frame.record, operation.variable)
  ) {
    return zeroSequence(
      makeBindingLoadExpression(
        hash,
        frame.record[operation.variable],
        operation,
      ),
    );
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};
