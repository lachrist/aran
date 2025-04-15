import { weaveStandard } from "aran";
import { AranExecError } from "../../../error.mjs";
import { compileInterceptEval, listKey, map } from "../../helper.mjs";
import { createWeakMap } from "./collection.mjs";
import { isPrimitive, isStandardPrimitive } from "./primitive.mjs";

const {
  Error,
  Object: { hasOwn, is },
} = globalThis;

/**
 * @typedef {{__brand: "Reference"}} Reference
 * @typedef {undefined | null | boolean | number | bigint | string} StandardPrimitive
 * @typedef {StandardPrimitive | symbol} Primitive
 * @typedef {Reference | Primitive} Value
 * @typedef {{
 *   type: "primitive",
 *   kind: "standard",
 *   inner: StandardPrimitive,
 *   prov: number
 * } | {
 *   type: "primitive",
 *   kind: "symbol",
 *   inner: symbol,
 *   prov: 0,
 * }} PrimitiveWrapper
 * @typedef {{
 *   type: "reference"
 *   kind: "input",
 *   inner: Reference,
 *   prov: 0,
 *   init: Wrapper[],
 * } | {
 *   type: "reference"
 *   kind: "regular" | import("aran").ClosureKind,
 *   inner: Reference,
 *   prov: 0,
 * }} ReferenceWrapper
 * @typedef {PrimitiveWrapper | ReferenceWrapper} Wrapper
 * @typedef {import("./collection.d.ts").WeakMap<Reference, ReferenceWrapper>} Registry
 * @typedef {import("./location.d.ts").NodeHash} NodeHash
 * @typedef {import("./location.d.ts").Atom} Atom
 * @typedef {import("./location.d.ts").FilePath} FilePath
 * @typedef {{ __brand: "ExternalPrimitive" }} ExternalPrimitive
 * @typedef {{ __brand: "InternalPrimitive" }} InternalPrimitive
 * @typedef {(
 *   | "block@setup"
 *   | "block@declaration-overwrite"
 *   | "program-block@after"
 *   | "closure-block@after"
 *   | "import@after"
 *   | "primitive@after"
 *   | "read@after"
 *   | "write@before"
 *   | "test@before"
 *   | "intrinsic@after"
 *   | "closure@after"
 *   | "await@before"
 *   | "await@after"
 *   | "yield@before"
 *   | "yield@after"
 *   | "export@before"
 *   | "eval@before"
 *   | "apply@around"
 *   | "construct@around"
 * )} AspectKind
 * @typedef {(
 *   | "arrow"
 *   | "function"
 *   | "method"
 * )} InternalClosureKind
 * @typedef {(
 *   | "async-arrow"
 *   | "async-function"
 *   | "async-method"
 *   | "generator"
 *   | "async-generator"
 * )} ExternalClosureKind
 * @typedef {{
 *   kind: InternalClosureKind,
 *   value: Wrapper,
 * } | {
 *   kind: ExternalClosureKind,
 *   value: Value,
 * }} KindResult
 */

export const advice_global_variable = "__aran_advice__";

/**
 * @type {{ [k in AspectKind]: null }}
 */
const pointcut_record = {
  "block@setup": null,
  "block@declaration-overwrite": null,
  "program-block@after": null,
  "closure-block@after": null,
  "closure@after": null,
  "import@after": null,
  "primitive@after": null,
  "test@before": null,
  "intrinsic@after": null,
  "await@before": null,
  "await@after": null,
  "yield@before": null,
  "read@after": null,
  "write@before": null,
  "yield@after": null,
  "export@before": null,
  "eval@before": null,
  "apply@around": null,
  "construct@around": null,
};

const remove = {
  stack: {
    "block@declaration-overwrite": null,
  },
  intra: {
    "read@after": null,
    "write@before": null,
  },
  inter: {
    "read@after": null,
    "write@before": null,
  },
};

/**
 * @type {(
 *   tracking: "stack" | "intra" | "inter",
 * ) => AspectKind[]}
 */
export const getPointcut = (tracking) =>
  listKey(pointcut_record).filter((kind) => !hasOwn(remove[tracking], kind));

const external_program_transit = false;

const internal_program_transit = true;

/**
 * @type {(
 *   tracking: "stack" | "intra" | "inter",
 * ) => (
 *   root: import("aran").Program<Atom>,
 * ) => import("aran").Program<Atom>}
 */
export const compileWeave = (tracking) => {
  const pointcut = getPointcut(tracking);
  return (root) =>
    weaveStandard(root, {
      advice_global_variable,
      initial_state: external_program_transit,
      pointcut,
    });
};

////////////
// Advice //
////////////

/**
 * @type {{[k in InternalClosureKind]: null}}
 */
const internal_closure_kind_record = {
  arrow: null,
  function: null,
  method: null,
};

