import { AranTypeError } from "../../../report.mjs";
import {
  EMPTY,
  concatX_,
  concat_,
  fromMaybe,
  hasOwn,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import { duplicateOperation, isVariableLoadOperation } from "../operation.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import {
  incorporateEffect,
  incorporateExpression,
  initSyntaxErrorExpression,
} from "../../prelude/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   binding: import("../../annotation/hoisting").Binding,
 * ) => [
 *   import("estree-sentry").VariableName,
 *   import(".").Binding,
 * ]}
 */
const toBindingEntry = ({ variable, baseline, write }) => [
  variable,
  { baseline, write },
];

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   bindings: import("../../annotation/hoisting").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = (hash, meta, bindings) =>
  mapSequence(
    cacheConstant(
      meta,
      makeApplyExpression(
        makeIntrinsicExpression("Object.create", hash),
        makeIntrinsicExpression("undefined", hash),
        [makePrimitiveExpression(null, hash)],
        hash,
      ),
      hash,
    ),
    (dynamic) => ({
      type: /** @type {"eval"} */ ("eval"),
      dynamic,
      static: reduceEntry(map(bindings, toBindingEntry)),
    }),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   frame: import("../../cache").Cache,
 *   operation: {
 *     type: "read" | "typeof" | "discard" | "read-ambient-this",
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../atom").Expression}
 */
const makePerformExpression = (hash, frame, operation) => {
  switch (operation.type) {
    case "read": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeReadCacheExpression(frame, hash),
          makePrimitiveExpression(operation.variable, hash),
        ],
        hash,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeReadCacheExpression(frame, hash),
            makePrimitiveExpression(operation.variable, hash),
          ],
          hash,
        ),
        hash,
      );
    }
    case "discard": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeReadCacheExpression(frame, hash),
          makePrimitiveExpression(operation.variable, hash),
        ],
        hash,
      );
    }
    case "read-ambient-this": {
      return makeIntrinsicExpression("undefined", hash);
    }
    default: {
      throw new AranTypeError(operation.type);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   frame: import("../../cache").Cache,
 *   operation: {
 *     type: "perform" | "ignore" | "report",
 *     variable: import("estree-sentry").VariableName,
 *     right: null | import("../../atom").Expression,
 *   },
 * ) => import("../../atom").Effect[]}
 */
const listPerformEffect = (hash, frame, operation) => {
  switch (operation.type) {
    case "perform": {
      if (operation.right === null) {
        return EMPTY;
      } else {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeReadCacheExpression(frame, hash),
                makePrimitiveExpression(operation.variable, hash),
                operation.right,
              ],
              hash,
            ),
            hash,
          ),
        ];
      }
    }
    case "ignore": {
      if (operation.right === null) {
        return EMPTY;
      } else {
        return [makeExpressionEffect(operation.right, hash)];
      }
    }
    case "report": {
      return concatX_(
        operation.right === null
          ? EMPTY
          : [makeExpressionEffect(operation.right, hash)],
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, hash),
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(operation.type);
    }
  }
};

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").EvalFrame
 * >}
 */
export const makeEvalLoadExpression = (
  hash,
  meta,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (isVariableLoadOperation(operation)) {
    if (hasOwn(frame.static, operation.variable)) {
      if (operation.type === "discard") {
        return zeroSequence(makePrimitiveExpression(false, hash));
      } else if (operation.type === "read" || operation.type === "typeof") {
        const binding = frame.static[operation.variable];
        switch (binding.baseline) {
          case "live": {
            return zeroSequence(
              makePerformExpression(hash, frame.dynamic, operation),
            );
          }
          case "dead": {
            return zeroSequence(
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.get", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makeReadCacheExpression(frame.dynamic, hash),
                      makePrimitiveExpression(operation.variable, hash),
                    ],
                    hash,
                  ),
                  makeIntrinsicExpression("aran.deadzone", hash),
                  hash,
                ),
                makeThrowDeadzoneExpression(operation.variable, hash),
                makePerformExpression(hash, frame.dynamic, operation),
                hash,
              ),
            );
          }
          default: {
            throw new AranTypeError(binding.baseline);
          }
        }
      } else if (operation.type === "read-ambient-this") {
        return zeroSequence(
          makePerformExpression(hash, frame.dynamic, operation),
        );
      } else {
        throw new AranTypeError(operation);
      }
    } else {
      return incorporateExpression(
        bindSequence(
          duplicateOperation(
            hash,
            forkMeta((meta = nextMeta(meta))),
            operation,
          ),
          ([operation1, operation2]) =>
            liftSequence__X_(
              makeConditionalExpression,
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.has", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeReadCacheExpression(frame.dynamic, hash),
                  makePrimitiveExpression(operation.variable, hash),
                ],
                hash,
              ),
              makePerformExpression(hash, frame.dynamic, operation1),
              makeAlternateExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                context,
                operation2,
              ),
              hash,
            ),
        ),
        hash,
      );
    }
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

