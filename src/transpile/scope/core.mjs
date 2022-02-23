import {concat, includes} from "array-lite";

import {
  makeEffectStatement,
  makeWriteEffect,
  makeLiteralExpression,
  makeBlock,
  makeSequenceEffect,
  makeReadExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEvalExpression,
} from "../../ast/index.mjs";

import {makeMetaVariable, makeBaseVariable} from "../../variable.mjs";

import {
  assert,
  generateThrowError,
  generateSwitch1,
  generateSwitch2,
  push,
  makeCurry,
  callCurry,
  findCurry,
} from "../../util.mjs";

const YES = true;
const NO = false;
const MAYBE = null;

const ROOT_SCOPE_TYPE = "root";
const DYNAMIC_SCOPE_TYPE = "dynamic";
const STATIC_SCOPE_TYPE = "static";
const PROPERTY_SCOPE_TYPE = "binding";
const CLOSURE_SCOPE_TYPE = "closure";

const equalsVariable = (variable1, {variable: variable2}) =>
  variable1 === variable2;

////////////
// Extend //
////////////

export const makeRootScope = () => ({
  type: ROOT_SCOPE_TYPE,
});

export const makeClosureScope = (parent) => ({
  type: CLOSURE_SCOPE_TYPE,
  parent,
});

export const makePropertyScope = (parent, key, value) => ({
  type: PROPERTY_SCOPE_TYPE,
  parent,
  key,
  value,
});

export const makeDynamicScope = (parent, frame) => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent,
  frame,
});

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

export const makeScopeBlock = (parent, labels, curry) => {
  const bindings = [];
  const scope = {
    type: STATIC_SCOPE_TYPE,
    parent,
    bindings,
  };
  const statements1 = [];
  const statements2 = callCurry(curry, scope);
  const variables = [];
  const {length} = bindings;
  for (let index = 0; index < length; index += 1) {
    const {variable, state} = bindings[index];
    if (state !== null) {
      const {initialization, deadzone} = state;
      assert(initialization !== NO, "missing variable initialization");
      push(variables, makeBaseVariable(variable));
      if (deadzone) {
        const meta_variable = makeMetaVariable(variable);
        push(variables, meta_variable);
        push(
          statements1,
          makeEffectStatement(
            makeWriteEffect(meta_variable, makeLiteralExpression(false)),
          ),
        );
      }
    }
  }
  return makeBlock(labels, variables, concat(statements1, statements2));
};

/////////////////////////
// lookupScopeProperty //
/////////////////////////

export const lookupScopeProperty = generateSwitch1({
  __proto__: null,
  [ROOT_SCOPE_TYPE]: generateThrowError("missing scope property"),
  [PROPERTY_SCOPE_TYPE]: ({parent, key: key1, value}, key2) =>
    key1 === key2 ? value : lookupScopeProperty(parent, key2),
  [CLOSURE_SCOPE_TYPE]: ({parent}, key) => lookupScopeProperty(parent, key),
  [STATIC_SCOPE_TYPE]: ({parent}, key) => lookupScopeProperty(parent, key),
  [DYNAMIC_SCOPE_TYPE]: ({parent}, key) => lookupScopeProperty(parent, key),
});

/////////////
// Declare //
/////////////

const declare = generateSwitch1({
  __proto__: null,
  [ROOT_SCOPE_TYPE]: generateThrowError(
    "missing binding scope for declaration",
  ),
  [CLOSURE_SCOPE_TYPE]: generateThrowError(
    "hit closure scope during declaration",
  ),
  [STATIC_SCOPE_TYPE]: ({bindings}, {variable, note, ghost}) => {
    assert(
      findCurry(bindings, makeCurry(equalsVariable, variable)) === null,
      "duplicate static variable declaration",
    );
    push(bindings, {
      variable,
      note,
      state: ghost
        ? null
        : {
            initialization: NO,
            deadzone: false,
          },
    });
    return [];
  },
  [DYNAMIC_SCOPE_TYPE]: ({frame}, {onDynamicFrame}) =>
    callCurry(onDynamicFrame, frame),
  [PROPERTY_SCOPE_TYPE]: ({parent}, context) => declare(parent, context),
});

export const makeDeclareStatementArray = (
  scope,
  variable,
  note,
  {onDynamicFrame},
) => declare(scope, {ghost: false, variable, note, onDynamicFrame});

export const makeGhostDeclareStatementArray = (
  scope,
  variable,
  note,
  {onDynamicFrame},
) => declare(scope, {ghost: true, variable, note, onDynamicFrame});

////////////////
// Initialize //
////////////////

// Distant initialization is required for normalizing switch blocks:
//
// switch (x) {
//   case y: let foo = 123;
//   case z: foo;
// }
//
// {
//   let foo;
//   let _discriminant = x;
//   let _matched = false;
//   if (_matched ? true : _discriminant === y) {
//     _matched = true;
//     foo = 123; // distant initialization
//   }
//   if (_matched ? true : _discriminant === y) {
//     _matched = true;
//     foo; // dynamic deadzone
//   }
// }

