import { AranTypeError } from "../../../../error.mjs";
import { map } from "../../../../util/index.mjs";
import { cacheIntrinsic, cachePrimitive } from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
} from "../../../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeEffectStatement,
} from "../../../node.mjs";
import { initSequence } from "../../../sequence.mjs";
import { listSaveEffect, makeLoadExpression } from "../../access.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: import("../../../cache.js").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeLiveExpression = ({ path }, context, { record, variable }) =>
  makeBinaryExpression(
    "===",
    makeLoadExpression({ path }, context, {
      operation: "read",
      record,
      variable,
    }),
    makeIntrinsicExpression("aran.deadzone", path),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listClashEffect = ({ path }, _context, { variable }) => [
  makeConditionalEffect(
    makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Object.hasOwn", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.record", path),
          makePrimitiveExpression(variable, path),
        ],
        path,
      ),
      makePrimitiveExpression(false, path),
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Object.hasOwn", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeIntrinsicExpression("aran.global", path),
            makePrimitiveExpression(variable, path),
          ],
          path,
        ),
        makeGetExpression(
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
          path,
        ),
        makePrimitiveExpression(true, path),
        path,
      ),
      path,
    ),
    [],
    [makeExpressionEffect(makeThrowDuplicateExpression(variable, path), path)],
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     kind: import("./index.js").GlobalRecordKind,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listDeclareEffect = ({ path }, _context, { variable, kind }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeIntrinsicExpression("aran.global", path),
        makePrimitiveExpression(variable, path),
        makeDataDescriptorExpression(
          {
            value: makeIntrinsicExpression("aran.deadzone", path),
            writable: kind !== "const",
            enumerable: true,
            configurable: true,
          },
          path,
        ),
      ],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     kind: import("./index.js").GlobalRecordKind,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import("./index.js").GlobalRecordBinding,
 * >}
 */
export const bindGlobalRecord = ({ path }, context, { kind, variable }) =>
  initSequence(
    [
      ...map(listClashEffect({ path }, context, { variable }), (node) => ({
        type: /** @type {"head"} */ ("head"),
        data: makeEffectStatement(node, path),
      })),
      ...map(
        listDeclareEffect({ path }, context, { variable, kind }),
        (node) => ({
          type: /** @type {"body"} */ ("body"),
          data: makeEffectStatement(node, path),
        }),
      ),
    ],
    { kind },
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     variable: estree.Variable,
 *     binding: import("./index.js").GlobalRecordBinding,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalRecordLoadExpression = (
  { path },
  context,
  { operation, variable },
) =>
  makeLoadExpression({ path }, context, {
    operation,
    record: cacheIntrinsic("aran.record"),
    variable,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "initialize" | "write",
 *     variable: estree.Variable,
 *     binding: import("./index.js").GlobalRecordBinding,
 *     right: import("../../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordSaveEffect = (
  { path },
  context,
  { operation, variable, binding, right },
) => {
  switch (operation) {
    case "initialize": {
      return listSaveEffect({ path }, context, {
        mode: "sloppy",
        operation,
        record: cacheIntrinsic("aran.record"),
        variable,
        right: right ?? cachePrimitive({ undefined: null }),
      });
    }
    case "write": {
      if (right === null) {
        return [];
      } else {
        if (binding.kind === "let" || binding.kind === "class") {
          return [
            makeConditionalEffect(
              makeLiveExpression({ path }, context, {
                record: cacheIntrinsic("aran.record"),
                variable,
              }),
              listSaveEffect({ path }, context, {
                mode: "sloppy",
                operation,
                record: cacheIntrinsic("aran.record"),
                variable,
                right,
              }),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(variable, path),
                  path,
                ),
              ],
              path,
            ),
          ];
        } else if (binding.kind === "const") {
          return [
            makeConditionalEffect(
              makeLiveExpression({ path }, context, {
                record: cacheIntrinsic("aran.record"),
                variable,
              }),
              [
                makeExpressionEffect(
                  makeThrowConstantExpression(variable, path),
                  path,
                ),
              ],
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(variable, path),
                  path,
                ),
              ],
              path,
            ),
          ];
        } else {
          throw new AranTypeError("invalid binding kind", binding.kind);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};
