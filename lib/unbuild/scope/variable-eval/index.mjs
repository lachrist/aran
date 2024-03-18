import { AranTypeError } from "../../../error.mjs";
import { EMPTY } from "../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { mapSequence, zeroSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 * ) => import("../../sequence").Sequence<
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
        makePrimitiveExpression({ undefined: null }, path),
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
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
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
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
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
          makePrimitiveExpression({ undefined: null }, path),
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
            makePrimitiveExpression({ undefined: null }, path),
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
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.deleteProperty", path),
          makePrimitiveExpression({ undefined: null }, path),
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
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: import("../operation").VariableSaveOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listEvalSaveEffect = ({ path }, frame, operation, alternate) => {
  if (operation.type === "declare") {
    return zeroSequence([
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makePrimitiveExpression({ undefined: null }, path),
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
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(frame.record, path),
                makePrimitiveExpression(operation.variable, path),
                makePrimitiveExpression({ undefined: null }, path),
              ],
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ]);
  } else if (operation.type === "initialize" || operation.type === "write") {
    return zeroSequence([
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        operation.right === null
          ? EMPTY
          : [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.set", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadCacheExpression(frame.record, path),
                    makePrimitiveExpression(operation.variable, path),
                    operation.right,
                  ],
                  path,
                ),
                path,
              ),
            ],
        alternate,
        path,
      ),
    ]);
  } else {
    throw new AranTypeError(operation);
  }
};
