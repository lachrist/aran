import { AranTypeError } from "../../../error.mjs";
import { cacheIntrinsic, cachePrimitive } from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeExpressionEffect,
} from "../../node.mjs";
import { listSaveEffect, makeLoadExpression } from "../access.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeLiveExpression = ({ path }, context, { frame, variable }) =>
  makeBinaryExpression(
    "===",
    makeLoadExpression({ path }, context, {
      operation: "read",
      frame,
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
 *     binding: import("./global-record.d.ts").GlobalRecordBinding,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordPreludeEffect = (
  { path },
  _context,
  { variable },
) => [
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
 *     variable: estree.Variable,
 *     binding: import("./global-record.d.ts").GlobalRecordBinding,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordDeclareEffect = (
  { path },
  _context,
  { variable, binding: kind },
) => [
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
 *     operation: "read" | "typeof" | "discard",
 *     variable: estree.Variable,
 *     binding: import("./global-record").GlobalRecordBinding,
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
    frame: cacheIntrinsic("aran.record"),
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
 *     binding: import("./global-record.d.ts").GlobalRecordBinding,
 *     right: import("../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordSaveEffect = (
  { path },
  context,
  { operation, variable, binding: kind, right },
) => {
  switch (operation) {
    case "initialize": {
      return listSaveEffect({ path }, context, {
        mode: "sloppy",
        operation,
        frame: cacheIntrinsic("aran.record"),
        variable,
        right: right ?? cachePrimitive({ undefined: null }),
      });
    }
    case "write": {
      if (right === null) {
        return [];
      } else {
        switch (kind) {
          case "let": {
            return [
              makeConditionalEffect(
                makeLiveExpression({ path }, context, {
                  frame: cacheIntrinsic("aran.record"),
                  variable,
                }),
                listSaveEffect({ path }, context, {
                  mode: "sloppy",
                  operation,
                  frame: cacheIntrinsic("aran.record"),
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
          }
          case "const": {
            return [
              makeConditionalEffect(
                makeLiveExpression({ path }, context, {
                  frame: cacheIntrinsic("aran.record"),
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
          }
          default: {
            throw new AranTypeError("invalid kind", kind);
          }
        }
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};
