import {
  concat,
  forEach,
  filterOut,
  find,
  flatMap,
  reduce,
  reverse,
  some,
} from "array-lite";

import {
  returnFirst,
  assert,
  push,
  partial1,
  flip,
  createCounter,
} from "../../util.mjs";

import {makeBlock, makeEvalExpression} from "../../ast/index.mjs";

import {freshenVariable} from "../../variable.mjs";

import {
  makeBinding,
  equalsBindingVariable,
  makeBindingInitializeEffect,
  accessBinding,
  makeBindingLookupExpression,
  makeBindingLookupEffect,
  harvestBindingVariables,
  harvestBindingStatements,
} from "./binding.mjs";

const {Error, undefined} = globalThis;

const ROOT_SCOPE_TYPE = "root";
const DYNAMIC_SCOPE_TYPE = "dynamic";
const STATIC_SCOPE_TYPE = "static";
const PROPERTY_SCOPE_TYPE = "property";
const CLOSURE_SCOPE_TYPE = "closure";

const getBindingScope = (scope, kind) => {
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === STATIC_SCOPE_TYPE || scope.type === DYNAMIC_SCOPE_TYPE) {
      if (scope.kind % kind === 0) {
        return scope;
      }
    }
    assert(
      scope.type !== CLOSURE_SCOPE_TYPE,
      "binding scope should not be outside of closure",
    );
    scope = scope.parent;
  }
  return scope;
};

const isBindingScopeDistant = (scope, kind) => {
  while (scope.type === PROPERTY_SCOPE_TYPE) {
    scope = scope.parent;
  }
  assert(
    scope.type !== CLOSURE_SCOPE_TYPE,
    "binding scope should not be outside of closure",
  );
  return !(scope.type === ROOT_SCOPE_TYPE || scope.kind % kind === 0);
};

////////////
// Extend //
////////////

export const makeRootScope = (root) => ({
  type: ROOT_SCOPE_TYPE,
  depth: 0,
  root,
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

export const makeWildcardScope = (parent, kind, wildcard) => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent,
  depth: parent.depth + 1,
  kind,
  wildcard,
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
    counter: createCounter(),
  });
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
// isBound //
/////////////

const generateIsBound = (type) => (scope, kind) =>
  getBindingScope(scope, kind).type === type;

export const isWildcardBound = generateIsBound(DYNAMIC_SCOPE_TYPE);
export const isRootBound = generateIsBound(ROOT_SCOPE_TYPE);

////////////////
// getBinding //
////////////////

export const getBindingWildcard = (scope, kind) => {
  scope = getBindingScope(scope, kind);
  assert(scope.type === DYNAMIC_SCOPE_TYPE, "unexpected binding scope type");
  return scope.wildcard;
};

export const getRoot = (scope) => {
  while (scope.type !== ROOT_SCOPE_TYPE) {
    scope = scope.parent;
  }
  return scope.root;
};

export const setRoot = (scope, root) => {
  while (scope.type !== ROOT_SCOPE_TYPE) {
    scope = scope.parent;
  }
  scope.root = root;
};

/////////////
// declare //
/////////////

export const generateDeclareStatic =
  (transformVariable) => (scope, kind, variable, note) => {
    scope = getBindingScope(scope, kind);
    assert(
      scope.type === STATIC_SCOPE_TYPE,
      "expected a statically bound variable",
    );
    variable = transformVariable(variable, scope.depth, scope.counter);
    assert(
      find(scope.bindings, partial1(flip(equalsBindingVariable), variable)) ===
        undefined,
      "duplicate static variable declaration",
    );
    push(scope.bindings, makeBinding(variable, note));
    return variable;
  };

export const declareVariable = generateDeclareStatic(returnFirst);
export const declareFreshVariable = generateDeclareStatic(freshenVariable);

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

export const makeInitializeEffect = (scope, kind, variable, expression) => {
  const distant = isBindingScopeDistant(scope, kind);
  scope = getBindingScope(scope, kind);
  assert(scope.type === STATIC_SCOPE_TYPE);
  const binding = find(
    scope.bindings,
    partial1(flip(equalsBindingVariable), variable),
  );
  assert(binding !== undefined, "missing static variable for initialization");
  return makeBindingInitializeEffect(binding, distant, expression);
};

////////////
// lookup //
////////////

const finalizeLookup = (wildcards, node, onWildcard) =>
  reduce(reverse(wildcards), flip(onWildcard), node);

const generateLookup =
  (lookupBinding) =>
  (scope, variable, {onRoot, onWildcard, ...callbacks}) => {
    let escaped = false;
    const wildcards = [];
    while (scope.type !== ROOT_SCOPE_TYPE) {
      if (scope.type === DYNAMIC_SCOPE_TYPE) {
        push(wildcards, scope.wildcard);
      } else if (scope.type === CLOSURE_SCOPE_TYPE) {
        escaped = true;
      } else if (scope.type === STATIC_SCOPE_TYPE) {
        const binding = find(
          scope.bindings,
          partial1(flip(equalsBindingVariable), variable),
        );
        if (binding !== null) {
          return finalizeLookup(
            wildcards,
            lookupBinding(binding, escaped, callbacks),
            onWildcard,
          );
        }
      }
      scope = scope.parent;
    }
    return finalizeLookup(wildcards, onRoot(), onWildcard);
  };

export const makeLookupExpression = generateLookup(makeBindingLookupExpression);
export const makeLookupEffect = generateLookup(makeBindingLookupEffect);

//////////
// eval //
//////////

const includesBindingVariable = (variables, binding) =>
  some(variables, partial1(equalsBindingVariable, binding));

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
