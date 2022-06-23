import {partial_x, partial_xx, incrementCounter} from "../../util/index.mjs";

import {ROOT_SCOPE, defineScopeBinding, lookupScopeBinding} from "./core.mjs";

////////////
// Strict //
////////////

const STRICT = "strict";

export const isStrictScope = partial_x(lookupScopeBinding, STRICT);

export const useStrictScope = partial_xx(defineScopeBinding, STRICT, true);

////////////////////
// Global Counter //
////////////////////

const STATE = "state";

export const incrementScopeCounter = (scope) =>
  incrementCounter(lookupScopeBinding(scope, STATE).counter);

export const resetScopeCounter = (scope, counter) => {
  lookupScopeBinding(scope, STATE).counter = counter;
};

//////////
// Root //
//////////

export const createRootScope = (counter) =>
  defineScopeBinding(
    defineScopeBinding(ROOT_SCOPE, STATE, {counter}),
    STRICT,
    false,
  );
