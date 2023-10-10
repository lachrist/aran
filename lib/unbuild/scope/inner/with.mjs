import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeReadExpression,
} from "../../node.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithExistExpression = (_strict, frame, variable) =>
  makeConditionalExpression(
    makeGetExpression(
      makeReadExpression(frame),
      makeIntrinsicExpression("Symbol.unscopables"),
    ),
    makeConditionalExpression(
      makeGetExpression(
        makeGetExpression(
          makeReadExpression(frame),
          makeIntrinsicExpression("Symbol.unscopables"),
        ),
        makePrimitiveExpression(variable),
      ),
      makePrimitiveExpression(false),
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable),
        makeReadExpression(frame),
      ),
    ),
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable),
      makeReadExpression(frame),
    ),
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithReadExpression = (_strict, frame, variable) =>
  makeGetExpression(
    makeReadExpression(frame),
    makePrimitiveExpression(variable),
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithTypeofExpression = (_strict, frame, variable) =>
  makeUnaryExpression(
    "typeof",
    makeGetExpression(
      makeReadExpression(frame),
      makePrimitiveExpression(variable),
    ),
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithDiscardExpression = (strict, frame, variable) =>
  makeDeleteExpression(
    strict,
    makeReadExpression(frame),
    makePrimitiveExpression(variable),
  );

/**
 * @type {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWithWriteExpression = (strict, frame, variable, right) =>
  makeSetExpression(
    strict,
    makeReadExpression(frame),
    makePrimitiveExpression(variable),
    makeReadExpression(right),
  );
