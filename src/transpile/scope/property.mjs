
import {ROOT, set, get} from "./list.mjs";

////////////
// Strict //
////////////

const STRICT = "strict";

export const isStrict = partial_x(get, STRICT);

export const useStrict = partial_xx(set, STRICT, true);

////////////////////
// Global Counter //
////////////////////

const GLOBAL_COUNTER = "global-counter";

export const incrementGlobalCounter = (scope) =>
  incrementCounter(get(scope, GLOBAL_COUNTER);

export const restoreGlobalCounter = (scope, value1) => {
  const counter = get(scope, GLOBAL_COUNTER);
  let value2 = incrementCounter(counter);
  while (value2 <= value1) {
    value2 = incrementCounter(counter);
  }
};

//////////
// Root //
//////////

export const createRoot = (value) => set(
  set(ROOT, GLOBAL_COUNTER, createCounter(value)),
  STRICT,
  false,
);
