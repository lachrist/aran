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
import { mapSequence, sequenceExpression } from "../../sequence.mjs";
import { AranTypeError } from "../../../error.mjs";
import { makeThrowConstantExpression } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   record: import("../../cache").Cache,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBelongExpression = ({ path, meta }, record, { variable }) =>
  makeConditionalExpression(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.has", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(variable, path),
      ],
      path,
    ),
    sequenceExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makePrimitiveExpression({ undefined: null }, path),
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
    makePrimitiveExpression(false, path),
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *     | import("..").WriteOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeLookupExpression = ({ path }, record, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
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
        makePrimitiveExpression({ undefined: null }, path),
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
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "write") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        makeReadCacheExpression(operation.right, path),
      ],
      path,
    );
  } else {
    throw new AranTypeError("invalid operation", operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithLoadExpression = (
  { path, meta },
  frame,
  operation,
  alternate,
) =>
  makeConditionalExpression(
    makeBelongExpression({ meta, path }, frame.record, operation),
    makeLookupExpression({ path }, frame.record, operation),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   frame: import(".").WithFrame,
 *   operation: import("..").WriteOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWithSaveEffect = (
  { meta, path },
  frame,
  operation,
  alternate,
) => {
  if (operation.mode === "sloppy") {
    return [
      makeConditionalEffect(
        makeBelongExpression({ meta, path }, frame.record, operation),
        [
          makeExpressionEffect(
            makeLookupExpression({ path }, frame.record, operation),
            path,
          ),
        ],
        alternate,
        path,
      ),
    ];
  } else if (operation.mode === "strict") {
    return [
      makeConditionalEffect(
        makeBelongExpression({ meta, path }, frame.record, operation),
        [
          makeConditionalEffect(
            makeLookupExpression({ path }, frame.record, operation),
            [],
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
    ];
  } else {
    throw new AranTypeError("invalid operation.mode", operation.mode);
  }
};
