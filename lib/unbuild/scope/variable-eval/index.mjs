import { AranTypeError } from "../../../error.mjs";
import {
  filter,
  hasOwn,
  map,
  pairup,
  reduceEntry,
} from "../../../util/index.mjs";
import {
  cacheConstant,
  cachePrimitive,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeObjectExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeEffectPrelude } from "../../prelude.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
} from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence").ExpressionSequence}
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
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   entry: import(".").EvalEntry,
 *   options: {
 *     record: import("../../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").EvalBinding,
 *   ],
 * >}
 */
const setupEvalBinding = ({ path }, [variable, kind], { record }) =>
  bindSequence(
    makeExpressionEffect(
      makeLookupExpression({ path }, record, {
        type: "write",
        mode: "sloppy",
        variable,
        right: cachePrimitive({ undefined: null }),
      }),
      path,
    ),
    (setup) =>
      initSequence(map(setup, makeEffectPrelude), [variable, { kind }]),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   entries: import(".").EvalEntry[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = ({ path, meta }, entries) =>
  bindSequence(
    cacheConstant(
      meta,
      makeObjectExpression(makePrimitiveExpression(null, path), [], path),
      path,
    ),
    (dynamic) =>
      mapSequence(
        flatSequence(
          map(entries, (entry) =>
            setupEvalBinding({ path }, entry, { record: dynamic }),
          ),
        ),
        (entries) => ({
          type: /** @type {"eval"} */ ("eval"),
          record: {
            static: reduceEntry(entries),
            dynamic,
          },
        }),
      ),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   entry: import(".").EvalEntry,
 *   options: {
 *     record: import("../../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").EvalBinding,
 *   ],
 * >}
 */
const updateEvalBinding = ({ path }, [variable, kind], { record }) =>
  bindSequence(
    makeConditionalEffect(
      makeBelongExpression({ path }, record, { variable }),
      EMPTY_EFFECT,
      makeExpressionEffect(
        makeLookupExpression({ path }, record, {
          type: "write",
          mode: "sloppy",
          variable,
          right: cachePrimitive({ undefined: null }),
        }),
        path,
      ),
      path,
    ),
    (setup) =>
      initSequence(map(setup, makeEffectPrelude), pairup(variable, { kind })),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   entries: [estree.Variable, import(".").EvalKind][],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").EvalFrame,
 * >}
 */
export const updateEvalFrame = ({ path }, frame, entries) =>
  mapSequence(
    flatSequence(
      map(
        filter(entries, (entry) => !hasOwn(frame.record.static, entry[0])),
        (entry) =>
          updateEvalBinding({ path }, entry, {
            record: frame.record.dynamic,
          }),
      ),
    ),
    (entries) => ({
      type: /** @type {"eval"} */ ("eval"),
      record: {
        static: {
          ...frame.record.static,
          ...reduceEntry(entries),
        },
        dynamic: frame.record.dynamic,
      },
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 *   alternate: import("../../sequence").ExpressionSequence,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeEvalLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) => {
  if (hasOwn(frame.record.static, operation.variable)) {
    return makeLookupExpression({ path }, frame.record.dynamic, operation);
  } else {
    return makeConditionalExpression(
      makeBelongExpression({ path }, frame.record.dynamic, operation),
      makeLookupExpression({ path }, frame.record.dynamic, operation),
      alternate,
      path,
    );
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: (
 *     | import("..").InitializeOperation
 *     | import("..").WriteOperation
 *   ),
 *   alternate: import("../../sequence").EffectSequence,
 * ) => import("../../sequence").EffectSequence}
 */
export const listEvalSaveEffect = ({ path }, frame, operation, alternate) => {
  if (operation.type === "write") {
    if (hasOwn(frame.record.static, operation.variable)) {
      return makeExpressionEffect(
        makeLookupExpression({ path }, frame.record.dynamic, operation),
        path,
      );
    } else {
      return makeConditionalEffect(
        makeBelongExpression({ path }, frame.record.dynamic, operation),
        makeExpressionEffect(
          makeLookupExpression({ path }, frame.record.dynamic, operation),
          path,
        ),
        alternate,
        path,
      );
    }
  } else if (operation.type === "initialize") {
    if (hasOwn(frame.record.static, operation.variable)) {
      if (operation.right === null) {
        return EMPTY_EFFECT;
      } else {
        return makeExpressionEffect(
          makeLookupExpression({ path }, frame.record.dynamic, {
            type: "write",
            mode: operation.mode,
            variable: operation.variable,
            right: operation.right,
          }),
          path,
        );
      }
    } else {
      return alternate;
    }
  } else {
    return alternate;
  }
};