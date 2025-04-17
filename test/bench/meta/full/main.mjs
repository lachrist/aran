import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./bridge.mjs";
import { compileIntrinsicRecord } from "aran/runtime";

const {
  SyntaxError,
  Reflect: { apply, construct, defineProperty },
} = globalThis;

defineProperty(globalThis, intrinsic_global_variable, {
  // @ts-ignore
  __proto__: null,
  value: compileIntrinsicRecord(globalThis),
  writable: false,
  enumerable: false,
  configurable: false,
});

/**
 * @type {import("aran").StandardAdvice<{
 *   Kind: import("aran").StandardAspectKind;
 * }>}
 */
const advice = {
  "block@setup": (state, _kind, _location) => state,
  "block@declaration": (_state, _kind, _frame, _location) => {},
  "block@declaration-overwrite": (__state, _kind, frame, __location) => frame,
  "segment-block@before": (_state, _kind, _labels, __location) => {},
  "closure-block@before": (_state, _kind, __location) => {},
  "program-block@before": (_state, _kind, _head, __location) => {},
  "generator-block@suspension": (_state, _kind, _location) => {},
  "generator-block@resumption": (_state, _kind, _location) => {},
  "segment-block@after": (_state, _kind, _location) => {},
  "closure-block@after": (_state, _kind, value, _location) => value,
  "program-block@after": (_state, _kind, value, _location) => value,
  "block@throwing": (_state, _kind, value, _location) => value,
  "block@teardown": (_state, _kind, _location) => {},
  "break@before": (_state, _label, _location) => {},
  "apply@around": (_state, callee, that, input, _location) =>
    apply(/** @type {any} */ (callee), that, input),
  "construct@around": (_state, callee, input, _location) =>
    construct(/** @type {any} */ (callee), input),
  "test@before": (_state, _kind, value, _location) => value,
  "eval@before": (_state, _root, _location) => {
    throw new SyntaxError("eval is not supported");
  },
  "eval@after": (_state, value, _location) => value,
  "await@before": (_state, value, _location) => value,
  "await@after": (_state, value, _location) => value,
  "yield@before": (_state, _delegate, value, _location) => value,
  "yield@after": (_state, _delegate, value, _location) => value,
  "read@after": (_state, _variable, value, _location) => value,
  "write@before": (_state, _variable, value, _location) => value,
  "drop@before": (_state, value, _location) => value,
  "export@before": (_state, _specifier, value, _location) => value,
  "import@after": (_state, _source, _specifier, value, _location) => value,
  "intrinsic@after": (_state, _name, value, _location) => value,
  "primitive@after": (_state, value, _location) => value,
  "closure@after": (_state, _kind, value, _location) => value,
};

const descriptor = {
  __proto__: null,
  value: advice,
  writable: false,
  enumerable: false,
  configurable: false,
};

defineProperty(globalThis, advice_global_variable, descriptor);
