import { AranTypeError } from "../../../error.mjs";
import {
  filter,
  hasOwn,
  listEntry,
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
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
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
 * ) => aran.Expression<unbuild.Atom>}
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
    throw new AranTypeError("invalid operation", operation);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     mode: "strict" | "sloppy",
 *     kind: import(".").ClosureKind,
 *     record: import("../../cache").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").ClosureBinding,
 * >}
 */
const setupEvalBinding = ({ path }, { mode, kind, record, variable }) =>
  initSequence(
    [
      makeExpressionEffect(
        makeLookupExpression({ path }, record, {
          type: "write",
          mode,
          variable,
          right: cachePrimitive({ undefined: null }),
        }),
        path,
      ),
    ],
    { kind },
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     record: Record<estree.Variable, import(".").ClosureKind>,
 *   },
 * ) => import("../../sequence").EffectSequence<import(".").EvalFrame>}
 */
export const setupEvalFrame = ({ path, meta }, { record }) =>
  bindSequence(
    cacheConstant(
      meta,
      makeObjectExpression(makePrimitiveExpression(null, path), [], path),
      path,
    ),
    (dynamic) =>
      mapSequence(
        flatSequence(
          map(listEntry(record), ([variable, kind]) =>
            mapSequence(
              setupEvalBinding(
                { path },
                {
                  mode: "sloppy",
                  kind,
                  record: dynamic,
                  variable,
                },
              ),
              (binding) => pairup(variable, binding),
            ),
          ),
        ),
        (entries) => ({
          type: "dynamic-eval",
          static: reduceEntry(entries),
          dynamic,
        }),
      ),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     mode: "strict" | "sloppy",
 *     kind: import(".").ClosureKind,
 *     record: import("../../cache").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence").EffectSequence<
 *   import(".").ClosureBinding,
 * >}
 */
const updateEvalBinding = ({ path }, { mode, kind, record, variable }) =>
  initSequence(
    [
      makeConditionalEffect(
        makeBelongExpression({ path }, record, { variable }),
        [],
        [
          makeExpressionEffect(
            makeLookupExpression({ path }, record, {
              type: "write",
              mode,
              variable,
              right: cachePrimitive({ undefined: null }),
            }),
            path,
          ),
        ],
        path,
      ),
    ],
    { kind },
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     record: Record<estree.Variable, import(".").ClosureKind>,
 *   },
 * ) => import("../../sequence").EffectSequence<import(".").EvalFrame>}
 */
export const updateEvalFrame = ({ path }, frame, { mode, record }) =>
  mapSequence(
    flatSequence(
      map(
        filter(
          listEntry(record),
          ([variable]) => !hasOwn(frame.static, variable),
        ),
        ([variable, kind]) =>
          mapSequence(
            updateEvalBinding(
              { path },
              {
                mode,
                kind,
                record: frame.dynamic,
                variable,
              },
            ),
            (binding) => pairup(variable, binding),
          ),
      ),
    ),
    (entries) => ({
      type: "dynamic-eval",
      static: {
        ...frame.static,
        ...reduceEntry(entries),
      },
      dynamic: frame.dynamic,
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
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEvalLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) => {
  if (hasOwn(frame.static, operation.variable)) {
    return makeLookupExpression({ path }, frame.dynamic, operation);
  } else {
    return makeConditionalExpression(
      makeBelongExpression({ path }, frame.dynamic, operation),
      makeLookupExpression({ path }, frame.dynamic, operation),
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
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEvalSaveEffect = ({ path }, frame, operation, alternate) => {
  if (operation.type === "write") {
    if (hasOwn(frame.static, operation.variable)) {
      return [
        makeExpressionEffect(
          makeLookupExpression({ path }, frame.dynamic, operation),
          path,
        ),
      ];
    } else {
      return [
        makeConditionalEffect(
          makeBelongExpression({ path }, frame.dynamic, operation),
          [
            makeExpressionEffect(
              makeLookupExpression({ path }, frame.dynamic, operation),
              path,
            ),
          ],
          alternate,
          path,
        ),
      ];
    }
  } else if (operation.type === "initialize") {
    if (hasOwn(frame.static, operation.variable)) {
      if (operation.right === null) {
        return [];
      } else {
        return [
          makeExpressionEffect(
            makeLookupExpression({ path }, frame.dynamic, {
              type: "write",
              mode: operation.mode,
              variable: operation.variable,
              right: operation.right,
            }),
            path,
          ),
        ];
      }
    } else {
      return alternate;
    }
  } else {
    return alternate;
  }
};
