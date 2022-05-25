import {
  partial_x,
  partial_xx,
  resetCounter,
  createCounter,
  incrementCounter,
} from "../../util/index.mjs";

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

const GLOBAL_COUNTER = "global-counter";

export const incrementGlobalCounter = (scope) =>
  incrementCounter(search(scope, GLOBAL_COUNTER));

export const resetGlobalCounter = (scope, value) => {
  resetCounter(search(scope, GLOBAL_COUNTER), value);
};

//////////
// Root //
//////////

export const createRoot = (value) =>
  define(define(ROOT, GLOBAL_COUNTER, createCounter(value)), STRICT, false);
