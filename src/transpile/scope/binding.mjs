import {includes} from "array-lite";

import {assert} from "../../util.mjs";

import {makeBaseVariable, makeMetaVariable} from "../../variable.mjs";

import {
  makeSequenceEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeWriteEffect,
  makeLiteralExpression,
  makeReadExpression,
  makeEffectStatement,
} from "../../ast/index.mjs";

const YES = true;
const NO = false;
const MAYBE = null;

export const makeBinding = (variable, note) => ({
  variable,
  note,
  state: {initialization: NO, deadzone: false},
});

export const makeGhostBinding = (variable, note) => ({
  variable,
  note,
  state: null,
});

export const includesBindingVariable = (variables, {variable}) =>
  includes(variables, variable);

export const equalsBindingVariable = (variable1, {variable: variable2}) =>
  variable1 === variable2;

export const makeBindingInitializeEffect = (
  {variable, state},
  distant,
  {onDeadHit},
) => {
  assert(state !== null, "cannot initialize ghost variable");
  assert(state.initialization === NO, "duplicate binding initialization");
  state.initialization = distant ? MAYBE : YES;
  if (distant) {
    state.deadzone = true;
  }
  const effect = onDeadHit(makeBaseVariable(variable));
  return state.deadzone
    ? makeSequenceEffect(
        effect,
        makeWriteEffect(
          makeMetaVariable(variable),
          makeLiteralExpression(true),
        ),
      )
    : effect;
};

export const accessBinding = (escaped, {state}) => {
  if (state !== null && state.initialization === NO && escaped) {
    state.deadzone = true;
  }
};

const generateLookup =
  (makeConditional) =>
  ({variable, state, note}, escaped, {onGhostHit, onDeadHit, onLiveHit}) => {
    if (state === null) {
      return onGhostHit(note);
    } else if (state.initialization === YES) {
      return onLiveHit(makeBaseVariable(variable), note);
    } else if (state.initialization === NO && !escaped) {
      return onDeadHit();
    } else {
      state.deadzone = true;
      return makeConditional(
        makeReadExpression(makeMetaVariable(variable)),
        onLiveHit(makeBaseVariable(variable), note),
        onDeadHit(),
      );
    }
  };

export const makeBindingLookupExpression = generateLookup(
  makeConditionalExpression,
);
export const makeBindingLookupEffect = generateLookup(makeConditionalEffect);

export const assertBindingInitialization = ({state}) => {
  assert(
    state === null || state.initialization !== NO,
    "missing binding initialization",
  );
};

export const harvestBindingVariables = ({state, variable}) => {
  if (state === null) {
    return [];
  } else if (state.deadzone) {
    return [makeBaseVariable(variable), makeMetaVariable(variable)];
  } else {
    return [makeBaseVariable(variable)];
  }
};

export const harvestBindingStatements = ({state, variable}) => {
  if (state === null || !state.deadzone) {
    return [];
  } else {
    return [
      makeEffectStatement(
        makeWriteEffect(
          makeMetaVariable(variable),
          makeLiteralExpression(false),
        ),
      ),
    ];
  }
};
