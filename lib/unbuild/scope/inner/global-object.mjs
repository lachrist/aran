import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeDeleteExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeConditionalExpression,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeThrowConstantExpression } from "./error.mjs";

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
export const makeDefineGlobalObjectExpression = (
  { path },
  _context,
  { variable },
) => [
  makeExpressionEffect(
    makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(variable, path),
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
      ),
      makePrimitiveExpression({ undefined: null }, path),
      makeThrowConstantExpression(variable, path),
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
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeleteGlobalObjectExpression = (
  { path },
  context,
  { variable },
) =>
  makeDeleteExpression(
    context.mode,
    makeIntrinsicExpression("aran.global", path),
    makePrimitiveExpression(variable, path),
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
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHasNonConfigurableGlobalObjectExpression = (
  { path },
  _context,
  { variable },
) =>
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
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHasGlobalObjectExpression = (
  { path },
  _context,
  { variable },
) =>
  makeBinaryExpression(
    "in",
    makePrimitiveExpression(variable, path),
    makeIntrinsicExpression("aran.global", path),
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
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetGlobalObjectExpression = (
  { path },
  _context,
  { variable },
) =>
  makeGetExpression(
    makeIntrinsicExpression("aran.global", path),
    makePrimitiveExpression(variable, path),
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
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetGlobalObjectEffect = (
  { path },
  context,
  { variable, right },
) => [
  makeExpressionEffect(
    makeSetExpression(
      context.mode,
      makeIntrinsicExpression("aran.global", path),
      makePrimitiveExpression(variable, path),
      right,
      path,
    ),
    path,
  ),
];
