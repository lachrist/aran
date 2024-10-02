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
import {
  bindSequence,
  liftSequenceX,
  liftSequenceX_X_,
  mapSequence,
} from "../../../sequence.mjs";
import { AranTypeError } from "../../../report.mjs";
import { makeThrowConstantExpression } from "../error.mjs";
import {
  incorporateEffect,
  incorporateExpression,
} from "../../prelude/index.mjs";
import { concat_, EMPTY } from "../../../util/index.mjs";
import { duplicateOperation } from "../operation.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   record: import("../../cache").Cache,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
const makeBelongExpression = (hash, meta, record, variable) =>
  mapSequence(
    incorporateExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeReadCacheExpression(record, hash),
              makeIntrinsicExpression("Symbol.unscopables", hash),
            ],
            hash,
          ),
          hash,
        ),
        (unscopables) =>
          makeConditionalExpression(
            makeReadCacheExpression(unscopables, hash),
            makeUnaryExpression(
              "!",
              makeGetExpression(
                makeReadCacheExpression(unscopables, hash),
                makePrimitiveExpression(variable, hash),
                hash,
              ),
              hash,
            ),
            makePrimitiveExpression(true, hash),
            hash,
          ),
      ),
      hash,
    ),
    (consequent) =>
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeReadCacheExpression(record, hash),
            makePrimitiveExpression(variable, hash),
          ],
          hash,
        ),
        consequent,
        makePrimitiveExpression(false, hash),
        hash,
      ),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   record: import("../../cache").Cache,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").InitializeOperation
 *     | import("../operation").ReadAmbientThisOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeLookupExpression = (hash, record, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeReadCacheExpression(record, hash),
        makePrimitiveExpression(operation.variable, hash),
      ],
      hash,
    );
  } else if (operation.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeReadCacheExpression(record, hash),
          makePrimitiveExpression(operation.variable, hash),
        ],
        hash,
      ),
      hash,
    );
  } else if (operation.type === "discard") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.deleteProperty", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeReadCacheExpression(record, hash),
        makePrimitiveExpression(operation.variable, hash),
      ],
      hash,
    );
  } else if (operation.type === "write") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeReadCacheExpression(record, hash),
        makePrimitiveExpression(operation.variable, hash),
        operation.right,
      ],
      hash,
    );
  } else if (operation.type === "initialize") {
    if (operation.right === null) {
      return makePrimitiveExpression(true, hash);
    } else {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeReadCacheExpression(record, hash),
          makePrimitiveExpression(operation.variable, hash),
          operation.right,
        ],
        hash,
      );
    }
  } else if (operation.type === "read-ambient-this") {
    return makeReadCacheExpression(record, hash);
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").WithFrame
 * >}
 */
export const makeWithLoadExpression = (
  hash,
  meta,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard" ||
    operation.type === "read-ambient-this"
  ) {
    return incorporateExpression(
      bindSequence(
        duplicateOperation(hash, forkMeta((meta = nextMeta(meta))), operation),
        ([operation1, operation2]) =>
          liftSequenceX_X_(
            makeConditionalExpression,
            makeBelongExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              frame.record,
              operation.variable,
            ),
            makeLookupExpression(hash, frame.record, operation1),
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
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").WithFrame
 * >}
 */
export const listWithSaveEffect = (
  hash,
  meta,
  frame,
  operation,
  listAlternateEffect,
  context,
) => {
  if (operation.type === "write" || operation.type === "initialize") {
    return incorporateEffect(
      bindSequence(
        duplicateOperation(hash, forkMeta((meta = nextMeta(meta))), operation),
        ([operation1, operation2]) => {
          switch (operation.mode) {
            case "sloppy": {
              return liftSequenceX(
                concat_,
                liftSequenceX_X_(
                  makeConditionalEffect,
                  makeBelongExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    frame.record,
                    operation.variable,
                  ),
                  operation.right === null
                    ? EMPTY
                    : [
                        makeExpressionEffect(
                          makeLookupExpression(hash, frame.record, operation1),
                          hash,
                        ),
                      ],
                  listAlternateEffect(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    context,
                    operation2,
                  ),
                  hash,
                ),
              );
            }
            case "strict": {
              return liftSequenceX(
                concat_,
                liftSequenceX_X_(
                  makeConditionalEffect,
                  makeBelongExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    frame.record,
                    operation.variable,
                  ),
                  operation.right === null
                    ? EMPTY
                    : [
                        makeConditionalEffect(
                          makeLookupExpression(hash, frame.record, operation1),
                          EMPTY,
                          [
                            makeExpressionEffect(
                              makeThrowConstantExpression(
                                operation.variable,
                                hash,
                              ),
                              hash,
                            ),
                          ],
                          hash,
                        ),
                      ],
                  listAlternateEffect(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    context,
                    operation2,
                  ),
                  hash,
                ),
              );
            }
            default: {
              throw new AranTypeError(operation);
            }
          }
        },
      ),
      hash,
    );
  } else {
    return listAlternateEffect(hash, meta, context, operation);
  }
};
