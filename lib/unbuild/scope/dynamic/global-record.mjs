import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeApplyExpression,
  makeExpressionEffect,
} from "../../node.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { listSaveEffect, makeLoadExpression } from "../access.mjs";
import { makeThrowDeadzoneExpression } from "../error.mjs";
import { guard } from "../../../util/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     record: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindExpression = ({ path }, _context, { record, variable }) =>
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: import("../../cache.js").Cache,
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
 *   context: {
 *     mode: "sloppy" | "strict",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     record: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalRecordLoadExpression = (
  { path },
  context,
  { operation, record, variable, alternate },
) =>
  guard(
    operation === "read" || operation === "typeof",
    (node) =>
      makeConditionalExpression(
        makeLiveExpression({ path }, context, { record, variable }),
        node,
        makeThrowDeadzoneExpression(variable, path),
        path,
      ),
    makeConditionalExpression(
      makeBindExpression({ path }, context, { record, variable }),
      makeLoadExpression({ path }, context, {
        operation,
        record,
        variable,
      }),
      alternate,
      path,
    ),
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
 *     operation: "write",
 *     record: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordSaveEffect = (
  { path },
  context,
  { operation, record, variable, right, alternate },
) => [
  makeConditionalEffect(
    makeBindExpression({ path }, context, {
      record,
      variable,
    }),
    [
      makeConditionalEffect(
        makeBindExpression({ path }, context, {
          record,
          variable,
        }),
        right === null
          ? []
          : listSaveEffect({ path }, context, {
              mode: "strict",
              operation,
              record,
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
    ],
    alternate,
    path,
  ),
];
