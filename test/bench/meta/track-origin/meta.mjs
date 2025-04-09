import {
  createTrackOriginAdvice,
  ADVICE_GLOBAL_VARIABLE,
} from "../../../aspects/track-origin.mjs";

const {
  Reflect,
  Reflect: { defineProperty },
} = globalThis;

const descriptor = {
  __proto__: null,
  value: createTrackOriginAdvice(
    /** @type {{apply: any, construct: any}} */ (Reflect),
  ),
  writable: false,
  enumerable: false,
  configurable: false,
};

defineProperty(globalThis, ADVICE_GLOBAL_VARIABLE, descriptor);
