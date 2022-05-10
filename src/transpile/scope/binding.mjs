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

const {Symbol, undefined} = globalThis;

export const READ = Symbol("read");
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

export const matches = ({variable: variable1}, variable2) =>
  variable1 === variable2;

export const makeInitializeEffect = (binding, distant, expression) => {
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

export const access = ({state}, escaped) => {
  if (state.initialization === NO && escaped) {
    state.deadzone = true;
  }
};

const generateMakeLookupNode =
  (makeConditional) =>
  (binding, escaped, right, {onStaticDeadHit, onStaticLiveHit}) => {
    const {state, variable, note} = binding;
    const node =
      right === READ
        ? makeReadExpression(makeBaseVariable(variable))
        : makeWriteEffect(makeBaseVariable(variable), right);
    if (state.initialization === YES) {
      return onStaticLiveHit(node, note);
    } else if (
      state.initialization === NEVER ||
      (state.initialization === NO && !escaped)
    ) {
      return onStaticDeadHit(note);
    } else {
      state.deadzone = true;
      return makeConditional(
        makeReadExpression(makeMetaVariable(variable)),
        onStaticLiveHit(node, note),
        onStaticDeadHit(note),
      );
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeConditionalExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeConditionalEffect);

export const assertInitialization = ({state}) => {
  assert(state.initialization !== NO, "missing variable initialization");
};

export const harvestVariables = ({state, variable}) => {
  if (state.initialization === NEVER) {
    return [];
  } else if (state.deadzone) {
    return [makeBaseVariable(variable), makeMetaVariable(variable)];
  } else {
    return [makeBaseVariable(variable)];
  }
};

export const harvestStatements = ({state, variable}) => {
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
