
export const makeProperty = (parent, key, value) => ({
  type: PROPERTY_SCOPE_TYPE,
  parent,
  key,
  value,
});

export const lookupProperty = (scope, key) => {
  while (scope.type !== ROOT_SCOPE_TYPE) {
    if (scope.type === PROPERTY_SCOPE_TYPE && scope.key === key) {
      return scope.value;
    }
    scope = scope.parent;
  }
  throw new Error("missing scope property");
};

////////////
// Strict //
////////////

const STRICT = "strict";

export const isStrict = partial_x(lookupProperty, STRICT);

export const useStrict = partial_xx(makePropertyScope, STRICT, true);

////////////////////
// Global Counter //
////////////////////

const GLOBAL_COUNTER = "global-counter";

export const initializeGlobalCounter = (scope) =>
  makePropertyScope(scope, GLOBAL_COUNTER, createCounter(0));

export const incrementGlobalCounter = (scope) =>
  incrementCounter(lookupScopeProperty(scope, GLOBAL_COUNTER);

export const restoreGlobalCounter = (scope, value1) => {
  const counter = lookupScopeProperty(scope, GLOBAL_COUNTER);
  let value2 = incrementCounter(counter);
  while (value2 <= value1) {
    value2 = incrementCounter(counter);
  }
};
