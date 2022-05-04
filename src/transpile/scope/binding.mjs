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

const {undefined} = globalThis;

const YES = true;
const NO = false;
const MAYBE = null;
const NEVER = undefined;

const generateRead =
  ({variable}) =>
  () =>
    makeReadExpression(makeBaseVariable(variable));

const generateWrite =
  ({variable}) =>
  (expression) =>
    makeWriteEffect(makeBaseVariable(variable), expression);

const generateMakeBinding = (initialization) => (variable, note) => ({
  variable,
  note,
  state: {
    initialization,
    deadzone: false,
  },
});

export const makeBinding = generateMakeBinding(NO);

export const makeGhostBinding = generateMakeBinding(NEVER);

export const equalsBindingVariable = ({variable: variable1}, variable2) =>
  variable1 === variable2;

export const makeBindingInitializeEffect = (binding, distant, expression) => {
  const {state, variable} = binding;
  assert(state.initialization === NO, "duplicate/ghost binding initialization");
  state.initialization = distant ? MAYBE : YES;
  if (distant) {
    state.deadzone = true;
  }
  const effect = makeWriteEffect(makeBaseVariable(variable), expression);
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
  if (state.initialization === NO && escaped) {
    state.deadzone = true;
  }
};

const generateLookup =
  (makeConditional) =>
  (binding, escaped, {onDeadHit, onLiveHit}) => {
    const {state, variable, note} = binding;
    if (state.initialization === YES) {
      return onLiveHit(generateRead(binding), generateWrite(binding), note);
    } else if (
      state.initialization === NEVER ||
      (state.initialization === NO && !escaped)
    ) {
      return onDeadHit(note);
    } else {
      state.deadzone = true;
      return makeConditional(
        makeReadExpression(makeMetaVariable(variable)),
        onLiveHit(generateRead(binding), generateWrite(binding), note),
        onDeadHit(note),
      );
    }
  };

export const makeBindingLookupExpression = generateLookup(
  makeConditionalExpression,
);
export const makeBindingLookupEffect = generateLookup(makeConditionalEffect);

export const assertBindingInitialization = ({state}) => {
  assert(state.initialization !== NO, "missing variable initialization");
};

export const harvestBindingVariables = ({state, variable}) => {
  if (state.initialization === NEVER) {
    return [];
  } else if (state.deadzone) {
    return [makeBaseVariable(variable), makeMetaVariable(variable)];
  } else {
    return [makeBaseVariable(variable)];
  }
};

export const harvestBindingStatements = ({state, variable}) => {
  if (!state.deadzone) {
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
