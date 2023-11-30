import {
  listImpureEffect,
  listInitCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";
import {
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalEffect,
  makeExpressionEffect,
} from "../../node.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "./error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     writable: boolean,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclareGlobalRecordEffect = (
  { path },
  _context,
  { writable, variable },
) => [
  makeExpressionEffect(
    makeSetExpression(
      "strict",
      makeIntrinsicExpression("aran.record.variables", path),
      makePrimitiveExpression(variable, path),
      makePrimitiveExpression(writable, path),
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
 *   context: {},
 *   options: {
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitializeGlobalRecordEffect = (
  { path },
  _context,
  { variable, right },
) => [
  makeExpressionEffect(
    makeSetExpression(
      "strict",
      makeIntrinsicExpression("aran.record.values", path),
      makePrimitiveExpression(variable, path),
      right,
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
 *   context: {},
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeExistGlobalRecordExpression = (
  { path },
  _context,
  { variable },
) =>
  makeBinaryExpression(
    "in",
    makePrimitiveExpression(variable, path),
    makeIntrinsicExpression("aran.record.variables", path),
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
export const makeReadGlobalRecordExpression = (
  { path },
  _context,
  { variable },
) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values", path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   contest: {},
 *   options: {
 *     writable: true | false | null,
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteGlobalRecordEffect = (
  { path, meta },
  _context,
  { writable, variable, right },
) => [
  makeConditionalEffect(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    writable === null
      ? listInitCacheEffect("constant", right, { path, meta }, (right) => [
          makeConditionalEffect(
            makeGetExpression(
              makeIntrinsicExpression("aran.record.variables", path),
              makePrimitiveExpression(variable, path),
              path,
            ),
            [
              makeExpressionEffect(
                makeSetExpression(
                  "strict",
                  makeIntrinsicExpression("aran.record.values", path),
                  makePrimitiveExpression(variable, path),
                  makeReadCacheExpression(right, path),
                  path,
                ),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowConstantExpression(variable, path),
                path,
              ),
            ],
            path,
          ),
        ])
      : writable
      ? [
          makeExpressionEffect(
            makeSetExpression(
              "strict",
              makeIntrinsicExpression("aran.record.values", path),
              makePrimitiveExpression(variable, path),
              right,
              path,
            ),
            path,
          ),
        ]
      : [
          ...listImpureEffect(right, path),
          makeExpressionEffect(
            makeThrowConstantExpression(variable, path),
            path,
          ),
        ],
    [makeExpressionEffect(makeThrowDeadzoneExpression(variable, path), path)],
    path,
  ),
];
