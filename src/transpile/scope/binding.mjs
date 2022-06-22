import {partial_x, partial_xx, incrementCounter} from "../../util/index.mjs";

import {ROOT, defineBinding, lookupBinding} from "./core.mjs";

////////////
// Strict //
////////////

const STRICT = "strict";

export const isStrict = partial_x(lookupBinding, STRICT);

export const useStrict = partial_xx(defineBinding, STRICT, true);

////////////////////
// Global Counter //
////////////////////

const STATE = "state";

export const incrementGlobalCounter = (scope) =>
  incrementCounter(lookupBinding(scope, STATE).counter);

export const resetGlobalCounter = (scope, counter) => {
  lookupBinding(scope, STATE).counter = counter;
};

//////////
// Root //
//////////

export const createRoot = (counter) =>
  defineBinding(defineBinding(ROOT, STATE, {counter}), STRICT, false);
