import { dir, log } from "node:console";
import { createRuntime, toStandardAdvice } from "linvail/runtime";
import { isStandardPrimitive } from "./primitive.mjs";
import { compileIntrinsicRecord } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./globals.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   primitive: import("linvail").Primitive,
 * ) => {
 *   type: "primitive",
 *   inner: import("linvail").Primitive,
 *   prov: 0,
 * }}
 */
const wrapPrimitive = (primitive) => ({
  type: "primitive",
  inner: primitive,
  prov: 0,
});

/**
 * @type {<G, A, C>(
 *   guest: G,
 *   apply: A,
 *   construct: C,
 * ) => {
 *   type: "guest",
 *   inner: G,
 *   apply: A,
 *   construct: C,
 *   prov: 0,
 * }}
 */
const wrapGuestReference = (guest, apply, construct) => ({
  type: "guest",
  inner: guest,
  apply,
  construct,
  prov: 0,
});

/**
 * @type {<H, K>(
 *   host: H,
 *   kind: K,
 * ) => {
 *   type: "host",
 *   inner: null,
 *   kind: K,
 *   plain: H,
 *   prov: 0,
 * }}
 */
const wrapHostReference = (host, kind) => ({
  type: "host",
  inner: null,
  kind,
  plain: host,
  prov: 0,
});

/**
 * @type {(
 *   config: {
 *     dir: (value: unknown) => void,
 *     internalize_global_scope: boolean,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       prov: number,
 *       tag: import("./location.d.ts").NodeHash,
 *     ) => void,
 *     intrinsics: import("aran").IntrinsicRecord,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: null,
 *   Tag: import("./location.d.ts").NodeHash,
 *   ScopeValue: import("linvail").Wrapper,
 *   StackValue: import("linvail").Wrapper,
 *   OtherValue: import("linvail").Wrapper | import("linvail").Value,
 * }>}
 */
const createAdvice = ({
  dir,
  internalize_global_scope,
  recordBranch,
  intrinsics,
}) => {
  const { advice } = createRuntime(intrinsics, {
    dir,
    wrapPrimitive,
    wrapGuestReference,
    wrapHostReference,
  });
  const { apply, construct, wrap } = advice;
  if (internalize_global_scope) {
    const { toHostReferenceWrapper } = advice;
    /** @type {import("linvail").GuestReference} */
    const plain_external_global = /** @type {any} */ (intrinsics.globalThis);
    const plain_internal_global = toHostReferenceWrapper(
      plain_external_global,
      { prototype: "Object.prototype" },
    );
    const external_global = plain_internal_global.inner;
    intrinsics.globalThis = /** @type {any} */ (external_global);
    intrinsics["aran.global_object"] = /** @type {any} */ (external_global);
    intrinsics["aran.global_declarative_record"] = /** @type {any} */ (
      toHostReferenceWrapper(
        /** @type {any} */ (intrinsics["aran.global_declarative_record"]),
        { prototype: "none" },
      ).inner
    );
  }
  return {
    ...toStandardAdvice(advice),
    "primitive@after": (_state, value, _tag) => ({
      type: "primitive",
      inner: value,
      prov: 1,
    }),
    "intrinsic@after": (_state, _name, value, _tag) => {
      if (isStandardPrimitive(value)) {
        return {
          type: "primitive",
          inner: value,
          prov: 1,
        };
      } else {
        return wrap(/** @type {import("linvail").Value} */ (value));
      }
    },
    "test@before": (_state, kind, value, tag) => {
      recordBranch(kind, /** @type {any} */ (value).prov, tag);
      return value.inner;
    },
    "apply@around": (_state, callee, that, input, _tag) => {
      const result = apply(callee, that, input);
      if (isStandardPrimitive(result.inner)) {
        let prov = 1;
        prov += /** @type {any} */ (result).prov;
        prov += /** @type {any} */ (callee).prov;
        prov += /** @type {any} */ (that).prov;
        const { length } = input;
        for (let index = 0; index < length; index++) {
          prov += /** @type {any} */ (input[index]).prov;
        }
        return {
          type: "primitive",
          inner: result.inner,
          prov,
        };
      } else {
        return result;
      }
    },
    "construct@around": (_state, callee, input, _tag) =>
      construct(callee, input),
  };
};

/**
 * @type {(
 *   config: {
 *     internalize_global_scope: boolean,
 *   },
 * ) => void}
 */
export const setup = ({ internalize_global_scope }) => {
  const intrinsics = compileIntrinsicRecord(globalThis);
  const advice = createAdvice({
    dir: (value) => {
      dir(value, { showProxy: true, showHidden: true });
    },
    internalize_global_scope,
    recordBranch: log,
    intrinsics,
  });
  defineProperty(globalThis, intrinsic_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: intrinsics,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  defineProperty(globalThis, advice_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: advice,
    enumerable: false,
    writable: false,
    configurable: false,
  });
};
