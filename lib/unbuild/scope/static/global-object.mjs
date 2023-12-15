import { AranTypeError } from "../../../error.mjs";
import { cacheIntrinsic } from "../../cache.mjs";
import { makeDataDescriptorExpression } from "../../intrinsic.mjs";
import {
  makeConditionalEffect,
  makeExpressionEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { listSaveEffect, makeLoadExpression } from "../access.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDuplicateExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     variable: estree.Variable,
 *     binding: import("./global-object.d.ts").GlobalObjectBinding,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectPreludeEffect = (
  { path },
  _context,
  { variable },
) => [
  makeConditionalEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Object.hasOwn", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeIntrinsicExpression("aran.record", path),
        makePrimitiveExpression(variable, path),
      ],
      path,
    ),
    [makeExpressionEffect(makeThrowDuplicateExpression(variable, path), path)],
    [],
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
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeclareExpression = ({ path }, _context, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.defineProperty", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeIntrinsicExpression("aran.global", path),
      makePrimitiveExpression(variable, path),
      makeDataDescriptorExpression(
        {
          value: null,
          writable: true,
          enumerable: true,
          configurable: false,
        },
        path,
      ),
    ],
    path,
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
 *     variable: estree.Variable,
 *     binding: import("./global-object.d.ts").GlobalObjectBinding,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectDeclareEffect = (
  { path },
  context,
  { variable },
) => {
  switch (context.mode) {
    case "strict": {
      return [
        makeConditionalEffect(
          makeDeclareExpression({ path }, context, { variable }),
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
    }
    case "sloppy": {
      return [
        makeExpressionEffect(
          makeDeclareExpression({ path }, context, { variable }),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid mode", context.mode);
    }
  }
};

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
 *     binding: import("./global-object.d.ts").GlobalObjectBinding,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalObjectLoadExpression = (
  { path },
  context,
  { operation, variable },
) =>
  makeLoadExpression({ path }, context, {
    operation,
    frame: cacheIntrinsic("aran.global"),
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
 *     binding: import("./global-object.d.ts").GlobalObjectBinding,
 *     right: import("../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectSaveEffect = (
  { path },
  context,
  { operation, variable, right },
) =>
  right === null
    ? []
    : listSaveEffect({ path }, context, {
        mode: context.mode,
        operation,
        frame: cacheIntrinsic("aran.global"),
        variable,
        right,
      });
