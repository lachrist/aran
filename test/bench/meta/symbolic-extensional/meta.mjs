import { WeakMap } from "linvail/library";
import { dir, log } from "node:console";
import { analysis_advice_global_variable } from "./bridge.mjs";

const {
  Error,
  JSON,
  Array: { from: map },
  Reflect: { defineProperty, apply, construct },
} = globalThis;

/**
 * @typedef {import("./origin.d.ts").Value} Value
 * @typedef {import("./origin.d.ts").Origin} Origin
 */

/**
 * @type {import("linvail").LinvailWeakMap<Value, Origin>}
 */
const registry = new WeakMap();

/**
 * @type {(
 *   value: Value,
 *   origin: Origin,
 * ) => Value}
 */
const register = (value, origin) => {
  if (!registry.has(value)) {
    registry.set(value, origin);
  }
  return value;
};

/**
 * @type {(
 *   value: Value,
 * ) => Origin}
 */
const fetch = (value) => {
  const origin = registry.get(value);
  if (origin == null) {
    dir({ value });
    throw new Error("Missing origin");
  }
  return origin;
};

/**
 * @type {import("aran").StandardAdvice<{
 *   Kind: import("./pointcut.js").Pointcut,
 *   StackValue: Value,
 *   ScopeValue: Value,
 *   OtherValue: Value,
 * }>}
 */
const advice = {
  "primitive@after": (_state, value, hash) =>
    register(value, { type: "literal", hash, value }),
  "intrinsic@after": (_state, name, value, hash) =>
    register(value, {
      type: "intrinsic",
      name,
      value,
      hash,
    }),
  "yield@after": (_state, _delegate, value, hash) =>
    register(value, {
      type: "await",
      hash,
      value,
    }),
  "import@after": (_state, source, specifier, value, hash) =>
    register(value, {
      type: "import",
      value,
      source,
      specifier,
      hash,
    }),
  "await@after": (_state, value, hash) =>
    register(value, {
      type: "await",
      hash,
      value,
    }),
  "closure@after": (_state, kind, value, hash) =>
    register(value, {
      type: "closure",
      kind,
      value,
      hash,
    }),
  "block@declaration": (_state, _kind, frame, hash) => {
    for (const variable in frame) {
      const value = /** @type {Value} */ (frame[variable]);
      register(value, {
        type: "initial",
        value,
        hash,
      });
    }
  },
  "apply@around": (_state, callee, that, input, hash) => {
    const result = apply(/** @type {any} */ (callee), that, input);
    return register(result, {
      type: "apply",
      value: result.inner,
      callee: fetch(callee),
      that: fetch(that),
      input: map(
        {
          // @ts-ignore
          __proto__: null,
          length: input.length,
        },
        (_item, index) => fetch(input[index]),
      ),
      hash,
    });
  },
  "program-block@after": (_state, _kind, value, _hash) => {
    log(JSON.stringify({ value, origin: registry.get(value) }, null, 2));
    return value;
  },
  "construct@around": (_state, callee, input, hash) => {
    const result = construct(/** @type {any} */ (callee), input);
    return register(result, {
      type: "construct",
      value: result.inner,
      callee: fetch(callee),
      input: map(
        {
          // @ts-ignore
          __proto__: null,
          length: input.length,
        },
        (_item, index) => fetch(input[index]),
      ),
      hash,
    });
  },
};

defineProperty(globalThis, analysis_advice_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: advice,
  enumerable: false,
  writable: false,
  configurable: false,
});
