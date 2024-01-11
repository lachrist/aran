import { makeEarlyErrorExpression } from "../../early-error.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { prependSequence } from "../../sequence.mjs";

//////////
// meta //
//////////

/**
 * @type {(
 *   evaluated: boolean,
 *   parameter: import("../../../header").StraightParameter,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadStraightExpression = (evaluated, parameter, path) =>
  prependSequence(
    evaluated ? [] : [makeHeaderPrelude({ type: parameter })],
    makeReadExpression(parameter, path),
  );

/////////////
// private //
/////////////

/**
 * @type {(
 *   evaluated: boolean,
 *   parameter: "private.has" | "private.get",
 *   target: import("../../sequence").ExpressionSequence,
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadPrivateExpression = (
  evaluated,
  parameter,
  target,
  key,
  path,
) =>
  prependSequence(
    evaluated
      ? [
          makeHeaderPrelude({
            type: parameter,
            key,
          }),
        ]
      : [],
    makeApplyExpression(
      makeReadExpression(parameter, path),
      makePrimitiveExpression({ undefined: null }, path),
      [target, makePrimitiveExpression(key, path)],
      path,
    ),
  );

/**
 * @type {(
 *   evaluated: boolean,
 *   parameter: "private.set",
 *   target: import("../../sequence").ExpressionSequence,
 *   key: estree.PrivateKey,
 *   value: import("../../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeSavePrivateEffect = (
  evaluated,
  parameter,
  target,
  key,
  value,
  path,
) =>
  makeExpressionEffect(
    prependSequence(
      evaluated
        ? []
        : [
            makeHeaderPrelude({
              type: parameter,
              key,
            }),
          ],
      makeApplyExpression(
        makeReadExpression(parameter, path),
        makePrimitiveExpression({ undefined: null }, path),
        [target, makePrimitiveExpression(key, path), value],
        path,
      ),
    ),
    path,
  );

////////////
// lookup //
////////////

/**
 * @type {(
 *   evaluated: boolean,
 *   parameter: (
 *     | "read.strict"
 *     | "read.sloppy"
 *     | "typeof.strict"
 *     | "typeof.sloppy"
 *     | "discard.sloppy"
 *     | "discard.strict"
 *   ),
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadLookupExpression = (
  evaluated,
  parameter,
  variable,
  path,
) => {
  if (parameter === "discard.strict") {
    return makeEarlyErrorExpression(
      `Illegal strict discard of ${variable}`,
      path,
    );
  } else {
    return prependSequence(
      evaluated
        ? []
        : [
            makeHeaderPrelude({
              type: parameter,
              variable,
            }),
          ],
      makeApplyExpression(
        makeReadExpression(parameter, path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      ),
    );
  }
};

/**
 * @type {(
 *   evaluated: boolean,
 *   parameter: "write.sloppy" | "write.strict",
 *   variable: estree.Variable,
 *   value: import("../../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeSaveLookupEffect = (
  evaluated,
  parameter,
  variable,
  value,
  path,
) =>
  makeExpressionEffect(
    prependSequence(
      evaluated
        ? []
        : [
            makeHeaderPrelude({
              type: parameter,
              variable,
            }),
          ],
      makeApplyExpression(
        makeReadExpression(parameter, path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path), value],
        path,
      ),
    ),
    path,
  );
