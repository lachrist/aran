import {concat, forEach, flatMap, reduce, reverse} from "array-lite";

import {
  assert,
  push,
  makeCurry,
  callCurry,
  findCurry,
  filterOutCurry,
  forEachCurry,
} from "../../util.mjs";

import {makeBlock, makeEvalExpression} from "../../ast/index.mjs";

import {
  makeBinding,
  makeGhostBinding,
  includesBindingVariable,
  equalsBindingVariable,
  annotateBinding,
  makeBindingInitializeEffect,
  accessBinding,
  makeBindingLookupExpression,
  makeBindingLookupEffect,
  assertBindingInitialization,
  harvestBindingVariables,
  harvestBindingStatements,
} from "./binding.mjs";

const {
  Error,
  Reflect: {apply},
  Number: {
    prototype: {toString},
  },
} = globalThis;

const ENCODING = [36];

const ROOT_SCOPE_TYPE = "root";
const DYNAMIC_SCOPE_TYPE = "dynamic";
const STATIC_SCOPE_TYPE = "static";
const PROPERTY_SCOPE_TYPE = "property";
const CLOSURE_SCOPE_TYPE = "closure";

////////////
// Extend //
////////////

export const makeRootScope = () => ({
  type: ROOT_SCOPE_TYPE,
  depth: 0,
});

export const makeClosureScope = (parent) => ({
  type: CLOSURE_SCOPE_TYPE,
  parent,
  depth: parent.depth + 1,
});

export const makePropertyScope = (parent, key, value) => ({
  type: PROPERTY_SCOPE_TYPE,
  parent,
  key,
  value,
  depth: parent.depth + 1,
});

export const makeDynamicScope = (parent, frame) => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent,
  frame,
  depth: parent.depth + 1,
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
  const statements = callCurry(curry, {
    type: STATIC_SCOPE_TYPE,
    parent,
    bindings,
    depth: parent.depth + 1,
    counter: 0,
  });
  forEach(bindings, assertBindingInitialization);
  return makeBlock(
    labels,
    flatMap(bindings, harvestBindingVariables),
    concat(flatMap(bindings, harvestBindingStatements), statements),
  );
};

/////////////////////////
// lookupScopeProperty //
/////////////////////////

export const lookupScopeProperty = (scope, key) => {
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === PROPERTY_SCOPE_TYPE && scope.key === key) {
      return scope.value;
    }
    scope = scope.parent;
  }
  throw new Error("missing scope property");
};

/////////////
// Declare //
/////////////

const generateDeclare = (bind, fresh) => (scope, variable) => {
  while (scope.type === PROPERTY_SCOPE_TYPE) {
    scope = scope.parent;
  }
  if (scope.type === STATIC_SCOPE_TYPE) {
    if (fresh) {
      scope.counter += 1;
      variable = `${variable}_${apply(toString, scope.depth, [
        ENCODING,
      ])}_${apply(toString, scope.counter, [ENCODING])}`;
    }
    assert(
      findCurry(scope.bindings, makeCurry(equalsBindingVariable, variable)) ===
        null,
      "duplicate static variable declaration",
    );
    push(scope.bindings, bind(variable));
    return variable;
  } else if (scope.type === DYNAMIC_SCOPE_TYPE) {
    return scope.frame;
  } else {
    throw new Error("unexpected scope during variable declaration");
  }
};

export const declareVariable = generateDeclare(makeBinding, false);
export const declareGhostVariable = generateDeclare(makeGhostBinding, false);
export const declareFreshVariable = generateDeclare(makeBinding, true);

//////////
// Note //
//////////

export const annotateVariable = (scope, variable, note) => {
  while (scope.type === PROPERTY_SCOPE_TYPE) {
    scope = scope.parent;
  }
  assert(
    scope.type === STATIC_SCOPE_TYPE,
    "unexpected scope during variable annotation",
  );
  const {bindings} = scope;
  const binding = findCurry(
    bindings,
    makeCurry(equalsBindingVariable, variable),
  );
  assert(binding !== null, "missing binding for variable annotation");
  annotateBinding(binding, note);
};

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

export const makeInitializeEffect = (
  scope,
  variable,
  {onMiss, onDynamicFrame, ...curries},
) => {
  let distant = false;
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === DYNAMIC_SCOPE_TYPE) {
      return callCurry(onDynamicFrame, scope.frame);
    } else if (scope.type === STATIC_SCOPE_TYPE) {
      const binding = findCurry(
        scope.bindings,
        makeCurry(equalsBindingVariable, variable),
      );
      if (binding === null) {
        distant = true;
      } else {
        return makeBindingInitializeEffect(binding, distant, curries);
      }
    } else {
      assert(
        scope.type === PROPERTY_SCOPE_TYPE,
        "unexpected scope type during variable initialization",
      );
    }
    scope = scope.parent;
  }
  return callCurry(onMiss);
};

////////////
// lookup //
////////////

const finalizeLookup = (frames, node, onDynamicFrame) =>
  reduce(
    reverse(frames),
    (result, frame) => callCurry(onDynamicFrame, frame, result),
    node,
  );

const generateLookup =
  (lookupBinding) =>
  (scope, variable, {onMiss, onDynamicFrame, ...curries}) => {
    let escaped = false;
    const frames = [];
    while (scope.type !== ROOT_SCOPE_TYPE) {
      if (scope.type === DYNAMIC_SCOPE_TYPE) {
        push(frames, scope.frame);
      } else if (scope.type === CLOSURE_SCOPE_TYPE) {
        escaped = true;
      } else if (scope.type === STATIC_SCOPE_TYPE) {
        const binding = findCurry(
          scope.bindings,
          makeCurry(equalsBindingVariable, variable),
        );
        if (binding !== null) {
          return finalizeLookup(
            frames,
            lookupBinding(binding, escaped, curries),
            onDynamicFrame,
          );
        }
      }
      scope = scope.parent;
    }
    return finalizeLookup(frames, callCurry(onMiss), onDynamicFrame);
  };

export const makeLookupExpression = generateLookup(makeBindingLookupExpression);
export const makeLookupEffect = generateLookup(makeBindingLookupEffect);

//////////
// eval //
//////////

export const makeScopeEvalExpression = (scope, expression) => {
  let variables = [];
  let escaped = false;
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === CLOSURE_SCOPE_TYPE) {
      escaped = true;
    } else if (scope.type === STATIC_SCOPE_TYPE) {
      const bindings = filterOutCurry(
        scope.bindings,
        makeCurry(includesBindingVariable, variables),
      );
      forEachCurry(bindings, makeCurry(accessBinding, escaped));
      variables = concat(variables, flatMap(bindings, harvestBindingVariables));
    }
    scope = scope.parent;
  }
  return makeEvalExpression(variables, expression);
};
