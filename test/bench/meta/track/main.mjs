import { compileIntrinsicRecord } from "aran/runtime";
import { intrinsic_global_variable } from "./bridge.mjs";
import {
  createTrackOriginAdvice,
  ADVICE_GLOBAL_VARIABLE,
} from "../../../aspects/track-origin.mjs";

const {
  Reflect,
  Reflect: { defineProperty },
} = globalThis;

defineProperty(globalThis, intrinsic_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: compileIntrinsicRecord(globalThis),
  writable: false,
  enumerable: false,
  configurable: false,
});

defineProperty(globalThis, ADVICE_GLOBAL_VARIABLE, {
  // @ts-ignore
  __proto__: null,
  value: createTrackOriginAdvice(
    /** @type {{apply: any, construct: any}} */ (Reflect),
  ),
  writable: false,
  enumerable: false,
  configurable: false,
});
