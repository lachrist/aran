import { compileIntrinsicRecord } from "aran/runtime";
import { dir } from "node:console";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { createRuntime, toStandardAdvice } from "linvail";
import { compileFileRecord, serialize } from "./record.mjs";

const {
  URL,
  Array: { from: map },
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   intrinsics: import("aran").IntrinsicRecord,
 * ) => {
 *   getIndex: (
 *     wrapper: import("linvail").Wrapper,
 *   ) => number,
 *   getFreshIndex: (
 *     wrapper: import("linvail").Wrapper,
 *   ) => number | null,
 *   advice: import("linvail").Advice,
 * }}
 */
const compileProvenanceAdvice = (intrinsics) => {
  let counter = 1;
  const { advice } = createRuntime(intrinsics, {
    dir: (value) =>
      dir(value, { depth: 1 / 0, showHidden: true, showProxy: true }),
    wrapPrimitive: (primitive) => ({
      type: "primitive",
      inner: primitive,
      index: ++counter,
    }),
    wrapGuestReference: (guest, apply, construct) => ({
      type: "guest",
      inner: guest,
      index: ++counter,
      apply,
      construct,
    }),
    wrapHostReference: (host, kind) => ({
      type: "host",
      kind,
      plain: host,
      inner: null,
      index: ++counter,
    }),
  });
  return {
    advice,
    getIndex: /** @type {(wrapper: any) => number} */ (({ index }) => index),
    getFreshIndex: /** @type {(wrapper: any) => null | number} */ (
      ({ index }) => (index === counter ? index : null)
    ),
  };
};

/**
 * @type {(
 *   options: {
 *     advice: import("linvail").Advice,
 *     getIndex: (
 *       wrapper: import("linvail").Wrapper,
 *     ) => number,
 *     getFreshIndex: (
 *       wrapper: import("linvail").Wrapper,
 *     ) => number | null,
 *     record: import("./record.d.ts").Record,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   StackValue: import("linvail").Wrapper,
 *   ScopeValue: import("linvail").Wrapper,
 *   OtherValue: import("linvail").Value,
 * }>}
 */
const compileAnalysisAdvice = ({ advice, getIndex, getFreshIndex, record }) => {
  const {
    apply,
    construct,
    wrap,
    wrapStandardPrimitive,
    wrapFreshHostClosure,
  } = advice;
  const standard_advice = toStandardAdvice(advice);
  const internalizeFrame = standard_advice["block@declaration-overwrite"];
  return {
    .../** @type {any} */ (standard_advice),
    "primitive@after": (_state, value, hash) => {
      const wrapper = wrapStandardPrimitive(value);
      record("primitive", getIndex(wrapper), serialize(wrapper.inner), hash);
      return wrapper;
    },
    "intrinsic@after": (_state, name, value, hash) => {
      const wrapper = wrap(value);
      const index = getFreshIndex(wrapper);
      if (index) {
        record("intrinsic", index, serialize(wrapper.inner), name, hash);
      }
      return wrapper;
    },
    "yield@after": (_state, _delegate, value, hash) => {
      const wrapper = wrap(value);
      const index = getFreshIndex(wrapper);
      if (index) {
        record("yield", index, serialize(wrapper.inner), hash);
      }
      return wrapper;
    },
    "import@after": (_state, source, specifier, value, hash) => {
      const wrapper = wrap(value);
      const index = getFreshIndex(wrapper);
      if (index) {
        record(
          "import",
          index,
          serialize(wrapper.inner),
          source,
          specifier,
          hash,
        );
      }
      return wrapper;
    },
    "await@after": (_state, value, hash) => {
      const wrapper = wrap(value);
      const index = getFreshIndex(wrapper);
      if (index) {
        record("await", index, serialize(wrapper.inner), hash);
      }
      return wrapper;
    },
    "closure@after": (_state, kind, value, hash) => {
      const wrapper = wrapFreshHostClosure(/** @type {any} */ (value), kind);
      const { index } = /** @type {any} */ (wrapper);
      record("closure", index, serialize(wrapper.inner), kind, hash);
      return wrapper;
    },
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
        const index = getFreshIndex(wrapper);
        if (index) {
          record("initial", index, serialize(wrapper.inner), variable, hash);
        }
      }
      return frame;
    },
    "apply@around": (_state, callee, that, input, hash) => {
      const wrapper = apply(callee, that, input);
      const index = getFreshIndex(wrapper);
      if (index) {
        record(
          "apply",
          index,
          serialize(wrapper.inner),
          getIndex(callee),
          getIndex(that),
          map(
            {
              // @ts-ignore
              __proto__: null,
              length: input.length,
            },
            (_item, index) => getIndex(input[index]),
          ),
          hash,
        );
      }
      return wrapper;
    },
    "construct@around": (_state, callee, input, hash) => {
      const wrapper = construct(callee, input);
      const index = getFreshIndex(wrapper);
      if (index) {
        record(
          "construct",
          index,
          serialize(wrapper.inner),
          getIndex(callee),
          map(
            {
              // @ts-ignore
              __proto__: null,
              length: input.length,
            },
            (_item, index) => getIndex(input[index]),
          ),
          hash,
        );
      }
      return wrapper;
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

defineProperty(globalThis, advice_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: compileAnalysisAdvice({
    ...compileProvenanceAdvice(intrinsics),
    record: compileFileRecord({
      output: new URL("./trace.jsonl", import.meta.url),
      buffer_length: 1024,
    }),
  }),
  writable: false,
  enumerable: false,
  configurable: false,
});
