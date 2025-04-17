import { compileIntrinsicRecord } from "aran/runtime";
import { dir } from "node:console";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { setupRuntime } from "linvail";

const {
  Reflect: { defineProperty },
} = globalThis;

const intrinsics = compileIntrinsicRecord(globalThis);

defineProperty(globalThis, intrinsic_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: intrinsics,
  writable: false,
  enumerable: false,
  configurable: false,
});

const runtime = setupRuntime(intrinsics, {
  dir: (value) =>
    dir(value, { depth: 1 / 0, showHidden: true, showProxy: true }),
});

defineProperty(globalThis, advice_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: runtime,
  writable: false,
  enumerable: false,
  configurable: false,
});
