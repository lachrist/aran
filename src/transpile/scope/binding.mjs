import {assert} from "../../util.mjs";

import {makeBaseVariable, makeMetaVariable} from "../../variable.mjs";

import {
  makeBlock,
  makeIfStatement,
  makeSequenceEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeWriteEffect,
  makeLiteralExpression,
  makeReadExpression,
  makeEffectStatement,
} from "../../ast/index.mjs";

const {Symbol} = globalThis;

export const READ = Symbol("read");

const YES = "yes";
const NO = "no";
const MAYBE = "maybe";
const NEVER = "never";

const generateMakeBinding = (initialization) => (variable, note) => ({
  variable,
  note,
  state: {
    initialization,
    deadzone: false,
  },
});

export const makeBinding = generateMakeBinding(NO);

// Usage for ghost variables:
//   - Shadowing variables for for-in & for-of loops:
//     for (let x in x) { 123; }
//     >> {
//     >>   // let x; (ghosted out)
//     >>   const target = ((() => { throw new ReferenceError("Deadzone") }) ());
//     >>   const keys = ...;
//     >>   const length = keys.length;
//     >>   let index = 0;
//     >>   while (index < length) {
//     >>     let x = keys[index];
//     >>     { 123; } } }
//   - Imports

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

const generateLookup =
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

export const makeLookupExpression = generateLookup(makeConditionalExpression);

export const makeLookupEffect = generateLookup(makeConditionalEffect);

const makeConditionalStatementArray = (test, statements1, statements2) => [
  makeIfStatement(
    test,
    makeBlock([], [], statements1),
    makeBlock([], [], statements2),
  ),
];

export const makeLookupStatementArray = generateLookup(
  makeConditionalStatementArray,
);

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
