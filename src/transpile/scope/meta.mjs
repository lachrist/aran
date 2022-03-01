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
  assert,
  makeCurry,
  callCurry,
  generateThrowError,
  createCounter,
  incrementCounter,
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
  makePropertyScope,
  lookupScopeProperty,
  makeRootScope as makeCoreRootScope,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaLookupExpression,
  makeMetaLookupEffect,
} from "./split.mjs";

export {
  makeClosureScope,
  makePropertyScope,
  makeDynamicScope,
  makeScopeBlock,
  declareBaseVariable as declareVariable,
  annotateBaseVariable as annotateVariable,
  makeBaseInitializeEffect as makeInitializeEffect,
  makeBaseLookupExpression as makeLookupExpression,
  makeBaseLookupEffect as makeLookupEffect,
} from "./split.mjs";

const {
  Date: {now: getNow},
  Reflect: {apply},
  Number: {
    prototype: {toString},
  },
  Math: {random, round},
  Error,
} = globalThis;

const TEST_TYPE = "test";
const LOCAL_TYPE = "local";
const GLOBAL_TYPE = "global";
const PRIMITIVE_TYPE = "primitive";
const INTRINSIC_TYPE = "intrinsic";

const ENCODING = [36];

const onOpenLiveHit = (variable, _note) => makeReadExpression(variable);

const onInitializeHit = (expression, variable) =>
  makeWriteEffect(variable, expression);

const onCloseLiveHit = (expression, variable, _note) =>
  makeWriteEffect(variable, expression);

let uuid = null;
const getUUID = () => {
  uuid = `${apply(toString, getNow(), ENCODING)}_${apply(
    toString,
    round(10e12 * random()),
    ENCODING,
  )}`;
  return uuid;
};
export const getLatestUUID = () => uuid;

//////////
// Make //
//////////

const generateMakeBox = (type) => (data) => ({type, data});
export const makePrimitiveBox = generateMakeBox(PRIMITIVE_TYPE);
export const makeIntrinsicBox = generateMakeBox(INTRINSIC_TYPE);
export const makeTestBox = generateMakeBox(TEST_TYPE);
const makeLocalBox = generateMakeBox(LOCAL_TYPE);
const makeGlobalBox = generateMakeBox(GLOBAL_TYPE);

/////////////
// Declare //
/////////////

export const makeRootScope = () =>
  makePropertyScope(makeCoreRootScope(), "meta-counter", createCounter(0));

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
  variable = `${variable}_${apply(
    toString,
    incrementCounter(lookupScopeProperty(scope, "meta-counter")),
    ENCODING,
  )}`;
  const success = declareMetaVariable(scope, variable);
  assert(
    typeof success === "boolean",
    "cannot declare meta variable in dynamic scope",
  );
  if (success) {
    return {
      box: makeLocalBox(variable),
      effect: makeMetaInitializeEffect(scope, variable, {
        __proto__: initialize_curry_object,
        onDeadHit: makeCurry(onInitializeHit, expression),
      }),
    };
  } else {
    const key = `${variable}_${getUUID()}`;
    return {
      box: makeGlobalBox(key),
      effect: makeExpressionEffect(
        makeStrictSetExpression(
          makeIntrinsicExpression("aran.globalRecord"),
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

export const makeOpenExpression = (scope, {type, data}) => {
  if (type === TEST_TYPE) {
    return makeReadExpression(data);
  } else if (type === PRIMITIVE_TYPE) {
    return makeLiteralExpression(data);
  } else if (type === INTRINSIC_TYPE) {
    return makeIntrinsicExpression(data);
  } else if (type === LOCAL_TYPE) {
    return makeMetaLookupExpression(scope, data, open_curry_object);
  } else if (type === GLOBAL_TYPE) {
    return makeGetExpression(
      makeIntrinsicExpression("aran.globalRecord"),
      makeLiteralExpression(data),
    );
  } else {
    throw new Error("invalid box type for opening");
  }
};

export const makeCloseEffect = (scope, {type, data}, expression) => {
  if (type === TEST_TYPE) {
    return makeWriteEffect(data, expression);
  } else if (type === LOCAL_TYPE) {
    return makeMetaLookupEffect(scope, data, {
      __proto__: lookup_curry_object,
      onLiveHit: makeCurry(onCloseLiveHit, expression),
    });
  } else if (type === GLOBAL_TYPE) {
    return makeExpressionEffect(
      makeStrictSetExpression(
        makeIntrinsicExpression("aran.globalRecord"),
        makeLiteralExpression(data),
        expression,
      ),
    );
  } else {
    throw new Error("invalid box type for closing");
  }
};
