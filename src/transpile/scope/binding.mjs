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

export const accessBinding = ({state}, escaped) => {
  if (state.initialization === NO && escaped) {
    state.deadzone = true;
  }
};

export const makeBindingLookupNode = (
  binding,
  escaped,
  right,
  {onDeadHit, onLiveHit},
) => {
  const {state, variable, note} = binding;
  const node =
    right === null
      ? makeReadExpression(makeBaseVariable(variable))
      : makeWriteEffect(makeBaseVariable(variable), right);
  if (state.initialization === YES) {
    return onLiveHit(node, note);
  } else if (
    state.initialization === NEVER ||
    (state.initialization === NO && !escaped)
  ) {
    return onDeadHit(note);
  } else {
    state.deadzone = true;
    const makeConditional =
      right === null ? makeConditionalExpression : makeConditionalEffect;
    return makeConditional(
      makeReadExpression(makeMetaVariable(variable)),
      onLiveHit(node, note),
      onDeadHit(note),
    );
  }
};

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
