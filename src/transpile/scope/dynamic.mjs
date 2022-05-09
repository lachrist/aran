import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";

import {
  makeHasExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeSimpleObjectExpression,
  makeDirectIntrinsicExpression,
  makeThrowSyntaxErrorExpression,
  makeThrowReferenceErrorExpression,
} from "../intrinsic.mjs";

import {READ} from "./split.mjs";

export {READ} from "./split.mjs";

const {Symbol} = globalThis;

export const DELETE = Symbol("delete");

const EMPTY = null;
const RIGID = true;
const LOOSE = false;

const generateMakeDynamicFrame = (scoping) => (unscopable, frame) => ({
  frame,
  scoping,
  unscopable,
});

export const makeEmptyDynamicFrame = generateMakeDynamicFrame(EMPTY);

export const makeLooseDynamicFrame = generateMakeDynamicFrame(LOOSE);

export const makeRigidDynamicFrame = generateMakeDynamicFrame(RIGID);

/////////////
// Prelude //
/////////////

export const makePreludeStatementArray = ({scoping, frame}, variable) =>
  scoping === RIGID
    ? [
        makeEffectStatement(
          makeExpressionEffect(
            makeConditionalExpression(
              makeHasExpression(frame, makeLiteralExpression(variable)),
              makeThrowSyntaxErrorExpression(
                `Identifier '${variable}' has already been declared`,
              ),
              makeLiteralExpression({undefined: null}),
            ),
          ),
        ),
      ]
    : [];

///////////
// Loose //
///////////

export const makeLooseDeclareStatementArray = ({scoping, frame}, variable) =>
  scoping === LOOSE
    ? [
        makeEffectStatement(
          makeExpressionEffect(
            makeConditionalExpression(
              makeHasExpression(frame, makeLiteralExpression(variable)),
              makeLiteralExpression({undefined: null}),
              makeDefineExpression(
                frame,
                makeLiteralExpression(variable),
                makeSimpleObjectExpression(makeLiteralExpression(null), {
                  configurable: makeLiteralExpression(false),
                  enumerable: makeLiteralExpression(true),
                  value: makeLiteralExpression({undefined: null}),
                  writable: makeLiteralExpression(true),
                }),
              ),
            ),
          ),
        ),
      ]
    : [];

///////////
// Rigid //
///////////

export const makeRigidDeclareStatementArray = ({scoping, frame}, variable) =>
  scoping === RIGID
    ? [
        makeEffectStatement(
          makeExpressionEffect(
            makeDefineExpression(
              frame,
              makeLiteralExpression(variable),
              makeSimpleObjectExpression(makeLiteralExpression(null), {
                configurable: makeLiteralExpression(false),
                enumerable: makeLiteralExpression(true),
                value: makeDirectIntrinsicExpression("aran.deadzone"),
                writable: makeLiteralExpression(true),
              }),
            ),
          ),
        ),
      ]
    : [];

export const makeRigidInitializeStatementArray = (
  {scoping, frame},
  variable,
  writable,
  expression,
) =>
  scoping === RIGID
    ? [
        makeEffectStatement(
          makeExpressionEffect(
            makeDefineExpression(
              frame,
              makeLiteralExpression(variable),
              makeSimpleObjectExpression(makeLiteralExpression(null), {
                configurable: makeLiteralExpression(false),
                enumerable: makeLiteralExpression(true),
                value: expression,
                writable: makeLiteralExpression(writable),
              }),
            ),
          ),
        ),
      ]
    : [];

////////////
// Lookup //
////////////

const makeScopableExpression = (unscopable, frame, variable) =>
  unscopable
    ? makeConditionalExpression(
        makeGetExpression(
          frame,
          makeDirectIntrinsicExpression("Symbol.unscopables"),
        ),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(
              frame,
              makeDirectIntrinsicExpression("Symbol.unscopables"),
            ),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeHasExpression(frame, makeLiteralExpression(variable)),
        ),
        makeHasExpression(frame, makeLiteralExpression(variable)),
      )
    : makeHasExpression(frame, makeLiteralExpression(variable));

const makeDeadzoneExpression = (scoping, frame, variable, alternate) =>
  scoping === RIGID
    ? makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeGetExpression(frame, makeLiteralExpression(variable)),
          makeDirectIntrinsicExpression("aran.deadzone"),
        ),
        makeThrowReferenceErrorExpression(
          `Cannot access '${variable}' before initialization`,
        ),
        alternate,
      )
    : alternate;

export const makeLookupNode = (
  {scoping, unscopable, frame},
  strict,
  variable,
  right,
  next,
) => {
  if (unscopable === null) {
    return next;
  } else if (right === READ) {
    return makeConditionalExpression(
      makeScopableExpression(unscopable, frame, variable),
      makeDeadzoneExpression(
        scoping,
        frame,
        variable,
        makeGetExpression(frame, makeLiteralExpression(variable)),
      ),
      next,
    );
  } else if (right === DELETE) {
    return makeConditionalExpression(
      makeScopableExpression(unscopable, frame, variable),
      makeDeleteExpression(strict, frame, makeLiteralExpression(variable)),
      next,
    );
  } else {
    return makeConditionalEffect(
      makeScopableExpression(unscopable, frame, variable),
      makeExpressionEffect(
        makeDeadzoneExpression(
          scoping,
          frame,
          variable,
          makeSetExpression(
            strict || scoping === RIGID,
            frame,
            makeLiteralExpression(variable),
            right,
          ),
        ),
      ),
      next,
    );
  }
};