/**
 * @type {{[k in ExternalClosureKind]: null}}
 */
const external_closure_kind_record = {
  "async-arrow": null,
  "async-function": null,
  "async-method": null,
  "generator": null,
  "async-generator": null,
};

/**
 * @type {(
 *   kind: import("aran").ClosureKind,
 * ) => kind is InternalClosureKind}
 */
const isInternalClosureKind = (kind) =>
  hasOwn(internal_closure_kind_record, kind);

/**
 * @type {(
 *   kind: import("aran").ClosureKind,
 * ) => kind is InternalClosureKind}
 */
const isExternalClosureKind = (kind) =>
  hasOwn(external_closure_kind_record, kind);

/**
 * @type {{[k in import("aran").ClosureKind]: null}}
 */
const closure_kind_record = {
  ...internal_closure_kind_record,
  ...external_closure_kind_record,
};

/**
 * @type {(
 *   kind: import("aran").ControlKind,
 * ) => kind is import("aran").ClosureKind}
 */
const isClosureKind = (kind) => hasOwn(closure_kind_record, kind);

/**
 * @type {(
 *   registry: Registry,
 *   closure: Reference,
 *   kind: import("aran").ClosureKind,
 * ) => Wrapper}
 */
const wrapClosure = (registry, closure, kind) => {
  /** @type {Wrapper} */
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
 *   registry: Registry,
 *   input: Reference,
 *   init: Wrapper[],
 * ) => Wrapper}
 */
const wrapInput = (registry, input, init) => {
  /** @type {Wrapper} */
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
 *   registry: Registry,
 *   value: Value,
 * ) => Wrapper}
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
      /** @type {Wrapper} */
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
 *   wrapper: Wrapper
 * ) => Value}
 */
const unwrap = ({ inner }) => inner;

/**
 * @type {(
 *   config: {
 *     tracking: "stack" | "intra" | "inter",
 *     toEvalPath: (
 *       hash: NodeHash | "script" | "eval" | "function",
 *     ) => FilePath,
 *     trans: (
 *       path: FilePath,
 *       kind: "eval" | "module" | "script",
 *       code: string,
 *     ) => import("aran").Program<Atom>,
 *     weave: (
 *       root: import("aran").Program<Atom>,
 *     ) => import("aran").Program<Atom>,
 *     retro: (
 *       root: import("aran").Program<Atom>,
 *     ) => string,
 *     evalGlobal: Value & ((code: string) => Value),
 *     evalScript: Value & ((code: string) => Value),
 *     Function: Value,
 *     SyntaxError: new (message: string) => unknown,
 *     String: (external: Value) => string,
 *     instrument_dynamic_code: boolean,
 *     apply: {
 *       (
 *         callee: Value,
 *         that: Value,
 *         args: Value[],
 *       ): Value;
 *       (
 *         callee: Wrapper,
 *         that: Wrapper,
 *         args: Wrapper[],
 *       ): Wrapper | Value;
 *     },
 *     construct: {
 *       (
 *         callee: Value,
 *         args: Value[],
 *       ): Reference;
 *       (
 *         callee: Wrapper,
 *         args: Wrapper[],
 *       ): Reference;
 *     },
 *     createArray: (values: Value[]) => Reference,
 *     getValueProperty: (
 *       object: Value,
 *       key: Value,
 *     ) => Value,
 *     record_directory: null | URL,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       prov: number,
 *       tag: NodeHash,
 *     ) => void,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: boolean,
 *   Tag: NodeHash,
 *   Kind: AspectKind,
 *   ScopeValue: Wrapper | Value,
 *   StackValue: Wrapper,
 *   OtherValue: Wrapper | Value,
 * }>}
 */
