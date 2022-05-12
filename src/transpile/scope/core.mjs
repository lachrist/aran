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
  partialx_,
  partial_x,
  createCounter,
} from "../../util.mjs";

import {makeBlock, makeEvalExpression} from "../../ast/index.mjs";

import {freshenVariable} from "../../variable.mjs";

import {
  makeBinding,
  makeGhostBinding,
  assertInitialization as assertBindingInitialization,
  matches as matchesBinding,
  makeInitializeEffect as makeBindingInitializeEffect,
  access as accessBinding,
  makeLookupStatementArray as makeBindingLookupStatementArray,
  makeLookupExpression as makeBindingLookupExpression,
  makeLookupEffect as makeBindingLookupEffect,
  harvestVariables as harvestBindingVariables,
  harvestStatements as harvestBindingStatements,
} from "./binding.mjs";

export {READ} from "./binding.mjs";

const {Error, undefined} = globalThis;

const ROOT_SCOPE_TYPE = "root";
const DYNAMIC_SCOPE_TYPE = "dynamic";
const STATIC_SCOPE_TYPE = "static";
const PROPERTY_SCOPE_TYPE = "property";
const CLOSURE_SCOPE_TYPE = "closure";

const getBindingScope = (scope) => {
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === STATIC_SCOPE_TYPE || scope.type === DYNAMIC_SCOPE_TYPE) {
      return scope;
    }
    assert(
      scope.type !== CLOSURE_SCOPE_TYPE,
      "binding scope should not be outside of closure",
    );
    scope = scope.parent;
  }
  return scope;
};

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

export const makeDynamicScope = (parent, extrinsic) => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent,
  depth: parent.depth + 1,
  extrinsic,
});

export const makeStaticScope = (parent) => ({
  type: STATIC_SCOPE_TYPE,
  parent,
  bindings: [],
  depth: parent.depth + 1,
  counter: createCounter(),
});

export const makeScopeBlock = (scope, labels, statements) => {
  while (scope.type === PROPERTY_SCOPE_TYPE) {
    scope = scope.parent;
  }
  assert(
    scope.type === STATIC_SCOPE_TYPE,
    "expected static scope for creating block",
  );
  const {bindings} = scope;
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
// isBound //
/////////////

export const isBound = (scope) =>
  getBindingScope(scope).type !== ROOT_SCOPE_TYPE;

const generateIsBound = (type) => (scope) =>
  getBindingScope(scope).type === type;

export const isStaticallyBound = generateIsBound(STATIC_SCOPE_TYPE);

export const isDynamicallyBound = generateIsBound(DYNAMIC_SCOPE_TYPE);

////////////////////////////////
// getBindingDynamicExtrinsic //
////////////////////////////////

export const getBindingDynamicExtrinsic = (scope) => {
  scope = getBindingScope(scope);
  assert(scope.type === DYNAMIC_SCOPE_TYPE, "expected dynamic scope type");
  return scope.extrinsic;
};

/////////////
// declare //
/////////////

export const generateDeclareStatic =
  (bind, transformVariable) => (scope, variable, note) => {
    scope = getBindingScope(scope);
    assert(
      scope.type === STATIC_SCOPE_TYPE,
      "expected a statically bound scope",
    );
    variable = transformVariable(variable, scope.depth, scope.counter);
    assert(
      find(scope.bindings, partial_x(matchesBinding, variable)) === undefined,
      "duplicate static variable declaration",
    );
    push(scope.bindings, bind(variable, note));
    return variable;
  };

export const declareVariable = generateDeclareStatic(makeBinding, returnFirst);
export const declareGhostVariable = generateDeclareStatic(
  makeGhostBinding,
  returnFirst,
);
export const declareFreshVariable = generateDeclareStatic(
  makeBinding,
  freshenVariable,
);

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

export const makeInitializeEffect = (scope, variable, expression) => {
  const predicate = partial_x(matchesBinding, variable);
  let distant = false;
  let binding = undefined;
  while (binding === undefined) {
    scope = getBindingScope(scope);
    assert(scope.type === STATIC_SCOPE_TYPE, "expected static scope type");
    binding = find(scope.bindings, predicate);
    if (binding === undefined) {
      distant = true;
      scope = scope.parent;
    }
  }
  return makeBindingInitializeEffect(binding, distant, expression);
};

////////////
// lookup //
////////////

const finalizeLookup = (extrinsics, node, onDynamicExtrinsic) =>
  reduce(reverse(extrinsics), onDynamicExtrinsic, node);

const generateLookup =
  (makeBindingLookupNode) =>
  (
    scope,
    variable,
    right,
    {onStaticMiss, onDynamicExtrinsic, ...callbacks},
  ) => {
    let escaped = false;
    const predicate = partial_x(matchesBinding, variable);
    const extrinsics = [];
    while (scope.type !== ROOT_SCOPE_TYPE) {
      if (scope.type === DYNAMIC_SCOPE_TYPE) {
        push(extrinsics, scope.extrinsic);
      } else if (scope.type === CLOSURE_SCOPE_TYPE) {
        escaped = true;
      } else if (scope.type === STATIC_SCOPE_TYPE) {
        const binding = find(scope.bindings, predicate);
        if (binding !== undefined) {
          return finalizeLookup(
            extrinsics,
            makeBindingLookupNode(binding, escaped, right, callbacks),
            onDynamicExtrinsic,
          );
        }
      }
      scope = scope.parent;
    }
    return finalizeLookup(extrinsics, onStaticMiss(), onDynamicExtrinsic);
  };

export const makeLookupExpression = generateLookup(makeBindingLookupExpression);

export const makeLookupEffect = generateLookup(makeBindingLookupEffect);

export const makeLookupStatementArray = generateLookup(
  makeBindingLookupStatementArray,
);

//////////
// eval //
//////////

const includesBindingVariable = (binding, variables) =>
  some(variables, partialx_(matchesBinding, binding));

export const makeScopeEvalExpression = (scope, expression) => {
  let variables = [];
  let escaped = false;
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === CLOSURE_SCOPE_TYPE) {
      escaped = true;
    } else if (scope.type === STATIC_SCOPE_TYPE) {
      const bindings = filterOut(
        scope.bindings,
        partial_x(includesBindingVariable, variables),
      );
      forEach(bindings, partial_x(accessBinding, escaped));
      variables = concat(variables, flatMap(bindings, harvestBindingVariables));
    }
    scope = scope.parent;
  }
  return makeEvalExpression(variables, expression);
};
