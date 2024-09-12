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
 *   site: import("../../site").LeafSite,
 *   binding: import("../../query/hoist-public").Binding,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   [
 *     import("../../../estree").Variable,
 *     import(".").Binding,
 *   ],
 * >}
 */
const setupBinding = ({ meta }, binding) =>
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
 *   site: {
 *     path: import("../../../path").Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import(".").FakeFrame
 * >}
 */
export const setupFakeFrame = ({ path, meta }, bindings) =>
  mapSequence(
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          binding,
        ),
      ),
    ),
    (entries) => ({
      type: "fake",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").Binding,
 *   operation: {
 *     variable: import("../../../estree").Variable,
 *     right: import("../../cache").Cache,
 *   },
 * ) => import("../../atom").Effect[]}
 */
const listDeadzoneWriteEffect = ({ path }, binding, operation) => {
  switch (binding.write) {
    case "perform": {
      return [
        makeWriteCacheEffect(
          binding.proxy,
          makeReadCacheExpression(operation.right, path),
          path,
        ),
      ];
    }
    case "ignore": {
      return EMPTY;
    }
    case "report": {
      return [
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
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
 *   site: import("../../site").VoidSite,
 *   binding: import(".").Binding,
 *   operation: import("../operation").WriteOperation,
 * ) => import("../../atom").Effect[]}
 */
const listUndefinedWriteEffect = ({ path }, binding, operation) => {
  switch (binding.write) {
    case "perform": {
      return [makeWriteCacheEffect(binding.proxy, operation.right, path)];
    }
    case "ignore": {
      return [makeExpressionEffect(operation.right, path)];
    }
    case "report": {
      return [
        makeExpressionEffect(operation.right, path),
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
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
 *   site: import("../../site").LeafSite,
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
const listBindingSaveEffect = ({ path, meta }, binding, operation) => {
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
                    path,
                  ),
                  path,
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
                ? makeIntrinsicExpression("undefined", path)
                : operation.right,
              path,
            ),
          ]);
        }
        case "live": {
          if (operation.right === null) {
            return EMPTY_SEQUENCE;
          } else {
            return zeroSequence([
              makeWriteCacheEffect(binding.proxy, operation.right, path),
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
            listUndefinedWriteEffect({ path }, binding, operation),
          );
        }
        case "dead": {
          return incorporateEffect(
            mapSequence(cacheConstant(meta, operation.right, path), (right) => [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(binding.proxy, path),
                  makeIntrinsicExpression("aran.deadzone", path),
                  path,
                ),
                listDeadzoneWriteEffect({ path }, binding, {
                  variable: operation.variable,
                  right,
                }),
                [
                  makeExpressionEffect(
                    makeThrowConstantExpression(operation.variable, path),
                    path,
                  ),
                ],
                path,
              ),
            ]),
            path,
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
  site,
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
      site,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return makeAlternateExpression(site, context, operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").Binding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../atom").Expression}
 */
const makeBindingLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      switch (binding.baseline) {
        case "dead": {
          return makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(binding.proxy, path),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            makeThrowDeadzoneExpression(operation.variable, path),
            makeReadCacheExpression(binding.proxy, path),
            path,
          );
        }
        case "live": {
          return makeReadCacheExpression(binding.proxy, path);
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
              makeReadCacheExpression(binding.proxy, path),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            makeThrowDeadzoneExpression(operation.variable, path),
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(binding.proxy, path),
              path,
            ),
            path,
          );
        }
        case "live": {
          return makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(binding.proxy, path),
            path,
          );
        }
        default: {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    case "read-ambient-this": {
      return makeIntrinsicExpression("undefined", path);
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
  site,
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
        site,
        frame.record[operation.variable],
        operation,
      ),
    );
  } else {
    return makeAlternateExpression(site, context, operation);
  }
};
