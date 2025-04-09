import { weaveStandard } from "aran";
import { AranExecError } from "../../../error.mjs";
import { compileInterceptEval, listKey, map } from "../../helper.mjs";
import {
  createSizeRegistery,
  getSize,
  setAtomicSize,
  setCompoundSize,
} from "./size.mjs";
import { createWeakMap, createWeakSet } from "./collection.mjs";

const {
  Error,
  Object: { hasOwn, is },
} = globalThis;

/**
 * @typedef {import("./size.d.ts").SizeRegistery<InternalValue>} SizeRegistery
 * @typedef {import("./collection.d.ts").WeakSet<InternalPrimitive>} PrimitiveRegistery
 * @typedef {import("./collection.d.ts").WeakMap<Reference, import("aran").ClosureKind>} ClosureRegistery
 * @typedef {import("./collection.d.ts").WeakMap<Reference, InternalValue[]>} InputRegistery
 * @typedef {import("./location.d.ts").NodeHash} NodeHash
 * @typedef {import("./location.d.ts").Atom} Atom
 * @typedef {import("./location.d.ts").FilePath} FilePath
 * @typedef {(
 *   | undefined
 *   | null
 *   | boolean
 *   | number
 *   | bigint
 *   | string
 * )} Primitive
 * @typedef {{ __brand: "ExternalPrimitive" }} ExternalPrimitive
 * @typedef {{ __brand: "InternalPrimitive" }} InternalPrimitive
 * @typedef {{ __brand: "Reference" }} Reference
 * @typedef {ExternalPrimitive | Reference} ExternalValue
 * @typedef {InternalPrimitive | Reference} InternalValue
 * @typedef {import("./size.d.ts").Size} Size
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
 *   value: InternalValue,
 * } | {
 *   kind: ExternalClosureKind,
 *   value: ExternalValue,
 * }} KindResult
 */

/**
 * @type {(
 *   primitive: ExternalPrimitive,
 *   registery: PrimitiveRegistery,
 * ) => InternalPrimitive}
 */
const enterPrimitive = (primitive, registery) => {
  /** @type {InternalPrimitive} */
  const wrapper = /** @type {any} */ ({ __inner: primitive });
  registery.add(wrapper);
  return /** @type {any} */ (wrapper);
};

/**
 * @type {(
 *   primitive: InternalPrimitive,
 * ) => ExternalPrimitive}
 */
const leavePrimitive = (/** @type {any} */ { __inner }) => __inner;

/**
 * @type {(
 *   value: InternalValue,
 *   register: PrimitiveRegistery,
 * ) => value is InternalPrimitive}
 */
const isInternalPrimitive = (value, registery) => registery.has(value);

/**
 * @type {(
 *   value: ExternalValue,
 * ) => value is ExternalPrimitive}
 */
const isExternalPrimitive = (value) =>
  value == null ||
  typeof value === "boolean" ||
  typeof value === "number" ||
  typeof value === "bigint" ||
  typeof value === "string";

/**
 * @type {(
 *   value: ExternalValue,
 *   registery: PrimitiveRegistery,
 * ) => InternalValue}
 */
const enterValue = (value, registery) =>
  isExternalPrimitive(value) ? enterPrimitive(value, registery) : value;

/**
 * @type {(
 *   value: InternalValue,
 *   registery: PrimitiveRegistery,
 * ) => ExternalValue}
 */
const leaveValue = (value, registery) =>
  isInternalPrimitive(value, registery) ? leavePrimitive(value) : value;

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
    "closure@after": null,
  },
  intra: {
    "closure@after": null,
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
 *   _result: InternalValue | ExternalValue,
 *   kind: import("aran").ClosureKind
 * ) => _result is InternalValue}
 */
const isInternalResult = (_result, kind) => isInternalClosureKind(kind);

/**
 * @type {(
 *   _result: InternalValue | ExternalValue,
 *   kind: import("aran").ClosureKind
 * ) => _result is ExternalValue}
 */
const isExternalResult = (_result, kind) => isExternalClosureKind(kind);

/**
 * @type {(
 *   registery: null | ClosureRegistery,
 *   closure: Function,
 *   kind: import("aran").ClosureKind,
 * ) => Reference}
 */
const registerInternalClosure = (registery, closure, kind) => {
  if (registery !== null) {
    registery.set(/** @type {any} */ (closure), kind);
  }
  return /** @type {any} */ (closure);
};

/**
 * @type {(
 *   registery: null | ClosureRegistery,
 *   value: InternalValue,
 * ) => import("aran").ClosureKind | null}
 */
const getInternalClosureKind = (registery, value) =>
  registery !== null ? (registery.get(value) ?? null) : null;

/**
 * @type {(
 *   registery: null | InputRegistery,
 *   reference: Reference,
 *   input: InternalValue[],
 * ) => void}
 */
const registerInput = (registery, reference, input) => {
  if (registery !== null) {
    registery.set(reference, input);
  }
};

