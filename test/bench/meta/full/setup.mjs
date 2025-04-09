import { compileIntrinsicRecord } from "aran/runtime";
import { intrinsic_global_variable } from "./bridge.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

const descriptor = {
  __proto__: null,
  value: compileIntrinsicRecord(globalThis),
  writable: false,
  enumerable: false,
  configurable: false,
};

defineProperty(globalThis, intrinsic_global_variable, descriptor);
