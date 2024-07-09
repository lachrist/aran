import { AranTypeError } from "../../../error.mjs";
import { EMPTY, concat_ } from "../../../util/index.mjs";
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
 *   site: import("../../site").LeafSite,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = ({ path, meta }) =>
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
    (record) => ({
      type: /** @type {"eval"} */ ("eval"),
      record,
    }),
  );

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
  if (operation.type === "read") {
    return zeroSequence(
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        alternate,
        path,
      ),
    );
  } else if (operation.type === "typeof") {
    return zeroSequence(
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        makeUnaryExpression(
          "typeof",
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeReadCacheExpression(frame.record, path),
              makePrimitiveExpression(operation.variable, path),
            ],
            path,
          ),
          path,
        ),
        alternate,
        path,
      ),
    );
  } else if (operation.type === "discard") {
    return zeroSequence(
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.deleteProperty", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        alternate,
        path,
      ),
    );
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
 * ) => import("../operation").WriteOperation | null}
 */
const toWriteOperation = (operation, path) => {
  if (operation.type === "write") {
    return operation;
  } else if (operation.type === "initialize") {
    const { mode, variable, right } = operation;
    if (right === null) {
      return null;
    } else {
      return {
        type: "write",
        mode,
        variable,
        right,
      };
    }
  } else if (operation.type === "write-sloppy-function") {
    const { mode, variable, right } = operation;
    if (right === null) {
      return null;
    } else {
      return {
        type: "write",
        mode,
        variable,
        right: makeReadExpression(right, path),
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
    return zeroSequence([
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        EMPTY,
        [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeReadCacheExpression(frame.record, path),
                makePrimitiveExpression(operation.variable, path),
                makeIntrinsicExpression("undefined", path),
              ],
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ]);
  } else if (
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
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
                  makeReadCacheExpression(frame.record, path),
                  makePrimitiveExpression(operation1.variable, path),
                ],
                path,
              ),
              right === null
                ? EMPTY
                : [
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.set", path),
                        makeIntrinsicExpression("undefined", path),
                        [
                          makeReadCacheExpression(frame.record, path),
                          makePrimitiveExpression(operation1.variable, path),
                          right,
                        ],
                        path,
                      ),
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
  } else {
    throw new AranTypeError(operation);
  }
};