/**
 * @type {(
 *   registery: null | InputRegistery,
 *   candidate: InternalValue,
 * ) => null | InternalValue[]}
 */
const recoverInput = (registery, candidate) =>
  registery !== null ? (registery.get(candidate) ?? null) : null;

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
 *     evalGlobal: ExternalValue & ((code: string) => ExternalValue),
 *     evalScript: ExternalValue & ((code: string) => ExternalValue),
 *     Function: ExternalValue,
 *     SyntaxError: new (message: string) => unknown,
 *     String: (external: ExternalValue) => string,
 *     instrument_dynamic_code: boolean,
 *     apply: {
 *       (
 *         callee: ExternalValue,
 *         that: ExternalValue,
 *         args: ExternalValue[],
 *       ): ExternalValue;
 *       (
 *         callee: InternalValue,
 *         that: InternalValue,
 *         args: InternalValue[],
 *       ): InternalValue | ExternalValue;
 *     },
 *     construct: {
 *       (
 *         callee: ExternalValue,
 *         args: ExternalValue[],
 *       ): Reference;
 *       (
 *         callee: InternalValue,
 *         args: InternalValue[],
 *       ): Reference;
 *     },
 *     createArray: (values: ExternalValue[]) => Reference,
 *     getValueProperty: (
 *       object: ExternalValue,
 *       key: ExternalValue,
 *     ) => ExternalValue,
 *     record_directory: null | URL,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       size: Size,
 *       tag: NodeHash,
 *     ) => void,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: boolean,
 *   Tag: NodeHash,
 *   Kind: AspectKind,
 *   ScopeValue: InternalValue | ExternalValue,
 *   StackValue: InternalValue,
 *   OtherValue: InternalValue | ExternalValue,
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
  const inter_procedural_tracking = tracking === "inter";
  const size_registery = createSizeRegistery();
  /** @type {PrimitiveRegistery} */
  const primitive_registery = createWeakSet();
  /** @type {null | ClosureRegistery} */
  const closure_registery = inter_procedural_tracking ? createWeakMap() : null;
  /** @type {null | InputRegistery} */
  const input_registery = inter_procedural_tracking ? createWeakMap() : null;
  let transit = false;
  /**
   * @type {(
   *   callee: InternalValue,
   *   that: InternalValue,
   *   input: InternalValue[],
   * ) => InternalValue}
   */
  const applyOuter = (callee, that, input) => {
    if (is(callee, getValueProperty) && input.length === 2) {
      const { 0: int_obj, 1: int_key } = input;
      const obj = leaveValue(int_obj, primitive_registery);
      const key = leaveValue(int_key, primitive_registery);
      const args = recoverInput(input_registery, int_obj);
      const result = getValueProperty(obj, key);
      if (args && typeof key === "number" && key < args.length) {
        const arg = args[key];
        return is(leaveValue(arg, primitive_registery), result)
          ? arg
          : enterValue(result, primitive_registery);
      } else {
        return enterValue(result, primitive_registery);
      }
    }
    {
      const kind = getInternalClosureKind(closure_registery, callee);
      if (kind != null) {
        // If callee is an internal closure:
        //   - Apply cannot throw before reaching block@declaration-overwrite.
        //   - It cannot be a Proxy as it directly comes from a literal closure.
        transit = true;
        const result = applyInner(callee, that, input);
        if (isInternalResult(result, kind)) {
          return result;
        } else if (isExternalResult(result, kind)) {
          return enterValue(result, primitive_registery);
        } else {
          throw new Error(`unexpected closure kind, got: ${kind}`);
        }
      }
    }
    return enterValue(
      applyInner(
        leaveValue(callee, primitive_registery),
        leaveValue(that, primitive_registery),
        map(input, (argument) => leaveValue(argument, primitive_registery)),
      ),
      primitive_registery,
    );
  };
  /**
   * @type {(
   *   callee: InternalValue,
   *   input: InternalValue[],
   * ) => InternalValue}
   */
  const constructOuter = (callee, input) => {
    if (getInternalClosureKind(closure_registery, callee) === "function") {
      transit = true;
      return constructInner(callee, input);
    }
    return constructInner(
      leaveValue(callee, primitive_registery),
      map(input, (value) => leaveValue(value, primitive_registery)),
    );
  };
  const { apply, construct } = instrument_dynamic_code
    ? compileInterceptEval({
        toEvalPath,
        weave,
        trans,
        retro,
        evalGlobal,
        evalScript,
        enterValue: (value) => enterValue(value, primitive_registery),
        leaveValue: (value) => leaveValue(value, primitive_registery),
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
            /** @type {{[key in string]: InternalValue}} */
            const copy = /** @type {any} */ ({ __proto__: null });
            if (transit && isClosureKind(kind)) {
              for (const variable in frame) {
                if (variable === "this") {
                  if (!("new.target" in frame)) {
                    throw new AranExecError("missing new.target", { frame });
                  }
                  copy[variable] = frame["new.target"]
                    ? enterPrimitive(
                        /** @type {ExternalPrimitive} */ (frame[variable]),
                        primitive_registery,
                      )
                    : /** @type {InternalValue} */ (frame[variable]);
                } else if (variable === "function.arguments") {
                  const input = /** @type {InternalValue[]} */ (
                    /** @type {unknown} */ (frame[variable])
                  );
                  const reference = createArray(
                    map(input, (value) =>
                      leaveValue(value, primitive_registery),
                    ),
                  );
                  registerInput(input_registery, reference, input);
                  copy[variable] = reference;
                } else {
                  copy[variable] = enterValue(
                    /** @type {ExternalValue} */ (frame[variable]),
                    primitive_registery,
                  );
                }
              }
            } else {
              for (const variable in frame) {
                copy[variable] = enterValue(
                  /** @type {ExternalValue} */ (frame[variable]),
                  primitive_registery,
                );
              }
            }
            return copy;
          }
        : tracking === "intra"
          ? (_transit, _kind, frame, _tag) => {
              /** @type {{[key in string]: InternalValue}} */
              const copy = /** @type {any} */ ({ __proto__: null });
              for (const variable in frame) {
                copy[variable] = enterValue(
                  /** @type {ExternalValue} */ (frame[variable]),
                  primitive_registery,
                );
              }
              return copy;
            }
          : (_transit, _kind, frame, _tag) => frame,
    "program-block@after": (transit, _kind, value, _tag) =>
      transit ? value : leaveValue(value, primitive_registery),
    "closure-block@after": (transit, kind, value, _tag) => {
      if (transit) {
        if (isInternalClosureKind(kind)) {
          return value;
        } else if (isExternalClosureKind(kind)) {
          return leaveValue(value, primitive_registery);
        } else {
          throw new Error(`illegal closure kind, got: ${kind}`);
        }
      } else {
        return leaveValue(value, primitive_registery);
      }
    },
    "closure@after":
      tracking === "inter"
        ? (_transit, kind, closure, _tag) =>
            registerInternalClosure(closure_registery, closure, kind)
        : (_transit, _kind, closure, _tag) =>
            /** @type {Reference} */ (closure),
    "import@after": (_transit, _source, _specifier, value, _tag) =>
      enterValue(/** @type {ExternalValue} */ (value), primitive_registery),
    "primitive@after": (_transit, primitive, _tag) => {
      const fresh = enterPrimitive(
        /** @type {ExternalPrimitive} */ (/** @type {unknown} */ (primitive)),
        primitive_registery,
      );
      setAtomicSize(size_registery, fresh);
      return fresh;
    },
    "test@before": (_transit, kind, value, tag) => {
      recordBranch(kind, getSize(size_registery, value), tag);
      return leaveValue(value, primitive_registery);
    },
    "intrinsic@after": (_transit, _name, value, _tag) => {
      const fresh = enterValue(
        /** @type {ExternalValue} */ (value),
        primitive_registery,
      );
      if (isInternalPrimitive(fresh, primitive_registery)) {
        setAtomicSize(size_registery, fresh);
      }
      return fresh;
    },
    "await@before": (_transit, value, _tag) =>
      leaveValue(value, primitive_registery),
    "await@after": (_transit, value, _tag) =>
      enterValue(/** @type {ExternalValue} */ (value), primitive_registery),
    "yield@before": (_transit, _delegate, value, _tag) =>
      leaveValue(value, primitive_registery),
    "yield@after": (_transit, _delegate, value, _tag) =>
      enterValue(/** @type {ExternalValue} */ (value), primitive_registery),
    "write@before":
      tracking === "stack"
        ? (_transit, _variable, value, _tag) =>
            leaveValue(value, primitive_registery)
        : (_transit, _variable, value, _tag) => value,
    "read@after":
      tracking === "stack"
        ? (_transit, _variable, value, _tag) =>
            enterValue(
              /** @type {ExternalValue} */ (value),
              primitive_registery,
            )
        : (_transit, _variable, value, _tag) =>
            /** @type {InternalValue} */ (value),
    "export@before": (_transit, _specifier, value, _tag) =>
      leaveValue(value, primitive_registery),
    "eval@before": (_transit, value, _tag) => {
      const root1 = /** @type {import("aran").Program<Atom>} */ (
        /** @type {unknown} */ (leaveValue(value, primitive_registery))
      );
      const root2 = weaveStandard(root1, {
        advice_global_variable,
        initial_state: internal_program_transit,
        pointcut,
      });
      return /** @type {ExternalValue} */ (/** @type {unknown} */ (root2));
    },
    // around //
    "apply@around": (_transit, callee, that, input, _tag) => {
      const result = apply(callee, that, input);
      if (isInternalPrimitive(result, primitive_registery)) {
        const fresh = enterPrimitive(
          leavePrimitive(result),
          primitive_registery,
        );
        setCompoundSize(size_registery, fresh, { callee, that, input, result });
        return fresh;
      } else {
        return result;
      }
    },
    "construct@around": (_transit, callee, input, _tag) =>
      construct(callee, input),
  };
};
