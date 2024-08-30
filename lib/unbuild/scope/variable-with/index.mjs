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
    incorporateExpression(
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
 *     | import("../operation").ReadAmbientThisOperation
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
  } else if (operation.type === "read-ambient-this") {
    return makeReadCacheExpression(record, path);
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
  site,
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
    let { path, meta } = site;
    return incorporateExpression(
      bindSequence(
        duplicateOperation(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          operation,
        ),
        ([operation1, operation2]) =>
          liftSequenceX_X_(
            makeConditionalExpression,
            makeBelongExpression({ meta, path }, frame.record, {
              variable: operation.variable,
            }),
            makeLookupExpression({ path }, frame.record, operation1),
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
  } else {
    return makeAlternateExpression(site, context, operation);
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").WithFrame
 * >}
 */
export const listWithSaveEffect = (
  site,
  frame,
  operation,
  listAlternateEffect,
  context,
) => {
  if (operation.type === "write" || operation.type === "initialize") {
    let { path, meta } = site;
    return incorporateEffect(
      bindSequence(
        duplicateOperation(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          operation,
        ),
        ([operation1, operation2]) => {
          switch (operation.mode) {
            case "sloppy": {
              return liftSequenceX(
                concat_,
                liftSequenceX_X_(
                  makeConditionalEffect,
                  makeBelongExpression(
                    { meta: forkMeta((meta = nextMeta(meta))), path },
                    frame.record,
                    {
                      variable: operation.variable,
                    },
                  ),
                  operation.right === null
                    ? EMPTY
                    : [
                        makeExpressionEffect(
                          makeLookupExpression(
                            { path },
                            frame.record,
                            operation1,
                          ),
                          path,
                        ),
                      ],
                  listAlternateEffect(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    context,
                    operation2,
                  ),
                  path,
                ),
              );
            }
            case "strict": {
              return liftSequenceX(
                concat_,
                liftSequenceX_X_(
                  makeConditionalEffect,
                  makeBelongExpression(
                    { meta: forkMeta((meta = nextMeta(meta))), path },
                    frame.record,
                    {
                      variable: operation.variable,
                    },
                  ),
                  operation.right === null
                    ? EMPTY
                    : [
                        makeConditionalEffect(
                          makeLookupExpression(
                            { path },
                            frame.record,
                            operation1,
                          ),
                          EMPTY,
                          [
                            makeExpressionEffect(
                              makeThrowConstantExpression(
                                operation.variable,
                                path,
                              ),
                              path,
                            ),
                          ],
                          path,
                        ),
                      ],
                  listAlternateEffect(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    context,
                    operation2,
                  ),
                  path,
                ),
              );
            }
            default: {
              throw new AranTypeError(operation);
            }
          }
        },
      ),
      path,
    );
  } else {
    return listAlternateEffect(site, context, operation);
  }
};
