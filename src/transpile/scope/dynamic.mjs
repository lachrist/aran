import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";

import {
  makeUnaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeSymbolUnscopablesExpression,
  makeDeadzoneExpression,
  makeThrowSyntaxErrorExpression,
  makeThrowReferenceErrorExpression,
} from "../../intrinsic.mjs";

const {Symbol} = globalThis;

export const READ = Symbol("read");
export const DISCARD = Symbol("delete");
export const TYPEOF = Symbol("typeof");

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
              makeBinaryExpression(
                "in",
                makeLiteralExpression(variable),
                frame,
              ),
              makeThrowSyntaxErrorExpression(
                makeLiteralExpression(
                  `Identifier '${variable}' has already been declared`,
                ),
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
              makeBinaryExpression(
                "in",
                makeLiteralExpression(variable),
                frame,
              ),
              makeLiteralExpression({undefined: null}),
              makeDefineExpression(
                frame,
                makeLiteralExpression(variable),
                makeDataDescriptorExpression(
                  makeLiteralExpression({undefined: null}),
                  makeLiteralExpression(true),
                  makeLiteralExpression(true),
                  makeLiteralExpression(false),
                ),
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
              makeDataDescriptorExpression(
                makeDeadzoneExpression(),
                makeLiteralExpression(true),
                makeLiteralExpression(true),
                makeLiteralExpression(false),
              ),
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
              makeDataDescriptorExpression(
                expression,
                makeLiteralExpression(writable),
                makeLiteralExpression(true),
                makeLiteralExpression(false),
              ),
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
        makeGetExpression(frame, makeSymbolUnscopablesExpression()),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(frame, makeSymbolUnscopablesExpression()),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), frame),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), frame),
      )
    : makeBinaryExpression("in", makeLiteralExpression(variable), frame);

const makeCheckDeadzoneExpression = (scoping, frame, variable, alternate) =>
  scoping === RIGID
    ? makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeGetExpression(frame, makeLiteralExpression(variable)),
          makeDeadzoneExpression(),
        ),
        makeThrowReferenceErrorExpression(
          makeLiteralExpression(
            `Cannot access '${variable}' before initialization`,
          ),
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
  } else if (right === READ || right === TYPEOF || right === DISCARD) {
    let expression =
      right === DISCARD
        ? makeDeleteExpression(strict, frame, makeLiteralExpression(variable))
        : makeGetExpression(frame, makeLiteralExpression(variable));
    if (right === TYPEOF) {
      expression = makeUnaryExpression("typeof", expression);
    }
    if (right !== DISCARD) {
      expression = makeCheckDeadzoneExpression(
        scoping,
        frame,
        variable,
        expression,
      );
    }
    return makeConditionalExpression(
      makeScopableExpression(unscopable, frame, variable),
      expression,
      next,
    );
  } else {
    return makeConditionalEffect(
      makeScopableExpression(unscopable, frame, variable),
      makeExpressionEffect(
        makeCheckDeadzoneExpression(
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
