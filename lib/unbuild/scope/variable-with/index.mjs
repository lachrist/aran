import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeApplyExpression,
  makeExpressionEffect,
} from "../../node.mjs";

import { makeGetExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { mapSequence, zeroSequence } from "../../../sequence.mjs";
import { AranTypeError } from "../../../error.mjs";
import { makeThrowConstantExpression } from "../error.mjs";
import { incorporatePrefixExpression } from "../../prefix.mjs";
import { EMPTY } from "../../../util/index.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   record: import("../../cache").Cache,
 *   options: {
 *     variable: import("../../../estree").Variable,
 *   },
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
const makeBelongExpression = ({ path, meta }, record, { variable }) =>
  mapSequence(
    incorporatePrefixExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeReadCacheExpression(record, path),
              makeIntrinsicExpression("Symbol.unscopables", path),
            ],
            path,
          ),
          path,
        ),
        (unscopables) =>
          makeConditionalExpression(
            makeReadCacheExpression(unscopables, path),
            makeUnaryExpression(
              "!",
              makeGetExpression(
                makeReadCacheExpression(unscopables, path),
                makePrimitiveExpression(variable, path),
                path,
              ),
              path,
            ),
            makePrimitiveExpression(true, path),
            path,
          ),
      ),
      path,
    ),
    (consequent) =>
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(record, path),
            makePrimitiveExpression(variable, path),
          ],
          path,
        ),
        consequent,
        makePrimitiveExpression(false, path),
        path,
      ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").InitializeOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeLookupExpression = ({ path }, record, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      path,
    );
  } else if (operation.type === "discard") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.deleteProperty", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "write") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        operation.right,
      ],
      path,
    );
  } else if (operation.type === "initialize") {
    if (operation.right === null) {
      return makePrimitiveExpression(true, path);
    } else {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
          operation.right,
        ],
        path,
      );
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: import("../operation").VariableLoadOperation,
 *   alternate: import("../../atom").Expression,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeWithLoadExpression = (
  { path, meta },
  frame,
  operation,
  alternate,
) =>
  mapSequence(
    makeBelongExpression({ meta, path }, frame.record, {
      variable: operation.variable,
    }),
    (test) =>
      makeConditionalExpression(
        test,
        makeLookupExpression({ path }, frame.record, operation),
        alternate,
        path,
      ),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: import("../operation").VariableSaveOperation,
 *   alternate: import("../../atom").Effect[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listWithSaveEffect = (
  { meta, path },
  frame,
  operation,
  alternate,
) => {
  if (operation.type === "write" || operation.type === "initialize") {
    if (operation.mode === "sloppy") {
      return mapSequence(
        makeBelongExpression({ meta, path }, frame.record, {
          variable: operation.variable,
        }),
        (test) => [
          makeConditionalEffect(
            test,
            operation.right === null
              ? EMPTY
              : [
                  makeExpressionEffect(
                    makeLookupExpression({ path }, frame.record, operation),
                    path,
                  ),
                ],
            alternate,
            path,
          ),
        ],
      );
    } else if (operation.mode === "strict") {
      return mapSequence(
        makeBelongExpression({ meta, path }, frame.record, {
          variable: operation.variable,
        }),
        (test) => [
          makeConditionalEffect(
            test,
            operation.right === null
              ? EMPTY
              : [
                  makeConditionalEffect(
                    makeLookupExpression({ path }, frame.record, operation),
                    EMPTY,
                    [
                      makeExpressionEffect(
                        makeThrowConstantExpression(operation.variable, path),
                        path,
                      ),
                    ],
                    path,
                  ),
                ],
            alternate,
            path,
          ),
        ],
      );
    } else {
      throw new AranTypeError(operation.mode);
    }
  } else if (operation.type === "late-declare") {
    return zeroSequence(alternate);
  } else {
    throw new AranTypeError(operation);
  }
};
