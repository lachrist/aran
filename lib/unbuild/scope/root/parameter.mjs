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
 *   parameter: import("../../../header").StraightParameter,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadStraightExpression = (parameter, path) =>
  prependSequence(
    [makeHeaderPrelude({ type: parameter })],
    makeReadExpression(parameter, path),
  );

/////////////
// private //
/////////////

/**
 * @type {(
 *   parameter: "private.has" | "private.get",
 *   target: import("../../sequence").ExpressionSequence,
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadPrivateExpression = (parameter, target, key, path) =>
  prependSequence(
    [
      makeHeaderPrelude({
        type: parameter,
        key,
      }),
    ],
    makeApplyExpression(
      makeReadExpression(parameter, path),
      makePrimitiveExpression({ undefined: null }, path),
      [target, makePrimitiveExpression(key, path)],
      path,
    ),
  );

/**
 * @type {(
 *   parameter: "private.set",
 *   target: import("../../sequence").ExpressionSequence,
 *   key: estree.PrivateKey,
 *   value: import("../../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeSavePrivateEffect = (parameter, target, key, value, path) =>
  makeExpressionEffect(
    prependSequence(
      [
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
export const makeLoadLookupExpression = (parameter, variable, path) => {
  if (parameter === "discard.strict") {
    return makeEarlyErrorExpression(
      `Illegal strict discard of ${variable}`,
      path,
    );
  } else {
    return prependSequence(
      [
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
 *   parameter: "write.sloppy" | "write.strict",
 *   variable: estree.Variable,
 *   value: import("../../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeSaveLookupEffect = (parameter, variable, value, path) =>
  makeExpressionEffect(
    prependSequence(
      [
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
