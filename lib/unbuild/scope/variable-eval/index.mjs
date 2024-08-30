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
  initErrorExpression,
} from "../../prelude/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   binding: import("../../query/hoist-public").Binding,
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").Binding,
 * ]}
 */
const toBindingEntry = ({ variable, baseline, write }) => [
  variable,
  { baseline, write },
];

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = ({ path, meta }, bindings) =>
  mapSequence(
    cacheConstant(
      meta,
      makeApplyExpression(
        makeIntrinsicExpression("Object.create", path),
        makeIntrinsicExpression("undefined", path),
        [makePrimitiveExpression(null, path)],
        path,
      ),
      path,
    ),
    (dynamic) => ({
      type: /** @type {"eval"} */ ("eval"),
      dynamic,
      static: reduceEntry(map(bindings, toBindingEntry)),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import("../../cache").Cache,
 *   operation: {
 *     type: "read" | "typeof" | "discard" | "read-ambient-this",
 *     variable: import("../../../estree").Variable,
 *   },
 * ) => import("../../atom").Expression}
 */
const makePerformExpression = ({ path }, frame, operation) => {
  switch (operation.type) {
    case "read": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        path,
      );
    }
    case "discard": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      );
    }
    case "read-ambient-this": {
      return makeIntrinsicExpression("undefined", path);
    }
    default: {
      throw new AranTypeError(operation.type);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import("../../cache").Cache,
 *   operation: {
 *     type: "perform" | "ignore" | "report",
 *     variable: import("../../../estree").Variable,
 *     right: null | import("../../atom").Expression,
 *   },
 * ) => import("../../atom").Effect[]}
 */
const listPerformEffect = ({ path }, frame, operation) => {
  switch (operation.type) {
    case "perform": {
      if (operation.right === null) {
        return EMPTY;
      } else {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeReadCacheExpression(frame, path),
                makePrimitiveExpression(operation.variable, path),
                operation.right,
              ],
              path,
            ),
            path,
          ),
        ];
      }
    }
    case "ignore": {
      if (operation.right === null) {
        return EMPTY;
      } else {
        return [makeExpressionEffect(operation.right, path)];
      }
    }
    case "report": {
      return concatX_(
        operation.right === null
          ? EMPTY
          : [makeExpressionEffect(operation.right, path)],
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
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
  site,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (isVariableLoadOperation(operation)) {
    let { path, meta } = site;
    if (hasOwn(frame.static, operation.variable)) {
      if (operation.type === "discard") {
        return zeroSequence(makePrimitiveExpression(false, path));
      } else if (operation.type === "read" || operation.type === "typeof") {
        const binding = frame.static[operation.variable];
        switch (binding.baseline) {
          case "live": {
            return zeroSequence(
              makePerformExpression({ path }, frame.dynamic, operation),
            );
          }
          case "dead": {
            return zeroSequence(
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.get", path),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeReadCacheExpression(frame.dynamic, path),
                      makePrimitiveExpression(operation.variable, path),
                    ],
                    path,
                  ),
                  makeIntrinsicExpression("aran.deadzone", path),
                  path,
                ),
                makeThrowDeadzoneExpression(operation.variable, path),
                makePerformExpression({ path }, frame.dynamic, operation),
                path,
              ),
            );
          }
          default: {
            throw new AranTypeError(binding.baseline);
          }
        }
      } else if (operation.type === "read-ambient-this") {
        return zeroSequence(
          makePerformExpression({ path }, frame.dynamic, operation),
        );
      } else {
        throw new AranTypeError(operation);
      }
    } else {
      return incorporateExpression(
        bindSequence(
          duplicateOperation(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            operation,
          ),
          ([operation1, operation2]) =>
            liftSequence__X_(
              makeConditionalExpression,
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.has", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeReadCacheExpression(frame.dynamic, path),
                  makePrimitiveExpression(operation.variable, path),
                ],
                path,
              ),
              makePerformExpression({ path }, frame.dynamic, operation1),
              makeAlternateExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                context,
                operation2,
              ),
              path,
            ),
        ),
        path,
      );
    }
  } else {
    return makeAlternateExpression(site, context, operation);
  }
};

/**
 * @type {(
 *   operation: (
 *     | import("../operation").InitializeOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").WriteSloppyFunctionOperation
 *   ),
 *   path: import("../../../path").Path,
 * ) => null | import("../../atom").Expression}
 */
export const makeRightExpression = (operation, path) => {
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
        return makeReadExpression(operation.right, path);
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
  site,
  frame,
  operation,
  listAlternateEffect,
  context,
) => {
  if (operation.type === "late-declare") {
    const { path } = site;
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
                  initErrorExpression(
                    `Duplicate variable: '${operation.variable}'`,
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
    } else {
      return zeroSequence([
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeReadCacheExpression(frame.dynamic, path),
              makePrimitiveExpression(operation.variable, path),
            ],
            path,
          ),
          EMPTY,
          listPerformEffect({ path }, frame.dynamic, {
            type: "perform",
            variable: operation.variable,
            right: makeIntrinsicExpression("undefined", path),
          }),
          path,
        ),
      ]);
    }
  } else if (
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    let { path, meta } = site;
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
                      makeIntrinsicExpression("Reflect.get", path),
                      makeIntrinsicExpression("undefined", path),
                      [
                        makeReadCacheExpression(frame.dynamic, path),
                        makePrimitiveExpression(operation.variable, path),
                      ],
                      path,
                    ),
                    makeIntrinsicExpression("aran.deadzone", path),
                    path,
                  ),
                  [
                    makeExpressionEffect(
                      makeThrowDeadzoneExpression(operation.variable, path),
                      path,
                    ),
                  ],
                  listPerformEffect({ path }, frame.dynamic, {
                    type: binding.write,
                    variable: operation.variable,
                    right: operation.right,
                  }),
                  path,
                ),
              ]);
            }
            case "live": {
              return zeroSequence(
                listPerformEffect({ path }, frame.dynamic, {
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
            listPerformEffect({ path }, frame.dynamic, {
              type: "perform",
              variable: operation.variable,
              right: operation.right,
            }),
          );
        }
        case "write-sloppy-function": {
          return zeroSequence(
            listPerformEffect({ path }, frame.dynamic, {
              type: "perform",
              variable: operation.variable,
              right: makeRightExpression(operation, path),
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
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            operation,
          ),
          ([operation1, operation2]) =>
            liftSequenceX(
              concat_,
              liftSequence__X_(
                makeConditionalEffect,
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.has", path),
                  makeIntrinsicExpression("undefined", path),
                  [
                    makeReadCacheExpression(frame.dynamic, path),
                    makePrimitiveExpression(operation.variable, path),
                  ],
                  path,
                ),
                listPerformEffect({ path }, frame.dynamic, {
                  type: "perform",
                  variable: operation.variable,
                  right: makeRightExpression(operation1, path),
                }),
                fromMaybe(
                  makeRightExpression(operation2, path),
                  EMPTY_SEQUENCE,
                  (right) =>
                    listAlternateEffect(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      context,
                      {
                        type: "write",
                        mode: operation2.mode,
                        variable: operation2.variable,
                        right,
                      },
                    ),
                ),
                path,
              ),
            ),
        ),
        path,
      );
    }
  } else {
    return listAlternateEffect(site, context, operation);
  }
};
