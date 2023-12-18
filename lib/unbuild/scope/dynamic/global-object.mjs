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
 *   frame: import(".").GlobalObjectFrame,
 *   operation: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindExpression = ({ path }, frame, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeReadCacheExpression(frame.record, path),
      makePrimitiveExpression(variable, path),
    ],
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").GlobalObjectFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalObjectLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) =>
  makeConditionalExpression(
    makeBindExpression({ path }, frame, operation),
    makeLoadExpression({ path }, frame.record, operation),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").GlobalObjectFrame,
 *   operation: import("..").WriteOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectSaveEffect = (
  { path },
  frame,
  operation,
  alternate,
) => [
  makeConditionalEffect(
    makeBindExpression({ path }, frame, operation),
    listSaveEffect({ path }, frame.record, operation),
    alternate,
    path,
  ),
];
