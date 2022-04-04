import {push, assert} from "../../util.mjs";

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

const generateRead =
  ({variable, state}) =>
  () => {
    state.accessed = true;
    return makeReadExpression(makeBaseVariable(variable));
  };

const generateWrite =
  ({variable, state}) =>
  (expression) => {
    state.accessed = true;
    return makeWriteEffect(makeBaseVariable(variable), expression);
  };

export const makeBinding = (variable, note) => ({
  variable,
  note,
  state: {initialization: NO, deadzone: false, accessed: false},
});

export const equalsBindingVariable = ({variable: variable1}, variable2) =>
  variable1 === variable2;

export const makeBindingInitializeEffect = (binding, distant, expression) => {
  const {state, variable} = binding;
  assert(state.initialization === NO, "duplicate binding initialization");
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
  state.accessed = true;
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
    } else if (state.initialization === NO && !escaped) {
      return onDeadHit();
    } else {
      state.deadzone = true;
      return makeConditional(
        makeReadExpression(makeMetaVariable(variable)),
        onLiveHit(generateRead(binding), generateWrite(binding), note),
        onDeadHit(),
      );
    }
  };

export const makeBindingLookupExpression = generateLookup(
  makeConditionalExpression,
);
export const makeBindingLookupEffect = generateLookup(makeConditionalEffect);

export const harvestBindingVariables = ({state, variable}) => {
  const variables = [];
  if (state.accessed) {
    push(variables, makeBaseVariable(variable));
  }
  if (state.deadzone) {
    push(variables, makeMetaVariable(variable));
  }
  return variables;
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
