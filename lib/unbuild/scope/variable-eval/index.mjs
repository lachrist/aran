import { AranError, AranTypeError } from "../../../error.mjs";
import {
  EMPTY,
  concat_,
  hasOwn,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
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
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import { duplicateVariableOperation } from "../operation.mjs";
import { incorporateEffect } from "../../incorporate.mjs";

/**
 * @type {(
 *   binding: import("../../query/hoist-public").Binding,
 * ) => [import("../../../estree").Variable, null]}
 */
const toBindingEntry = (binding) => {
  if (binding.baseline === "live") {
    if (binding.write === "perform") {
      return [binding.variable, null];
    } else if (binding.write === "ignore" || binding.write === "report") {
      throw new AranError("only writable binding are allowed in eval frames", {
        binding,
      });
    } else {
      throw new AranTypeError(binding.write);
    }
  } else if (binding.baseline === "dead") {
    throw new AranError("only live binding are allowed in eval frames", {
      binding,
    });
  } else {
    throw new AranTypeError(binding.baseline);
  }
};

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
    (frame) => ({
      type: /** @type {"eval"} */ ("eval"),
      frame,
      record: reduceEntry(map(bindings, toBindingEntry)),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").DiscardOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
const makePerformExpression = ({ path }, frame, operation) => {
  switch (operation.type) {
    case "read": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(frame.frame, path),
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
            makeReadCacheExpression(frame.frame, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        path,
      );
    }
    case "write": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(frame.frame, path),
          makePrimitiveExpression(operation.variable, path),
          operation.right,
        ],
        path,
      );
    }
    case "discard": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(frame.frame, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      );
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: import("../operation").VariableLoadOperation,
 *   alternate: import("../../atom").Expression,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeEvalLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) => {
  if (hasOwn(frame.record, operation.variable)) {
    return zeroSequence(makePerformExpression({ path }, frame, operation));
  } else {
    return zeroSequence(
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.frame, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        makePerformExpression({ path }, frame, operation),
        alternate,
        path,
      ),
    );
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
 * ) => import("../operation").WriteOperation | null}
 */
const toWriteOperation = (operation, path) => {
  if (operation.type === "write") {
    return operation;
  } else if (operation.type === "initialize") {
    if (operation.right === null) {
      return null;
    } else {
      return {
        type: "write",
        mode: operation.mode,
        variable: operation.variable,
        right: operation.right,
      };
    }
  } else if (operation.type === "write-sloppy-function") {
    if (operation.right === null) {
      return null;
    } else {
      return {
        type: "write",
        mode: operation.mode,
        variable: operation.variable,
        right: makeReadExpression(operation.right, path),
      };
    }
  } else {
    throw new AranTypeError(operation);
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
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").EvalFrame,
 *   operation: import("../operation").VariableSaveOperation,
 *   makeAlternate: (
 *     operation: import("../operation").VariableSaveOperation,
 *   ) => import("../../../sequence").Sequence<
 *     import("../../prelude").BodyPrelude,
 *     import("../../atom").Effect[],
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listEvalSaveEffect = (
  { meta, path },
  frame,
  operation,
  makeAlternate,
) => {
  if (operation.type === "late-declare") {
    if (hasOwn(frame.record, operation.variable)) {
      return EMPTY_SEQUENCE;
    } else {
      return zeroSequence([
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeReadCacheExpression(frame.frame, path),
              makePrimitiveExpression(operation.variable, path),
            ],
            path,
          ),
          EMPTY,
          [
            makeExpressionEffect(
              makePerformExpression({ path }, frame, {
                type: "write",
                mode: operation.mode,
                variable: operation.variable,
                right: makeIntrinsicExpression("undefined", path),
              }),
              path,
            ),
          ],
          path,
        ),
      ]);
    }
  } else if (
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    if (hasOwn(frame.record, operation.variable)) {
      const right = makeRightExpression(operation, path);
      if (right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeExpressionEffect(
            makePerformExpression({ path }, frame, {
              type: "write",
              mode: operation.mode,
              variable: operation.variable,
              right,
            }),
            path,
          ),
        ]);
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
          duplicateVariableOperation({ meta, path }, operation),
          ([operation1, operation2]) => {
            const right = makeRightExpression(operation1, path);
            const next_operation = toWriteOperation(operation2, path);
            return liftSequenceX(
              concat_,
              liftSequence__X_(
                makeConditionalEffect,
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.has", path),
                  makeIntrinsicExpression("undefined", path),
                  [
                    makeReadCacheExpression(frame.frame, path),
                    makePrimitiveExpression(operation1.variable, path),
                  ],
                  path,
                ),
                right === null
                  ? EMPTY
                  : [
                      makeExpressionEffect(
                        makePerformExpression({ path }, frame, {
                          type: "write",
                          mode: operation1.mode,
                          variable: operation1.variable,
                          right,
                        }),
                        path,
                      ),
                    ],
                next_operation === null
                  ? EMPTY_SEQUENCE
                  : makeAlternate(next_operation),
                path,
              ),
            );
          },
        ),
        path,
      );
    }
  } else {
    throw new AranTypeError(operation);
  }
};
