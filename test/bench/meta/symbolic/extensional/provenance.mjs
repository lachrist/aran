import { compileIntrinsicRecord } from "aran/runtime";
import { dir } from "node:console";
import {
  intrinsic_global_variable,
  provenance_advice_global_variable,
} from "./bridge.mjs";
import { setupRuntime } from "linvail";

const {
  Reflect: { defineProperty },
} = globalThis;

export const setupProvenance = () => {
  const intrinsics = compileIntrinsicRecord(globalThis);
  const advice = setupRuntime(intrinsics, {
    dir: (value) => dir(value, { depth: 3, showHidden: true, showProxy: true }),
  });
  defineProperty(globalThis, intrinsic_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: intrinsics,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  defineProperty(globalThis, provenance_advice_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: advice,
    writable: false,
    enumerable: false,
    configurable: false,
  });
};
