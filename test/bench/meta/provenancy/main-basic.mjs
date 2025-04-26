import { compileIntrinsicRecord } from "aran";
import { isPrimitive, isStandardPrimitive } from "./primitive.mjs";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./globals.mjs";
import { compileRecordBranch } from "./record.mjs";

const {
  WeakMap,
  Error,
  Object: { is },
  Array: { from: map },
  Reflect: { apply, construct, defineProperty },
} = globalThis;

/**
 * @type {(
 *   kind: import("aran").ControlKind,
 * ) => boolean}
 */
const isExternalClosureKind = (kind) =>
  kind === "async-arrow" ||
  kind === "async-function" ||
  kind === "async-method" ||
  kind === "generator" ||
  kind === "async-generator";

/**
 * @type {(
 *   kind: import("aran").ControlKind,
 * ) => boolean}
 */
const isInternalClosureKind = (kind) =>
  kind === "arrow" || kind === "function" || kind === "method";

/**
 * @type {(
 *   kind: import("aran").ControlKind,
 * ) => boolean}
 */
const isClosureKind = (kind) =>
  isInternalClosureKind(kind) || isExternalClosureKind(kind);

/**
 * @type {(
 *   registry: import("./domain.d.ts").Registry,
 *   closure: import("./domain.d.ts").Reference,
 *   kind: import("aran").ClosureKind,
 * ) => import("./domain.d.ts").Wrapper}
 */
const wrapClosure = (registry, closure, kind) => {
  /** @type {import("./domain.d.ts").Wrapper} */
  const wrapper = {
    type: "reference",
    kind,
    inner: closure,
    prov: 0,
  };
  registry.set(closure, wrapper);
  return wrapper;
};

/**
 * @type {(
 *   registry: import("./domain.d.ts").Registry,
 *   input: import("./domain.d.ts").Reference,
 *   init: import("./domain.d.ts").Wrapper[],
 * ) => import("./domain.d.ts").Wrapper}
 */
const wrapInput = (registry, input, init) => {
  /** @type {import("./domain.d.ts").Wrapper} */
  const wrapper = {
    type: "reference",
    kind: "input",
    inner: input,
    prov: 0,
    init,
  };
  registry.set(input, wrapper);
  return wrapper;
};

/**
 * @type {(
 *   registry: import("./domain.d.ts").Registry,
 *   value: import("./domain.d.ts").Value,
 * ) => import("./domain.d.ts").Wrapper}
 */
const wrap = (registry, value) => {
  if (isPrimitive(value)) {
    if (typeof value === "symbol") {
      return {
        type: "primitive",
        kind: "symbol",
        inner: value,
        prov: 0,
      };
    } else {
      return {
        type: "primitive",
        kind: "standard",
        inner: value,
        prov: 0,
      };
    }
  } else {
    const wrapper = registry.get(value);
    if (wrapper == null) {
      /** @type {import("./domain.d.ts").Wrapper} */
      const wrapper = {
        type: "reference",
        kind: "regular",
        inner: value,
        prov: 0,
      };
      registry.set(value, wrapper);
      return wrapper;
    } else {
      return wrapper;
    }
  }
};

/**
 * @type {(
 *   wrapper: import("./domain.d.ts").Wrapper
 * ) => import("./domain.d.ts").Value}
 */
const unwrap = ({ inner }) => inner;

/**
 * @type {(
 *   config: {
 *     tracking: "stack" | "inter" | "intra",
 *     intrinsics: import("aran").IntrinsicRecord,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       prov: number,
 *       tag: import("./location.d.ts").NodeHash,
 *     ) => void,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: boolean,
 *   Tag: import("./location.d.ts").NodeHash,
 *   Kind: import("./pointcut.d.ts").Pointcut,
 *   ScopeValue: import("./domain.d.ts").Wrapper | import("./domain.d.ts").Value,
 *   StackValue: import("./domain.d.ts").Wrapper,
 *   OtherValue: import("./domain.d.ts").Wrapper | import("./domain.d.ts").Value,
 * }>}
 */
