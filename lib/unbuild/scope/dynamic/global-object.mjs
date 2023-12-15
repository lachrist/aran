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
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindExpression = ({ path }, _context, { frame, variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeReadCacheExpression(frame, path),
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
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalObjectLoadExpression = (
  { path },
  context,
  { operation, frame, variable, alternate },
) =>
  makeConditionalExpression(
    makeBindExpression({ path }, context, { frame, variable }),
    makeLoadExpression({ path }, context, {
      operation,
      frame,
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
 *     frame: import("../../cache.js").Cache,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectSaveEffect = (
  { path },
  context,
  { operation, frame, variable, right, alternate },
) => [
  makeConditionalEffect(
    makeBindExpression({ path }, context, {
      frame,
      variable,
    }),
    right === null
      ? []
      : listSaveEffect({ path }, context, {
          mode: context.mode,
          operation,
          frame,
          variable,
          right,
        }),
    alternate,
    path,
  ),
];
