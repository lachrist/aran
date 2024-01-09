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
  makeReadExpression(parameter, path);

/////////////
// private //
/////////////

/**
 * @type {(
 *   operation: "has" | "get",
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadPrivateExpression = (operation, key, path) =>
  prependSequence(
    [
      makeHeaderPrelude({
        type: "private.static",
        key,
      }),
    ],
    makeApplyExpression(
      makeReadExpression(`private.${operation}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(key, path)],
      path,
    ),
  );

/**
 * @type {(
 *   operation: "set",
 *   key: estree.PrivateKey,
 *   value: import("../../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeSavePrivateEffect = (operation, key, value, path) =>
  makeExpressionEffect(
    prependSequence(
      [
        makeHeaderPrelude({
          type: "private.static",
          key,
        }),
      ],
      makeApplyExpression(
        makeReadExpression(`private.${operation}`, path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(key, path), value],
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
 *   operation: "read" | "typeof" | "discard",
 *   mode: "strict" | "sloppy",
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLoadLookupExpression = (operation, mode, variable, path) =>
  prependSequence(
    [
      makeHeaderPrelude({
        type: "lookup.static",
        mode,
        variable,
      }),
    ],
    makeApplyExpression(
      makeReadExpression(`${operation}.${mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(variable, path)],
      path,
    ),
  );

/**
 * @type {(
 *   operation: "write",
 *   mode: "strict" | "sloppy",
 *   variable: estree.Variable,
 *   value: import("../../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeSaveLookupEffect = (operation, mode, variable, value, path) =>
  makeExpressionEffect(
    prependSequence(
      [
        makeHeaderPrelude({
          type: "lookup.static",
          mode,
          variable,
        }),
      ],
      makeApplyExpression(
        makeReadExpression(`${operation}.${mode}`, path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path), value],
        path,
      ),
    ),
    path,
  );
