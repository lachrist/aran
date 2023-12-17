import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeApplyExpression,
} from "../../node.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { listSaveEffect, makeLoadExpression } from "../access.mjs";

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
export const makeGlobalObjectLoadExpression = (
  { path },
  context,
  { operation, record, variable, alternate },
) =>
  makeConditionalExpression(
    makeBindExpression({ path }, context, { record, variable }),
    makeLoadExpression({ path }, context, {
      operation,
      record,
      variable,
    }),
    alternate,
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
 *     operation: "write",
 *     record: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectSaveEffect = (
  { path },
  context,
  { operation, record, variable, right, alternate },
) => [
  makeConditionalEffect(
    makeBindExpression({ path }, context, {
      record,
      variable,
    }),
    right === null
      ? []
      : listSaveEffect({ path }, context, {
          mode: context.mode,
          operation,
          record,
          variable,
          right,
        }),
    alternate,
    path,
  ),
];