const initialize = generateSwitch2({
  __proto__: null,
  [ROOT_SCOPE_TYPE]: generateThrowError(
    "missing binding scope for initialization",
  ),
  [CLOSURE_SCOPE_TYPE]: generateThrowError(
    "hit closure scope during initialization",
  ),
  [STATIC_SCOPE_TYPE]: ({bindings, parent}, distant, context) => {
    const {variable, right} = context;
    const binding = findCurry(bindings, makeCurry(equalsVariable, variable));
    if (binding === null) {
      return initialize(parent, true, context);
    } else {
      const {state} = binding;
      assert(state !== null, "cannot initialize ghost variable");
      const {initialization} = state;
      let {deadzone} = state;
      assert(initialization === NO, "duplicate binding initialization");
      state.initialization = distant ? MAYBE : YES;
      if (distant && !deadzone) {
        deadzone = true;
        state.deadzone = true;
      }
      const effect = makeWriteEffect(makeBaseVariable(variable), right);
      return deadzone
        ? makeSequenceEffect(
            effect,
            makeWriteEffect(
              makeMetaVariable(variable),
              makeLiteralExpression(true),
            ),
          )
        : effect;
    }
  },
  [PROPERTY_SCOPE_TYPE]: ({parent}, distant, context) =>
    initialize(parent, distant, context),
  [DYNAMIC_SCOPE_TYPE]: ({frame}, _distant, {onDynamicFrame}) =>
    callCurry(onDynamicFrame, frame),
});

export const makeScopeInitializeEffect = (
  scope,
  variable,
  right,
  {onDynamicFrame},
) => initialize(scope, false, {variable, right, onDynamicFrame});

////////////
// lookup //
////////////

const lookup = generateSwitch2({
  __proto__: null,
  [ROOT_SCOPE_TYPE]: (_scope, _escaped, {onMiss}) => callCurry(onMiss),
  [PROPERTY_SCOPE_TYPE]: ({parent}, escaped, context) =>
    lookup(parent, escaped, context),
  [CLOSURE_SCOPE_TYPE]: ({parent}, _escaped, context) =>
    lookup(parent, true, context),
  [DYNAMIC_SCOPE_TYPE]: ({parent, frame}, escaped, context) => {
    const {onDynamicFrame} = context;
    return callCurry(onDynamicFrame, frame, lookup(parent, escaped, context));
  },
  [STATIC_SCOPE_TYPE]: ({parent, bindings}, escaped, context) => {
    const {
      onStaticLiveHit,
      onStaticDeadHit,
      onStaticGhostHit,
      variable,
      right,
    } = context;
    const binding = findCurry(bindings, makeCurry(equalsVariable, variable));
    if (binding === null) {
      return lookup(parent, escaped, context);
    } else {
      const {note, state} = binding;
      if (state === null) {
        return callCurry(onStaticGhostHit, note, right);
      } else {
        const {initialization} = state;
        if (initialization === NO && !escaped) {
          return callCurry(onStaticDeadHit, note);
        } else {
          const either =
            right === null
              ? makeReadExpression(makeBaseVariable(variable))
              : makeWriteEffect(makeBaseVariable(variable), right);
          if (initialization === YES) {
            return callCurry(onStaticLiveHit, note, either);
          } else {
            state.deadzone = true;
            const makeConditional =
              right === null
                ? makeConditionalExpression
                : makeConditionalEffect;
            return makeConditional(
              makeReadExpression(makeMetaVariable(variable)),
              callCurry(onStaticLiveHit, note, either),
              callCurry(onStaticDeadHit, note),
            );
          }
        }
      }
    }
  },
});

export const makeScopeReadExpression = (
  scope,
  variable,
  {onStaticDeadHit, onStaticLiveHit, onStaticGhostHit, onDynamicFrame, onMiss},
) =>
  lookup(scope, false, {
    variable,
    right: null,
    onStaticDeadHit,
    onStaticLiveHit,
    onStaticGhostHit,
    onDynamicFrame,
    onMiss,
  });

export const makeScopeWriteEffect = (
  scope,
  variable,
  right,
  {onStaticDeadHit, onStaticLiveHit, onStaticGhostHit, onDynamicFrame, onMiss},
) =>
  lookup(scope, false, {
    variable,
    right,
    onStaticDeadHit,
    onStaticLiveHit,
    onStaticGhostHit,
    onDynamicFrame,
    onMiss,
  });

/////////////////////////////
// makeScopeEvalExpression //
/////////////////////////////

const collect = generateSwitch2({
  [ROOT_SCOPE_TYPE]: (_scope, _escaped, variables) => variables,
  [DYNAMIC_SCOPE_TYPE]: ({parent}, escaped, variables) =>
    collect(parent, escaped, variables),
  [PROPERTY_SCOPE_TYPE]: ({parent}, escaped, variables) =>
    collect(parent, escaped, variables),
  [CLOSURE_SCOPE_TYPE]: ({parent}, _escaped, variables) =>
    collect(parent, true, variables),
  [STATIC_SCOPE_TYPE]: ({parent, bindings}, escaped, variables) => {
    const {length} = bindings;
    variables = concat(variables);
    for (let index = 0; index < length; index += 1) {
      const {variable, state} = bindings[index];
      if (!includes(variables, makeBaseVariable(variable))) {
        if (state !== null && escaped) {
          const {initialization, deadzone} = state;
          if (initialization !== YES && !deadzone) {
            state.deadzone = true;
          }
        }
        push(variables, makeBaseVariable(variable));
        if (state.deadzone) {
          push(variables, makeMetaVariable(variable));
        }
      }
    }
    return collect(parent, escaped, variables);
  },
});

export const makeScopeEvalExpression = (scope, expression) =>
  makeEvalExpression(collect(scope, false, []), expression);
