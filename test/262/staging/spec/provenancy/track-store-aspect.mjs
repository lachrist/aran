import {
  createRuntime,
  toStandardAdvice,
  standard_pointcut as pointcut,
} from "linvail/runtime";
import { compileInterceptEval } from "../../helper.mjs";
import { isStandardPrimitive } from "./primitive.mjs";
import { weaveStandard } from "aran";
import { advice_global_variable } from "./globals.mjs";

/**
 * @typedef {import("./location.js").NodeHash} NodeHash
 * @typedef {import("./location.js").FilePath} FilePath
 * @typedef {import("./location.js").Atom} Atom
 * @typedef {import("linvail").Primitive} Primitive
 * @typedef {import("linvail").Value} Value
 * @typedef {import("linvail").Wrapper} Wrapper
 * @typedef {import("linvail").GuestReference} GuestReference
 */

/**
 * @type {(
 *   primitive: Primitive,
 * ) => {
 *   type: "primitive",
 *   inner: Primitive,
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
 * @type {(wrapper: Wrapper) => Value}
 */
const unwrap = ({ inner }) => inner;

/**
 * @type {(
 *   root: import("aran").Program<Atom>,
 * ) => import("aran").Program<Atom>}
 */
export const weave = (root) =>
  weaveStandard(root, {
    advice_global_variable,
    pointcut,
    initial_state: null,
  });

/**
 * @type {(
 *   config: {
 *     dir: (value: unknown) => void,
 *     internalize_global_scope: boolean,
 *     toEvalPath: (
 *       hash: NodeHash | "script" | "eval" | "function",
 *     ) => FilePath,
 *     trans: (
 *       path: FilePath,
 *       kind: "eval" | "module" | "script",
 *       code: string,
 *     ) => import("aran").Program<Atom>,
 *     retro: (
 *       root: import("aran").Program<Atom>,
 *     ) => string,
 *     instrument_dynamic_code: boolean,
 *     record_directory: null | URL,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       prov: number,
 *       tag: NodeHash,
 *     ) => void,
 *     evalScript: Value & ((code: string) => Value),
 *     intrinsics: import("aran").IntrinsicRecord,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: null,
 *   Tag: NodeHash,
 *   ScopeValue: Wrapper,
 *   StackValue: Wrapper,
 *   OtherValue: Wrapper | Value,
 * }>}
 */
export const createAdvice = ({
  dir,
  toEvalPath,
  trans,
  retro,
  internalize_global_scope,
  instrument_dynamic_code,
  record_directory,
  recordBranch,
  evalScript,
  intrinsics,
}) => {
  const { advice } = createRuntime(intrinsics, {
    dir,
    wrapPrimitive,
    wrapGuestReference,
    wrapHostReference,
  });
  const { wrap } = advice;
  const { apply, construct } = instrument_dynamic_code
    ? compileInterceptEval({
        toEvalPath,
        trans,
        retro,
        weave,
        String: intrinsics.globalThis.String,
        SyntaxError: intrinsics.globalThis.SyntaxError,
        enterValue: wrap,
        leaveValue: unwrap,
        apply: advice.apply,
        construct: advice.construct,
        evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
        evalScript,
        Function: /** @type {any} */ (intrinsics.globalThis.Function),
        record_directory,
      })
    : { apply: advice.apply, construct: advice.construct };
  advice.weaveEvalProgram = weave;
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
