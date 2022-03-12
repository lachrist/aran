// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {concat} from "array-lite";

import {
  returnSecond,
  makeCurry,
  callCurry,
  generateThrowError,
  getUUID,
} from "../../util.mjs";

import {
  makeEffectStatement,
  makeSequenceEffect,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeWriteEffect,
  makeReadExpression,
  makeExpressionEffect,
  makeSequenceExpression,
} from "../../ast/index.mjs";

import {makeGetExpression, makeStrictSetExpression} from "../intrinsic.mjs";

import {
  makeDynamicScope as makeCoreDynamicScope,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaLookupExpression,
  makeMetaLookupEffect,
} from "./split.mjs";

export {
  makeRootScope,
  makeClosureScope,
  makePropertyScope,
  makeScopeBlock,
  lookupScopeProperty,
  declareBaseVariable as declareVariable,
  annotateBaseVariable as annotateVariable,
  makeBaseInitializeEffect as makeInitializeEffect,
  makeBaseLookupExpression as makeLookupExpression,
  makeBaseLookupEffect as makeLookupEffect,
} from "./split.mjs";

const {Error} = globalThis;

const TEST_TYPE = "test";
const STATIC_TYPE = "static";
const DYNAMIC_TYPE = "dynamic";
const PRIMITIVE_TYPE = "primitive";
const INTRINSIC_TYPE = "intrinsic";

const onOpenLiveHit = (variable, _note) => makeReadExpression(variable);

const onInitializeHit = (expression, variable) =>
  makeWriteEffect(variable, expression);

const onCloseLiveHit = (expression, variable, _note) =>
  makeWriteEffect(variable, expression);

//////////
// Make //
//////////

export const makeDynamicScope = (parent, box, data) =>
  makeCoreDynamicScope(parent, {
    box,
    data,
  });

//////////
// Make //
//////////

export const makePrimitiveBox = (primitive) => ({
  type: PRIMITIVE_TYPE,
  primitive,
});

export const makeIntrinsicBox = (intrinsic) => ({
  type: INTRINSIC_TYPE,
  intrinsic,
});

export const makeTestBox = (variable) => ({
  type: TEST_TYPE,
  variable,
});

const makeStaticBox = (variable) => ({
  type: STATIC_TYPE,
  variable,
});

const makeDynamicBox = (object, key) => ({
  type: DYNAMIC_TYPE,
  object,
  key,
});

///////////////////
// Read && Write //
///////////////////

const lookup_curry_object = {
  onMiss: makeCurry(generateThrowError("missing meta variable")),
  onDynamicFrame: makeCurry(returnSecond),
  onLiveHit: null,
  onDeadHit: makeCurry(generateThrowError("meta variable in deadzone")),
  onGhostHit: makeCurry(generateThrowError("ghost meta variable")),
};

const open_curry_object = {
  ...lookup_curry_object,
  onLiveHit: makeCurry(onOpenLiveHit),
};

export const makeOpenExpression = (scope, box) => {
  if (box.type === TEST_TYPE) {
    return makeReadExpression(box.variable);
  } else if (box.type === PRIMITIVE_TYPE) {
    return makeLiteralExpression(box.primitive);
  } else if (box.type === INTRINSIC_TYPE) {
    return makeIntrinsicExpression(box.intrinsic);
  } else if (box.type === STATIC_TYPE) {
    return makeMetaLookupExpression(scope, box.variable, open_curry_object);
  } else if (box.type === DYNAMIC_TYPE) {
    return makeGetExpression(
      makeOpenExpression(scope, box.object),
      makeLiteralExpression(box.key),
    );
  } else {
    throw new Error("invalid box type for opening");
  }
};

export const makeCloseEffect = (scope, box, expression) => {
  if (box.type === TEST_TYPE) {
    return makeWriteEffect(box.variable, expression);
  } else if (box.type === STATIC_TYPE) {
    return makeMetaLookupEffect(scope, box.variable, {
      __proto__: lookup_curry_object,
      onLiveHit: makeCurry(onCloseLiveHit, expression),
    });
  } else if (box.type === DYNAMIC_TYPE) {
    return makeExpressionEffect(
      makeStrictSetExpression(
        makeOpenExpression(scope, box.object),
        makeLiteralExpression(box.key),
        expression,
      ),
    );
  } else {
    throw new Error("invalid box type for closing");
  }
};

/////////////
// Declare //
/////////////

const initialize_curry_object = {
  onMiss: makeCurry(
    generateThrowError("missing meta variable for initialization"),
  ),
  onHit: null,
  onDynamicFrame: makeCurry(
    generateThrowError("hit dynamic scope while initializating meta variable"),
  ),
};

const setup = (scope, variable, expression) => {
  const either = declareMetaVariable(scope, variable);
  if (typeof either === "string") {
    return {
      box: makeStaticBox(either),
      effect: makeMetaInitializeEffect(scope, either, {
        __proto__: initialize_curry_object,
        onDeadHit: makeCurry(onInitializeHit, expression),
      }),
    };
  } else {
    const {box} = either;
    const key = `${variable}_${getUUID()}`;
    return {
      box: makeDynamicBox(box, key),
      effect: makeExpressionEffect(
        makeStrictSetExpression(
          makeOpenExpression(scope, box),
          makeLiteralExpression(key),
          expression,
        ),
      ),
    };
  }
};

const generateMakeBoxNode =
  (aggregate) => (scope, variable, expression, curry) => {
    const {box, effect} = setup(scope, variable, expression);
    return aggregate(effect, callCurry(curry, box));
  };

export const makeBoxExpression = generateMakeBoxNode(makeSequenceExpression);

export const makeBoxEffect = generateMakeBoxNode(makeSequenceEffect);

export const makeBoxStatementArray = generateMakeBoxNode((effect, statements) =>
  concat([makeEffectStatement(effect)], statements),
);
