import { compileIntrinsicRecord } from "aran/runtime";
import { dir } from "node:console";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { createRuntime } from "linvail";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   global_scope: "internal" | "external",
 * ) => void}
 */
export const setup = (global_scope) => {
  const intrinsics = compileIntrinsicRecord(globalThis);
  const { advice } = createRuntime(intrinsics, {
    dir: (value) =>
      dir(value, { depth: 1 / 0, showHidden: true, showProxy: true }),
  });
  if (global_scope === "internal") {
    const { toHostReferenceWrapper } = advice;
    {
      const wrapper = toHostReferenceWrapper(
        /** @type {any} */ (intrinsics.globalThis),
        { prototype: "Object.prototype" },
      );
      intrinsics.globalThis = /** @type {any} */ (wrapper.inner);
      intrinsics["aran.global_object"] = /** @type {any} */ (wrapper.inner);
    }
    {
      const wrapper = toHostReferenceWrapper(
        /** @type {any} */ (intrinsics["aran.global_declarative_record"]),
        { prototype: "none" },
      );
      intrinsics["aran.global_declarative_record"] = /** @type {any} */ (
        wrapper.inner
      );
    }
  }
  defineProperty(globalThis, intrinsic_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: intrinsics,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  defineProperty(globalThis, advice_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: advice,
    writable: false,
    enumerable: false,
    configurable: false,
  });
};