export const createAdvice = ({
  toEvalPath,
  weave,
  trans,
  retro,
  SyntaxError,
  String,
  evalGlobal,
  evalScript,
  Function,
  instrument_dynamic_code,
  apply: applyInner,
  construct: constructInner,
  getValueProperty,
  createArray,
  recordBranch,
  record_directory,
  tracking,
}) => {
  const pointcut = getPointcut(tracking);
  /** @type {Registry} */
  const registry = createWeakMap();
  let transit = false;
  /**
   * @type {(
   *   callee: Wrapper,
   *   that: Wrapper,
   *   input: Wrapper[],
   * ) => Wrapper}
   */
  const applyOuter = (callee, that, input) => {
    if (
      is(callee, getValueProperty) &&
      input.length === 2 &&
      input[0].type === "reference" &&
      input[0].kind === "input" &&
      typeof input[1] === "number" &&
      input[1] < input[0].init.length
    ) {
      const wrapper = input[0].init[input[1]];
      const inner = input[0][input[1]];
      return is(wrapper.inner, inner) ? wrapper : wrap(registry, inner);
    }
    if (
      callee.type === "reference" &&
      callee.kind !== "regular" &&
      callee.kind !== "input"
    ) {
      // If callee is an internal closure:
      //   - Apply cannot throw before reaching block@declaration-overwrite.
      //   - It cannot be a Proxy as it directly comes from a literal closure.
      transit = true;
      const result = applyInner(callee, that, input);
      if (
        callee.kind === "function" ||
        callee.kind === "method" ||
        callee.kind === "arrow"
      ) {
        return /** @type {Wrapper} */ (result);
      } else {
        return wrap(registry, /** @type {Value} */ (result));
      }
    }
    return wrap(
      registry,
      applyInner(callee.inner, that.inner, map(input, unwrap)),
    );
  };
  /**
   * @type {(
   *   callee: Wrapper,
   *   input: Wrapper[],
   * ) => Wrapper}
   */
  const constructOuter = (callee, input) => {
    if (callee.type === "reference" && callee.kind === "function") {
      transit = true;
      return wrap(registry, constructInner(callee, input));
    }
    return wrap(registry, constructInner(callee.inner, map(input, unwrap)));
  };
  const { apply, construct } = instrument_dynamic_code
    ? compileInterceptEval({
        toEvalPath,
        weave,
        trans,
        retro,
        evalGlobal,
        evalScript,
        enterValue: (value) => wrap(registry, value),
        leaveValue: unwrap,
        String,
        SyntaxError,
        Function,
        apply: applyOuter,
        construct: constructOuter,
        record_directory,
      })
    : {
        apply: applyOuter,
        construct: constructOuter,
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
            /** @type {{[key in string]: Wrapper}} */
            const copy = /** @type {any} */ ({ __proto__: null });
            if (transit && isClosureKind(kind)) {
              for (const variable in frame) {
                if (variable === "this") {
                  if (!("new.target" in frame)) {
                    throw new AranExecError("missing new.target", { frame });
                  }
                  copy[variable] = frame["new.target"]
                    ? wrap(registry, /** @type {Value} */ (frame[variable]))
                    : /** @type {Wrapper} */ (frame[variable]);
                } else if (variable === "function.arguments") {
                  const init = /** @type {Wrapper[]} */ (
                    /** @type {unknown} */ (frame[variable])
                  );
                  copy[variable] = wrapInput(
                    registry,
                    createArray(map(init, unwrap)),
                    init,
                  );
                } else {
                  copy[variable] = wrap(
                    registry,
                    /** @type {Value} */ (frame[variable]),
                  );
                }
              }
            } else {
              for (const variable in frame) {
                copy[variable] = wrap(
                  registry,
                  /** @type {Value} */ (frame[variable]),
                );
              }
            }
            return copy;
          }
        : tracking === "intra"
          ? (_transit, _kind, frame, _tag) => {
              /** @type {{[key in string]: Wrapper}} */
              const copy = /** @type {any} */ ({ __proto__: null });
              for (const variable in frame) {
                copy[variable] = wrap(
                  registry,
                  /** @type {Value} */ (frame[variable]),
                );
              }
              return copy;
            }
          : (_transit, _kind, frame, _tag) => frame,
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
            wrapClosure(registry, /** @type {Reference} */ (closure), kind)
        : (_transit, _kind, closure, _tag) =>
            wrap(registry, /** @type {Reference} */ (closure)),
    "import@after": (_transit, _source, _specifier, value, _tag) =>
      wrap(registry, /** @type {Value} */ (value)),
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
        : wrap(registry, /** @type {Value} */ (value)),
    "await@before": (_transit, value, _tag) => value.inner,
    "await@after": (_transit, value, _tag) =>
      wrap(registry, /** @type {Value} */ (value)),
    "yield@before": (_transit, _delegate, value, _tag) => value.inner,
    "yield@after": (_transit, _delegate, value, _tag) =>
      wrap(registry, /** @type {Value} */ (value)),
    "write@before":
      tracking === "stack"
        ? (_transit, _variable, value, _tag) => value.inner
        : (_transit, _variable, value, _tag) => value,
    "read@after":
      tracking === "stack"
        ? (_transit, _variable, value, _tag) =>
            wrap(registry, /** @type {Value} */ (value))
        : (_transit, _variable, value, _tag) => /** @type {Wrapper} */ (value),
    "export@before": (_transit, _specifier, value, _tag) => value.inner,
    "eval@before": (_transit, value, _tag) => {
      const root1 = /** @type {import("aran").Program<Atom>} */ (
        /** @type {unknown} */ (value.inner)
      );
      const root2 = weaveStandard(root1, {
        advice_global_variable,
        initial_state: internal_program_transit,
        pointcut,
      });
      return /** @type {Value} */ (/** @type {unknown} */ (root2));
    },
    // around //
    "apply@around": (_transit, callee, that, input, _tag) => {
      const result = apply(callee, that, input);
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
      construct(callee, input),
  };
};
