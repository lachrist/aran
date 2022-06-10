import {partial_x, partial_xx, incrementCounter} from "../../util/index.mjs";

import {ROOT, define, search} from "./structure.mjs";

////////////
// Strict //
////////////

const STRICT = "strict";

export const isStrict = partial_x(search, STRICT);

export const useStrict = partial_xx(define, STRICT, true);

////////////////////
// Global Counter //
////////////////////

const STATE = "state";

export const incrementGlobalCounter = (scope) =>
  incrementCounter(search(scope, STATE).counter);

export const resetGlobalCounter = (scope, counter) => {
  search(scope, STATE).counter = counter;
};

//////////
// Root //
//////////

export const createRoot = (counter) =>
  define(define(ROOT, STATE, {counter}), STRICT, false);
