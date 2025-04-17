import { WeakMap } from "linvail/library";
import { analysis_advice_global_variable } from "./bridge.mjs";
import { compileFileRecord, serialize } from "./record.mjs";

const {
  Error,
  URL,
  Array: { from: map },
  Reflect: { defineProperty, apply, construct },
} = globalThis;

/**
 * @typedef {import("./record.js").Value} Value
 */

/**
 * @type {() => {
 *   register: (
 *     value: Value,
 *   ) => number | null,
 *   fetch: (
 *     value: Value,
 *   ) => number,
 * }}
 */
const createRegistry = () => {
  /**
   * @type {import("linvail").LinvailWeakMap<Value, number>}
   */
  const registry = new WeakMap();
  let counter = 1;
  return {
    register: (value) => {
      if (registry.has(value)) {
        return null;
      } else {
        registry.set(value, ++counter);
        return counter;
      }
    },
    fetch: (value) => {
      const index = registry.get(value);
      if (index == null) {
        throw new Error("Missing origin");
      }
      return index;
    },
  };
};

/**
 *
 * @type {(
 *   options: {
 *     register: (value: Value) => number | null,
 *     fetch: (value: Value) => number,
 *     record: import("./record.js").Record,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   Kind: import("./pointcut.js").Pointcut,
 *   StackValue: Value,
 *   ScopeValue: Value,
 *   OtherValue: Value,
 * }>}
 */
const compileAnalysisAdvice = ({ register, fetch, record }) => ({
  "primitive@after": (_state, value, hash) => {
    const index = register(value);
    if (index) {
      record("primitive", index, serialize(value), hash);
    }
    return value;
  },
  "intrinsic@after": (_state, name, value, hash) => {
    const index = register(value);
    if (index) {
      record("intrinsic", index, serialize(value), name, hash);
    }
    return value;
  },
  "yield@after": (_state, _delegate, value, hash) => {
    const index = register(value);
    if (index) {
      record("yield", index, serialize(value), hash);
    }
    return value;
  },
  "import@after": (_state, source, specifier, value, hash) => {
    const index = register(value);
    if (index) {
      record("import", index, serialize(value), source, specifier, hash);
    }
    return value;
  },
  "await@after": (_state, value, hash) => {
    const index = register(value);
    if (index) {
      record("await", index, serialize(value), hash);
    }
    return value;
  },
  "closure@after": (_state, kind, value, hash) => {
    const index = register(value);
    if (index) {
      record("closure", index, serialize(value), kind, hash);
    }
    return value;
  },
  "block@declaration": (_state, _kind, frame, hash) => {
    for (const variable in frame) {
      const value = /** @type {Value} */ (frame[variable]);
      const index = register(value);
      if (index) {
        record("initial", index, serialize(value), variable, hash);
      }
    }
  },
  "apply@around": (_state, callee, that, input, hash) => {
    const result = apply(/** @type {any} */ (callee), that, input);
    const index = register(result);
    if (index) {
      record(
        "apply",
        index,
        serialize(result),
        fetch(callee),
        fetch(that),
        map(
          {
            // @ts-ignore
            __proto__: null,
            length: input.length,
          },
          (_item, index) => fetch(input[index]),
        ),
        hash,
      );
    }
    return result;
  },
  "construct@around": (_state, callee, input, hash) => {
    const result = construct(/** @type {any} */ (callee), input);
    const index = register(result);
    if (index) {
      record(
        "construct",
        index,
        serialize(result),
        fetch(callee),
        map(
          {
            // @ts-ignore
            __proto__: null,
            length: input.length,
          },
          (_item, index) => fetch(input[index]),
        ),
        hash,
      );
    }
    return result;
  },
});

defineProperty(globalThis, analysis_advice_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: compileAnalysisAdvice({
    ...createRegistry(),
    record: compileFileRecord({
      output: new URL("./trace.jsonl", import.meta.url),
      buffer_length: 1024,
    }),
  }),
  enumerable: false,
  writable: false,
  configurable: false,
});
