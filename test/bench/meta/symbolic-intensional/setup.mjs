import { compileIntrinsicRecord } from "aran/runtime";
import { dir } from "node:console";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { createRuntime, toStandardAdvice } from "linvail";
import { createRegistry } from "./registry.mjs";

const {
  Error,
  Array: { from: map },
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   registry: import("./registry.js").Registry,
 *   wrapper: import("linvail").Wrapper,
 *   origin: import("./origin.js").Origin,
 * ) => import("linvail").Wrapper}
 */
const register = (registry, wrapper, origin) => {
  if (!registry.$has(wrapper)) {
    registry.$set(wrapper, origin);
  }
  return wrapper;
};

/**
 * @type {(
 *   registry: import("./registry.js").Registry,
 *   wrapper: import("linvail").Wrapper,
 * ) => import("./origin.js").Origin}
 */
const fetch = (registry, wrapper) => {
  const origin = registry.$get(wrapper);
  if (origin == null) {
    dir({ wrapper }, { showHidden: true, showProxy: true });
    throw new Error("Missing origin");
  }
  return origin;
};

/**
 * @type {(
 *   advice: import("linvail").Advice,
 * ) => import("aran").StandardAdvice<{
 *   StackValue: import("linvail").Wrapper,
 *   ScopeValue: import("linvail").Wrapper,
 *   OtherValue: import("linvail").Value,
 * }>}
 */
const compileAdvice = (advice) => {
  const {
    apply,
    construct,
    wrap,
    wrapStandardPrimitive,
    wrapFreshHostClosure,
  } = advice;
  const registry = createRegistry();
  const standard_advice = toStandardAdvice(advice);
  const internalizeFrame = standard_advice["block@declaration-overwrite"];
  return {
    .../** @type {any} */ (standard_advice),
    "primitive@after": (_state, value, hash) => {
      const fresh = wrapStandardPrimitive(value);
      registry.$set(fresh, { type: "literal", hash, value });
      return fresh;
    },
    "intrinsic@after": (_state, name, value, hash) =>
      register(registry, wrap(value), {
        type: "intrinsic",
        name,
        value,
        hash,
      }),
    "yield@after": (_state, _delegate, value, hash) =>
      register(registry, wrap(value), {
        type: "await",
        hash,
        value,
      }),
    "import@after": (_state, source, specifier, value, hash) =>
      register(registry, wrap(value), {
        type: "import",
        value,
        source,
        specifier,
        hash,
      }),
    "await@after": (_state, value, hash) =>
      register(registry, wrap(value), {
        type: "await",
        hash,
        value,
      }),
    "closure@after": (_state, kind, value, hash) =>
      register(
        registry,
        wrapFreshHostClosure(/** @type {any} */ (value), kind),
        {
          type: "closure",
          kind,
          value,
          hash,
        },
      ),
    "block@declaration-overwrite": (state, kind, raw_frame, hash) => {
      const frame = internalizeFrame(
        state,
        kind,
        /** @type {any} */ (raw_frame),
        hash,
      );
      for (const variable in frame) {
        const wrapper = /** @type {import("linvail").Wrapper} */ (
          frame[variable]
        );
        register(registry, wrapper, {
          type: "initial",
          value: wrapper.inner,
          hash,
        });
      }
      return frame;
    },
    "apply@around": (_state, callee, that, input, hash) => {
      const result = apply(callee, that, input);
      return register(registry, result, {
        type: "apply",
        value: result.inner,
        callee: fetch(registry, callee),
        that: fetch(registry, that),
        input: map(
          {
            // @ts-ignore
            __proto__: null,
            length: input.length,
          },
          (_item, index) => fetch(registry, input[index]),
        ),
        hash,
      });
    },
    "construct@around": (_state, callee, input, hash) => {
      const result = construct(callee, input);
      return register(registry, result, {
        type: "construct",
        value: result.inner,
        callee: fetch(registry, callee),
        input: map(
          {
            // @ts-ignore
            __proto__: null,
            length: input.length,
          },
          (_item, index) => fetch(registry, input[index]),
        ),
        hash,
      });
    },
  };
};

const intrinsics = compileIntrinsicRecord(globalThis);

defineProperty(globalThis, intrinsic_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: intrinsics,
  writable: false,
  enumerable: false,
  configurable: false,
});

const { advice } = createRuntime(intrinsics, {
  dir: (value) =>
    dir(value, { depth: 1 / 0, showHidden: true, showProxy: true }),
});

defineProperty(globalThis, advice_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: compileAdvice(advice),
  writable: false,
  enumerable: false,
  configurable: false,
});
