import { AranTypeError } from "../../../error.mjs";
import { hasOwn, map, pairup, reduceEntry } from "../../../util/index.mjs";
import { cacheIntrinsic, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeEarlyErrorPrelude, makeEffectPrelude } from "../../prelude.mjs";
import { flatSequence, initSequence, mapSequence } from "../../sequence.mjs";
import { makeThrowConstantExpression, reportDuplicate } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   operation: {
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
 *     | {
 *       type: "declare",
 *       mode: "strict" | "sloppy",
 *       variable: estree.Variable,
 *     }
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
            writable: true,
            enumerable: true,
            configurable: false,
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   entry: [
 *     estree.Variable,
 *     import(".").GlobalObjectKind,
 *   ],
 * ) => import("../../sequence").PreludeSequence<[
 *   estree.Variable,
 *   import(".").GlobalObjectBinding,
 * ]>}
 */
const setupGlobalObjectBinding = ({ path }, [variable, kind]) =>
  initSequence(
    [
      makeEarlyErrorPrelude({
        guard: makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeIntrinsicExpression("aran.record", path),
            makePrimitiveExpression(variable, path),
          ],
          path,
        ),
        message: reportDuplicate(variable),
        path,
      }),
      makeEffectPrelude(
        makeConditionalEffect(
          makeBelongExpression({ path }, cacheIntrinsic("aran.global"), {
            variable,
          }),
          [],
          [
            makeExpressionEffect(
              makeLookupExpression({ path }, cacheIntrinsic("aran.global"), {
                type: "declare",
                mode: "strict",
                variable,
              }),
              path,
            ),
          ],
          path,
        ),
      ),
    ],
    pairup(variable, { kind }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entries: [
 *     estree.Variable,
 *     import(".").GlobalObjectKind,
 *   ][],
 * ) => import("../../sequence").PreludeSequence<
 *   import(".").GlobalObjectFrame,
 * >}
 */
export const setupGlobalObjectFrame = ({ path }, entries) =>
  mapSequence(
    flatSequence(
      map(entries, (entry) => setupGlobalObjectBinding({ path }, entry)),
    ),
    (entries) => ({
      type: "global-object",
      static: reduceEntry(entries),
      dynamic: cacheIntrinsic("aran.global"),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").GlobalObjectFrame,
 *   entries: [estree.Variable, import(".").GlobalObjectKind][],
 * ) => import("../../sequence.js").PreludeSequence<
 *   import(".").GlobalObjectFrame,
 * >}
 */
export const updateGlobalObjectFrame = ({ path }, frame1, entries) =>
  mapSequence(setupGlobalObjectFrame({ path }, entries), (frame2) => ({
    type: "global-object",
    dynamic: frame1.dynamic,
    static: {
      ...frame1.static,
      ...frame2.static,
    },
  }));

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").GlobalObjectFrame,
 *   operation: import("..").VariableLoadOperation,
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalObjectLoadExpression = (
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
 *   node: aran.Expression<unbuild.Atom>,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const wrapEffect = ({ path }, node, { mode, variable }) => {
  if (mode === "strict") {
    return [
      makeConditionalEffect(
        node,
        [],
        [
          makeExpressionEffect(
            makeThrowConstantExpression(variable, path),
            path,
          ),
        ],
        path,
      ),
    ];
  } else if (mode === "sloppy") {
    return [makeExpressionEffect(node, path)];
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").GlobalObjectFrame,
 *   operation: import("..").VariableSaveOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectSaveEffect = (
  { path },
  frame,
  operation,
  alternate,
) => {
  if (operation.type === "initialize") {
    if (hasOwn(frame.static, operation.variable)) {
      if (operation.right === null) {
        return [];
      } else {
        return wrapEffect(
          { path },
          makeLookupExpression({ path }, frame.dynamic, {
            type: "write",
            mode: operation.mode,
            variable: operation.variable,
            right: operation.right,
          }),
          operation,
        );
      }
    } else {
      return alternate;
    }
  } else if (operation.type === "write") {
    if (hasOwn(frame.static, operation.variable)) {
      return wrapEffect(
        { path },
        makeLookupExpression({ path }, frame.dynamic, {
          type: "write",
          mode: operation.mode,
          variable: operation.variable,
          right: operation.right,
        }),
        operation,
      );
    } else {
      return [
        makeConditionalEffect(
          makeBelongExpression({ path }, frame.dynamic, operation),
          wrapEffect(
            { path },
            makeLookupExpression({ path }, frame.dynamic, {
              type: "write",
              mode: operation.mode,
              variable: operation.variable,
              right: operation.right,
            }),
            operation,
          ),
          alternate,
          path,
        ),
      ];
    }
  } else {
    throw new AranTypeError(operation);
  }
};