/**
 * @type {(
 *   operation: (
 *     | import("../operation").InitializeOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").WriteSloppyFunctionOperation
 *   ),
 *   hash: import("../../../hash").Hash,
 * ) => null | import("../../atom").Expression}
 */
export const makeRightExpression = (operation, hash) => {
  switch (operation.type) {
    case "initialize": {
      return operation.right;
    }
    case "write": {
      return operation.right;
    }
    case "write-sloppy-function": {
      if (operation.right === null) {
        return null;
      } else {
        return makeReadExpression(operation.right, hash);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").EvalFrame,
 * >}
 */
export const listEvalSaveEffect = (
  hash,
  meta,
  frame,
  operation,
  listAlternateEffect,
  context,
) => {
  if (operation.type === "late-declare") {
    if (hasOwn(frame.static, operation.variable)) {
      const binding = frame.static[operation.variable];
      switch (binding.baseline) {
        case "dead": {
          switch (operation.conflict) {
            case "report": {
              return liftSequenceX(
                concat_,
                liftSequenceX_(
                  makeExpressionEffect,
                  initSyntaxErrorExpression(
                    `Duplicate variable: '${operation.variable}'`,
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
    } else {
      return zeroSequence([
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeReadCacheExpression(frame.dynamic, hash),
              makePrimitiveExpression(operation.variable, hash),
            ],
            hash,
          ),
          EMPTY,
          listPerformEffect(hash, frame.dynamic, {
            type: "perform",
            variable: operation.variable,
            right: makeIntrinsicExpression("undefined", hash),
          }),
          hash,
        ),
      ]);
    }
  } else if (
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    if (hasOwn(frame.static, operation.variable)) {
      const binding = frame.static[operation.variable];
      switch (operation.type) {
        case "write": {
          switch (binding.baseline) {
            case "dead": {
              return zeroSequence([
                makeConditionalEffect(
                  makeBinaryExpression(
                    "===",
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.get", hash),
                      makeIntrinsicExpression("undefined", hash),
                      [
                        makeReadCacheExpression(frame.dynamic, hash),
                        makePrimitiveExpression(operation.variable, hash),
                      ],
                      hash,
                    ),
                    makeIntrinsicExpression("aran.deadzone", hash),
                    hash,
                  ),
                  [
                    makeExpressionEffect(
                      makeThrowDeadzoneExpression(operation.variable, hash),
                      hash,
                    ),
                  ],
                  listPerformEffect(hash, frame.dynamic, {
                    type: binding.write,
                    variable: operation.variable,
                    right: operation.right,
                  }),
                  hash,
                ),
              ]);
            }
            case "live": {
              return zeroSequence(
                listPerformEffect(hash, frame.dynamic, {
                  type: binding.write,
                  variable: operation.variable,
                  right: operation.right,
                }),
              );
            }
            default: {
              throw new AranTypeError(binding.baseline);
            }
          }
        }
        case "initialize": {
          return zeroSequence(
            listPerformEffect(hash, frame.dynamic, {
              type: "perform",
              variable: operation.variable,
              right: operation.right,
            }),
          );
        }
        case "write-sloppy-function": {
          return zeroSequence(
            listPerformEffect(hash, frame.dynamic, {
              type: "perform",
              variable: operation.variable,
              right: makeRightExpression(operation, hash),
            }),
          );
        }
        default: {
          throw new AranTypeError(operation);
        }
      }
    } else {
      // Even for initialization, we have to test if the variable still exist in
      // the frame because it could have been deleted between its declaration and
      // its initialization:
      //
      // const f = () => {
      //   var x = 123;
      //   const g = () => {
      //     eval("delete x; var x = 456;");
      //   };
      //   g();
      //   return x;
      // };
      // console.log(f()); // 456!
      return incorporateEffect(
        bindSequence(
          duplicateOperation(
            hash,
            forkMeta((meta = nextMeta(meta))),
            operation,
          ),
          ([operation1, operation2]) =>
            liftSequenceX(
              concat_,
              liftSequence__X_(
                makeConditionalEffect,
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.has", hash),
                  makeIntrinsicExpression("undefined", hash),
                  [
                    makeReadCacheExpression(frame.dynamic, hash),
                    makePrimitiveExpression(operation.variable, hash),
                  ],
                  hash,
                ),
                listPerformEffect(hash, frame.dynamic, {
                  type: "perform",
                  variable: operation.variable,
                  right: makeRightExpression(operation1, hash),
                }),
                fromMaybe(
                  makeRightExpression(operation2, hash),
                  EMPTY_SEQUENCE,
                  (right) =>
                    listAlternateEffect(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      context,
                      {
                        type: "write",
                        mode: operation2.mode,
                        variable: operation2.variable,
                        right,
                      },
                    ),
                ),
                hash,
              ),
            ),
        ),
        hash,
      );
    }
  } else {
    return listAlternateEffect(hash, meta, context, operation);
  }
};