const createAdvice = ({ recordBranch, tracking, intrinsics }) => {
  const getValueProperty = intrinsics["aran.getValueProperty"];
  /** @type {import("./domain.d.ts").Registry} */
  const registry = new WeakMap();
  let transit = false;
  /**
   * @type {(
   *   callee: import("./domain.d.ts").Wrapper,
   *   that: import("./domain.d.ts").Wrapper,
   *   input: import("./domain.d.ts").Wrapper[],
   * ) => import("./domain.d.ts").Wrapper}
   */
  const applyWrapper = (callee, that, input) => {
    if (
      is(callee.inner, getValueProperty) &&
      input.length === 2 &&
      input[0].type === "reference" &&
      input[0].kind === "input" &&
      input[1].type === "primitive" &&
      typeof input[1].inner === "number" &&
      input[1].inner < input[0].init.length &&
      input[1].inner <
        /** @type {number} */ (getValueProperty(input[0].inner, "length"))
    ) {
      const wrapper = input[0].init[input[1].inner];
      const value = /** @type {import("./domain.d.ts").Value} */ (
        getValueProperty(input[0].inner, input[1].inner)
      );
      return is(wrapper.inner, value) ? wrapper : wrap(registry, value);
    }
    if (
      callee.type === "reference" &&
      callee.kind !== "regular" &&
      callee.kind !== "input"
    ) {
      transit = true;
      /** @type {import("./domain.d.ts").Wrapper | import("./domain.d.ts").Value} */
      const either = apply(/** @type {any} */ (callee.inner), that, input);
      if (isInternalClosureKind(callee.kind)) {
        return /** @type {import("./domain.d.ts").Wrapper} */ (either);
      } else {
        return wrap(
          registry,
          /** @type {import("./domain.d.ts").Value} */ (either),
        );
      }
    }
    return wrap(
      registry,
      apply(/** @type {any} */ (callee.inner), that.inner, map(input, unwrap)),
    );
  };
  /**
   * @type {(
   *   callee: import("./domain.d.ts").Wrapper,
   *   input: import("./domain.d.ts").Wrapper[],
   * ) => import("./domain.d.ts").Wrapper}
   */
  const constructWrapper = (callee, input) => {
    if (callee.type === "reference" && callee.kind === "function") {
      transit = true;
      return construct(/** @type {any} */ (callee.inner), input);
    }
    return wrap(
      registry,
      construct(/** @type {any} */ (callee.inner), map(input, unwrap)),
    );
  };
  return {
    "block@setup": (state, kind, _tag) => {
      if (isClosureKind(kind)) {
        if (transit) {
          transit = false;
          return true;
        } else {
          return false;
        }
      } else {
        return state;
      }
    },
    "block@declaration-overwrite":
      tracking === "inter"
        ? (transit, kind, frame, _tag) => {
            /** @type {{[key in string]: import("./domain.d.ts").Wrapper}} */
            const copy = /** @type {any} */ ({ __proto__: null });
            if (transit && isClosureKind(kind)) {
              for (const variable in frame) {
                if (variable === "this") {
                  if (!("new.target" in frame)) {
                    throw new Error("missing new.target", { cause: frame });
                  }
                  copy[variable] = frame["new.target"]
                    ? wrap(
                        registry,
                        /** @type {import("./domain.d.ts").Value} */ (
                          frame[variable]
                        ),
                      )
                    : /** @type {import("./domain.d.ts").Wrapper} */ (
                        frame[variable]
                      );
                } else if (variable === "function.arguments") {
                  const init =
                    /** @type {import("./domain.d.ts").Wrapper[]} */ (
                      /** @type {unknown} */ (frame[variable])
                    );
                  copy[variable] = wrapInput(
                    registry,
                    /** @type {import("./domain.d.ts").Reference} */ (
                      /** @type {unknown} */ (map(init, unwrap))
                    ),
                    init,
                  );
                } else {
                  copy[variable] = wrap(
                    registry,
                    /** @type {import("./domain.d.ts").Value} */ (
                      frame[variable]
                    ),
                  );
                }
              }
            } else {
              for (const variable in frame) {
                copy[variable] = wrap(
                  registry,
                  /** @type {import("./domain.d.ts").Value} */ (
                    frame[variable]
                  ),
                );
              }
            }
            return copy;
          }
        : tracking === "intra"
          ? (_transit, _kind, frame, _tag) => {
              /** @type {{[key in string]: import("./domain.d.ts").Wrapper}} */
              const copy = /** @type {any} */ ({ __proto__: null });
              for (const variable in frame) {
                copy[variable] = wrap(
                  registry,
                  /** @type {import("./domain.d.ts").Value} */ (
                    frame[variable]
                  ),
                );
              }
              return copy;
            }
          : (_transit, _kind, _frame, _tag) => {
              throw new Error(
                "block@declaration-overwrite should only be called in stack or intra tracking",
              );
            },
    "program-block@after": (transit, _kind, value, _tag) =>
      transit ? value : value.inner,
    "closure-block@after": (transit, kind, value, _tag) => {
      if (transit) {
        if (isInternalClosureKind(kind)) {
          return value;
        } else if (isExternalClosureKind(kind)) {
          return value.inner;
        } else {
          throw new Error(`illegal closure kind, got: ${kind}`);
        }
      } else {
        return value.inner;
      }
    },
    "closure@after":
      tracking === "inter"
        ? (_transit, kind, closure, _tag) =>
            wrapClosure(
              registry,
              /** @type {import("./domain.d.ts").Reference} */ (closure),
              kind,
            )
        : (_transit, _kind, closure, _tag) =>
            wrap(
              registry,
              /** @type {import("./domain.d.ts").Reference} */ (closure),
            ),
    "import@after": (_transit, _source, _specifier, value, _tag) =>
      wrap(registry, /** @type {import("./domain.d.ts").Value} */ (value)),
    "primitive@after": (_transit, primitive, _tag) => ({
      type: "primitive",
      kind: "standard",
      inner: primitive,
      prov: 1,
    }),
    "test@before": (_transit, kind, value, tag) => {
      recordBranch(kind, value.prov, tag);
      return value.inner;
    },
    "intrinsic@after": (_transit, _name, value, _tag) =>
      isStandardPrimitive(value)
        ? { type: "primitive", kind: "standard", inner: value, prov: 1 }
        : wrap(registry, /** @type {import("./domain.d.ts").Value} */ (value)),
    "await@before": (_transit, value, _tag) => value.inner,
    "await@after": (_transit, value, _tag) =>
      wrap(registry, /** @type {import("./domain.d.ts").Value} */ (value)),
    "yield@before": (_transit, _delegate, value, _tag) => value.inner,
    "yield@after": (_transit, _delegate, value, _tag) =>
      wrap(registry, /** @type {import("./domain.d.ts").Value} */ (value)),
    "write@before":
      tracking === "stack"
        ? (_transit, _variable, value, _tag) => value.inner
        : (_transit, _variable, _value, _tag) => {
            throw new Error(
              "write@before should only be called in stack tracking",
            );
          },
    "read@after":
      tracking === "stack"
        ? (_transit, _variable, value, _tag) =>
            wrap(registry, /** @type {import("./domain.d.ts").Value} */ (value))
        : (_transit, _variable, _value, _tag) => {
            throw new Error(
              "read@after should only be called in stack tracking",
            );
          },
    "export@before": (_transit, _specifier, value, _tag) => value.inner,
    "eval@before": (_transit, _value, _tag) => {
      throw new Error("eval@before is not supported");
    },
    // around //
    "apply@around": (_transit, callee, that, input, _tag) => {
      const result = applyWrapper(callee, that, input);
      if (result.type === "primitive" && result.kind === "standard") {
        let prov = 1;
        prov += result.prov;
        prov += callee.prov;
        prov += that.prov;
        const { length } = input;
        for (let index = 0; index < length; index++) {
          prov += input[index].prov;
        }
        return {
          type: "primitive",
          kind: "standard",
          inner: result.inner,
          prov,
        };
      } else {
        return result;
      }
    },
    "construct@around": (_transit, callee, input, _tag) =>
      constructWrapper(callee, input),
  };
};

/**
 * @type {(
 *   config: {
 *     target: import("../../enum.d.ts").Base,
 *     tracking: "stack" | "inter" | "intra",
 *   },
 * ) => void}
 */
export const setup = ({ target, tracking }) => {
  const intrinsics = compileIntrinsicRecord(globalThis);
  const advice = createAdvice({
    tracking,
    intrinsics,
    recordBranch: compileRecordBranch({
      meta: `provenancy/${tracking}`,
      base: target,
      buffer_length: 1000,
    }),
  });
  defineProperty(globalThis, advice_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: advice,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  defineProperty(globalThis, intrinsic_global_variable, {
    // @ts-ignore
    __proto__: null,
    value: intrinsics,
    enumerable: false,
    writable: false,
    configurable: false,
  });
};
