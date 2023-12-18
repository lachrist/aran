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
 *   frame: import(".").GlobalRecordFrame,
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
 *   frame: import(".").GlobalRecordFrame,
 *   operation: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeLiveExpression = ({ path }, frame, { mode, variable }) =>
  makeBinaryExpression(
    "===",
    makeLoadExpression({ path }, frame.record, {
      type: "read",
      mode,
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
 *   frame: import(".").GlobalRecordFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalRecordLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) =>
  guard(
    operation.type === "read" || operation.type === "typeof",
    (node) =>
      makeConditionalExpression(
        makeLiveExpression({ path }, frame, operation),
        node,
        makeThrowDeadzoneExpression(operation.variable, path),
        path,
      ),
    makeConditionalExpression(
      makeBindExpression({ path }, frame, operation),
      makeLoadExpression({ path }, frame.record, operation),
      alternate,
      path,
    ),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").GlobalRecordFrame,
 *   options: import("..").WriteOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordSaveEffect = (
  { path },
  frame,
  operation,
  alternate,
) => [
  makeConditionalEffect(
    makeBindExpression({ path }, frame, operation),
    [
      makeConditionalEffect(
        makeBindExpression({ path }, frame, operation),
        listSaveEffect({ path }, frame.record, {
          ...operation,
          mode: "strict",
        }),
        [
          makeExpressionEffect(
            makeThrowDeadzoneExpression(operation.variable, path),
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
