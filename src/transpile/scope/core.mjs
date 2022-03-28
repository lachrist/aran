import {
  concat,
  forEach,
  filterOut,
  find,
  flatMap,
  reduce,
  reverse,
} from "array-lite";

import {assert, push, partial1, flip} from "../../util.mjs";

import {makeBlock, makeEvalExpression} from "../../ast/index.mjs";

import {
  makeBinding,
  makeGhostBinding,
  includesBindingVariable,
  equalsBindingVariable,
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
  undefined,
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
  depth: parent.depth + 1,
  key,
  value,
});

export const makeDynamicScope = (parent, kind, frame) => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent,
  depth: parent.depth + 1,
  kind,
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

export const makeScopeBlock = (parent, kind, labels, callback) => {
  const bindings = [];
  const statements = callback({
    type: STATIC_SCOPE_TYPE,
    parent,
    kind,
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

const generateDeclare = (fresh, bind) => (scope, kind, variable, note) => {
  while (scope.type !== ROOT_SCOPE_TYPE && scope.type !== CLOSURE_SCOPE_TYPE) {
    if (scope.type === STATIC_SCOPE_TYPE && scope.kind % kind === 0) {
      if (fresh) {
        scope.counter += 1;
        variable = `${variable}_${apply(toString, scope.depth, [
          ENCODING,
        ])}_${apply(toString, scope.counter, [ENCODING])}`;
      }
      assert(
        find(scope.bindings, partial1(equalsBindingVariable, variable)) ===
          undefined,
        "duplicate static variable declaration",
      );
      push(scope.bindings, bind(variable, note));
      return variable;
    }
    if (scope.type === DYNAMIC_SCOPE_TYPE && scope.kind % kind === 0) {
      return scope.frame;
    }
    scope = scope.parent;
  }
  throw new Error("missing binding frame");
};

export const declareVariable = generateDeclare(false, makeBinding);
export const declareFreshVariable = generateDeclare(true, makeBinding);
export const declareGhostVariable = generateDeclare(false, makeGhostBinding);

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
  kind,
  variable,
  {onDynamicFrame, ...callbacks},
) => {
  let distant = false;
  while (scope.type !== ROOT_SCOPE_TYPE && scope.type !== CLOSURE_SCOPE_TYPE) {
    if (scope.type === STATIC_SCOPE_TYPE && scope.kind % kind === 0) {
      const binding = find(
        scope.bindings,
        partial1(equalsBindingVariable, variable),
      );
      assert(binding !== null, "missing static variable for initialization");
      return makeBindingInitializeEffect(binding, distant, callbacks);
    } else if (scope.type === DYNAMIC_SCOPE_TYPE && scope.kind % kind === 0) {
      return onDynamicFrame(scope.frame);
    } else if (
      scope.type === DYNAMIC_SCOPE_TYPE ||
      scope.type === STATIC_SCOPE_TYPE
    ) {
      distant = true;
    }
    scope = scope.parent;
  }
  throw new Error("missing binding frame");
};

////////////
// lookup //
////////////

const finalizeLookup = (frames, node, onDynamicFrame) =>
  reduce(reverse(frames), flip(onDynamicFrame), node);

const generateLookup =
  (lookupBinding) =>
  (scope, kind, variable, {onMiss, onDynamicFrame, ...callbacks}) => {
    let escaped = false;
    const frames = [];
    while (scope.type !== ROOT_SCOPE_TYPE) {
      if (scope.type === DYNAMIC_SCOPE_TYPE && scope.kind % kind === 0) {
        push(frames, scope.frame);
      } else if (scope.type === CLOSURE_SCOPE_TYPE) {
        escaped = true;
      } else if (scope.type === STATIC_SCOPE_TYPE && scope.kind % kind === 0) {
        const binding = find(
          scope.bindings,
          partial1(equalsBindingVariable, variable),
        );
        if (binding !== null) {
          return finalizeLookup(
            frames,
            lookupBinding(binding, escaped, callbacks),
            onDynamicFrame,
          );
        }
      }
      scope = scope.parent;
    }
    return finalizeLookup(frames, onMiss(), onDynamicFrame);
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
      const bindings = filterOut(
        scope.bindings,
        partial1(includesBindingVariable, variables),
      );
      forEach(bindings, partial1(accessBinding, escaped));
      variables = concat(variables, flatMap(bindings, harvestBindingVariables));
    }
    scope = scope.parent;
  }
  return makeEvalExpression(variables, expression);
};
