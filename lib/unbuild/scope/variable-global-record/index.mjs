import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeApplyExpression,
  makeExpressionEffect,
} from "../../node.mjs";
import { cacheIntrinsic, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  reportDuplicate,
} from "../error.mjs";
import {
  guard,
  hasOwn,
  map,
  pairup,
  reduceEntry,
} from "../../../util/index.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import { AranTypeError } from "../../../error.mjs";
import { makeEarlyErrorPrelude } from "../../prelude.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  bindTwoSequence,
  flatSequence,
  initSequence,
  mapSequence,
  prependSequence,
} from "../../sequence.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence.js").ExpressionSequence}
 */
const makeBelongExpression = ({ path }, record, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeReadCacheExpression(record, path),
      makePrimitiveExpression(variable, path),
    ],
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
 *     | import("..").InitializeOperation
 *     | {
 *       type: "declare",
 *       mode: "strict" | "sloppy",
 *       variable: estree.Variable,
 *       writable: boolean,
 *     }
 *   ),
 * ) => import("../../sequence").ExpressionSequence}
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
    return makePrimitiveExpression(false, path);
  } else if (operation.type === "write") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        makePrimitiveExpression({ undefined: null }, path),
      ],
      path,
    );
  } else if (operation.type === "declare") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        makeDataDescriptorExpression(
          {
            value: makePrimitiveExpression({ undefined: null }, path),
            writable: operation.writable,
            enumerable: true,
            configurable: true,
          },
          path,
        ),
      ],
      path,
    );
  } else if (operation.type === "initialize") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        makeDataDescriptorExpression(
          {
            value:
              operation.right === null
                ? makePrimitiveExpression({ undefined: null }, path)
                : makeReadCacheExpression(operation.right, path),
            writable: null,
            enumerable: null,
            configurable: null,
          },
          path,
        ),
      ],
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence").ExpressionSequence}
 */
const makeAliveExpression = ({ path }, record, { mode, variable }) =>
  makeBinaryExpression(
    "===",
    makeLookupExpression({ path }, record, {
      type: "read",
      mode,
      variable,
    }),
    makeIntrinsicExpression("aran.deadzone", path),
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: import(".").GlobalRecordEntry,
 * ) => import("../../sequence").SetupSequence<[
 *   estree.Variable,
 *   import(".").GlobalRecordBinding,
 * ]>}
 */
export const setupGlobalRecordBinding = ({ path }, [variable, kind]) =>
  bindTwoSequence(
    makeBelongExpression({ path }, cacheIntrinsic("aran.record"), {
      variable,
    }),
    makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(variable, path),
        ],
        path,
      ),
      makeUnaryExpression(
        "!",
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.getOwnPropertyDescriptor", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeIntrinsicExpression("aran.global", path),
                makePrimitiveExpression(variable, path),
              ],
              path,
            ),
            makePrimitiveExpression("configurable", path),
          ],
          path,
        ),
        path,
      ),
      makePrimitiveExpression(false, path),
      path,
    ),
    (guard1, guard2) =>
      initSequence(
        [
          makeEarlyErrorPrelude({
            guard: guard1,
            message: reportDuplicate(variable),
            path,
          }),
          makeEarlyErrorPrelude({
            guard: guard2,
            message: reportDuplicate(variable),
            path,
          }),
        ],
        pairup(variable, { kind }),
      ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entries: import(".").GlobalRecordEntry[],
 * ) => import("../../sequence").SetupSequence<(
 *   import(".").GlobalRecordFrame
 * )>}
 */
export const setupGlobalRecordFrame = ({ path }, entries) =>
  mapSequence(
    flatSequence(
      map(entries, (entry) => setupGlobalRecordBinding({ path }, entry)),
    ),
    (entries) => ({
      type: "global-record",
      static: reduceEntry(entries),
      dynamic: cacheIntrinsic("aran.record"),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").GlobalRecordFrame,
 *   operation: import("..").VariableLoadOperation,
 *   alternate: import("../../sequence").ExpressionSequence,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeGlobalRecordLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) =>
  guard(
    !hasOwn(frame.static, operation.variable),
    (node) =>
      makeConditionalExpression(
        makeBelongExpression({ path }, frame.dynamic, operation),
        node,
        alternate,
        path,
      ),
    guard(
      operation.type !== "discard",
      (node) =>
        makeConditionalExpression(
          makeAliveExpression({ path }, frame.dynamic, operation),
          node,
          makeThrowDeadzoneExpression(operation.variable, path),
          path,
        ),
      makeLookupExpression({ path }, frame.dynamic, operation),
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").GlobalRecordFrame,
 *   options: import("..").VariableSaveOperation,
 *   alternate: import("../../sequence").EffectSequence,
 * ) => import("../../sequence").EffectSequence}
 */
export const listGlobalRecordSaveEffect = (
  { path },
  frame,
  operation,
  alternate,
) => {
  if (operation.type === "initialize") {
    if (hasOwn(frame.static, operation.variable)) {
      const binding = frame.static[operation.variable];
      if (binding.kind === operation.kind) {
        return makeExpressionEffect(
          makeLookupExpression({ path }, frame.dynamic, operation),
          path,
        );
      } else {
        return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
      }
    } else {
      return bindSequence(
        makeBelongExpression({ path }, frame.dynamic, operation),
        (guard) =>
          prependSequence(
            [
              makeEarlyErrorPrelude({
                guard,
                message: reportDuplicate(operation.variable),
                path,
              }),
            ],
            makeConditionalEffect(
              makeBelongExpression({ path }, frame.dynamic, operation),
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "SyntaxError",
                  reportDuplicate(operation.variable),
                  path,
                ),
                path,
              ),
              alternate,
              path,
            ),
          ),
      );
    }
  } else if (operation.type === "write") {
    if (hasOwn(frame.static, operation.variable)) {
      const binding = frame.static[operation.variable];
      if (binding.kind === "const") {
        return makeConditionalEffect(
          makeAliveExpression({ path }, frame.dynamic, operation),
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, path),
            path,
          ),
          makeExpressionEffect(
            makeThrowDeadzoneExpression(operation.variable, path),
            path,
          ),
          path,
        );
      } else if (binding.kind === "let") {
        return makeConditionalEffect(
          makeAliveExpression({ path }, frame.dynamic, operation),
          makeExpressionEffect(
            makeLookupExpression({ path }, frame.dynamic, operation),
            path,
          ),
          makeExpressionEffect(
            makeThrowDeadzoneExpression(operation.variable, path),
            path,
          ),
          path,
        );
      } else {
        throw new AranTypeError(binding.kind);
      }
    } else {
      return makeConditionalEffect(
        makeBelongExpression({ path }, frame.dynamic, operation),
        makeConditionalEffect(
          makeAliveExpression({ path }, frame.dynamic, operation),
          makeConditionalEffect(
            makeLookupExpression({ path }, frame.dynamic, operation),
            EMPTY_SEQUENCE,
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
              path,
            ),
            path,
          ),
          makeExpressionEffect(
            makeThrowDeadzoneExpression(operation.variable, path),
            path,
          ),
          path,
        ),
        alternate,
        path,
      );
    }
  } else {
    throw new AranTypeError(operation);
  }
};
