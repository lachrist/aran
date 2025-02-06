import { weaveStandard } from "aran";
import { createRuntime } from "../../../../../../../linvail/lib/runtime/_.mjs";

const {
  Error,
  Array,
  Object: { keys, hasOwn, is },
  Reflect: { apply },
  WeakMap,
  WeakMap: {
    prototype: { set: setWeakMap, get: getWeakMap, has: hasWeakMap },
  },
} = globalThis;

const listKey = /**
 * @type {<K extends PropertyKey>(record: {[k in K]: unknown}) => K[]}
 */ (keys);

// DO NOT USE toArray because it can be poisoned by:
//   Array.prototype[Symbol.iterator]
/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (element: X) => Y
 * ) => Y[]}
 */
const map = (array, transform) => {
  const { length } = array;
  const result = new Array(length);
  for (let index = 0; index < length; index++) {
    result[index] = transform(array[index]);
  }
  return result;
};

/**
 * @type {<X, Y>(
 *   array: X[],
 *   accumulate: (result: Y, item: X) => Y,
 *   initial: Y,
 * ) => Y}
 */
const reduce = (array, accumulate, result) => {
  const { length } = array;
  for (let index = 0; index < length; index++) {
    result = accumulate(result, array[index]);
  }
  return result;
};

/**
 * @typedef {WeakMap<InternalPrimitive, TreeSize>} PrimitiveRegistery
 * @typedef {WeakMap<Reference, import("aran").ClosureKind>} ClosureRegistery
 * @typedef {WeakMap<Reference, InternalValue[]>} InputRegistery
 * @typedef {import("aran").Atom & { Tag: import("aran").Json }} Atom
 * @typedef {import("aran").EstreeNodePath} NodeHash
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
 * @typedef {number} TreeSize
 * @typedef {(
 *   | "block@setup"
 *   | "block@declaration-overwrite"
 *   | "program-block@after"
 *   | "closure-block@after"
 *   | "import@after"
 *   | "primitive@after"
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
 *   tree_size: TreeSize,
 *   registery: PrimitiveRegistery,
 * ) => InternalPrimitive}
 */
const enterPrimitive = (primitive, tree_size, registery) => {
  const wrapper = { __inner: primitive };
  apply(setWeakMap, registery, [wrapper, tree_size]);
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
const isInternalPrimitive = (value, registery) =>
  apply(hasWeakMap, registery, [value]);

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
 *   tree_size: TreeSize,
 *   registery: PrimitiveRegistery,
 * ) => InternalValue}
 */
const enterValue = (value, tree_size, registery) =>
  isExternalPrimitive(value)
    ? enterPrimitive(value, tree_size, registery)
    : value;

/**
 * @type {(
 *   value: InternalValue,
 *   registery: PrimitiveRegistery,
 * ) => ExternalValue}
 */
const leaveValue = (value, registery) =>
  isInternalPrimitive(value, registery) ? leavePrimitive(value) : value;

/**
 * @type {(
 *   value: InternalValue,
 *   registery: PrimitiveRegistery,
 * ) => TreeSize}
 */
const getTreeSize = (value, registery) => {
  const size = apply(getWeakMap, registery, [value]);
  return size == null ? 0 : size;
};

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
  "yield@after": null,
  "export@before": null,
  "eval@before": null,
  "apply@around": null,
  "construct@around": null,
};

const pointcut = listKey(pointcut_record);

const external_program_transit = false;

const internal_program_transit = true;

/**
 * @type {(
 *   root: import("aran").Program<Atom>,
 * ) => import("aran").Program}
 */
export const weave = (root) =>
  weaveStandard(root, {
    advice_global_variable,
    initial_state: external_program_transit,
    pointcut,
  });

////////////
// Advice //
////////////

const init_tree_size = 1;

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
    apply(setWeakMap, registery, [closure, kind]);
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
  registery !== null ? (apply(getWeakMap, registery, [value]) ?? null) : null;

/**
 * @type {(
 *   callee: InternalValue,
 *   that: InternalValue,
 *   input: InternalValue[],
 *   result: InternalValue,
 *   registery: PrimitiveRegistery,
 * ) => InternalValue}
 */
const updateInternalResultTreeSize = (
  callee,
  that,
  input,
  result,
  registery,
) => {
  if (isInternalPrimitive(result, registery)) {
    // console.log({
    //   type: "internal",
    //   callee,
    //   that,
    //   input,
    //   result,
    //   size: TODO,
    // });
    return enterPrimitive(
      leavePrimitive(result),
      init_tree_size +
        getTreeSize(callee, registery) +
        getTreeSize(that, registery) +
        reduce(
          input,
          (size, value) => size + getTreeSize(value, registery),
          0,
        ) +
        getTreeSize(result, registery),
      registery,
    );
  } else {
    return result;
  }
};

/**
 * @type {(
 *   callee: InternalValue,
 *   that: InternalValue,
 *   input: InternalValue[],
 *   result: ExternalValue,
 *   registery: PrimitiveRegistery,
 * ) => InternalValue}
 */
const updateExternalResultTreeSize = (
  callee,
  that,
  input,
  result,
  registery,
) => {
  if (isExternalPrimitive(result)) {
    // console.log({
    //   type: "external",
    //   callee,
    //   that,
    //   input,
    //   result,
    //   size: TODO,
    // });
    return enterPrimitive(
      result,
      init_tree_size +
        getTreeSize(callee, registery) +
        getTreeSize(that, registery) +
        reduce(input, (size, value) => size + getTreeSize(value, registery), 0),
      registery,
    );
  } else {
    return result;
  }
};

/**
 * @type {(
 *   registery: null | InputRegistery,
 *   input: InternalValue[],
 *   leaveValue: (value: InternalValue) => ExternalValue,
 * ) => Reference}
 */
const registerInput = (registery, input, leaveValue) => {
  /** @type {Reference} */
  const reference = /** @type {any} */ (map(input, leaveValue));
  if (registery !== null) {
    apply(setWeakMap, registery, [reference, input]);
  }
  return /** @type {any} */ (reference);
};

/**
 * @type {(
 *   registery: null | InputRegistery,
 *   candidate: InternalValue,
 * ) => null | InternalValue[]}
 */
const recoverInput = (registery, candidate) =>
  registery !== null
    ? (apply(getWeakMap, registery, [candidate]) ?? null)
    : null;

/**
 * @type {<T extends import("aran").Json>(
 *   intrinscs: import("aran").IntrinsicRecord,
 *   config: {
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       size: TreeSize,
 *       tag: T,
 *     ) => void,
 *     procedural: "inter" | "intra",
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: boolean,
 *   Tag: T,
 *   Kind: AspectKind,
 *   ScopeValue: InternalValue,
 *   StackValue: InternalValue,
 *   OtherValue: InternalValue | ExternalValue,
 * }>}
 */
export const createAdvice = (intrinsics, { recordBranch }) => {
  const {
    advice: {
      leaveBoolean,
      enterNewTarget,
      enterPrimitive,
      enterValue,
      leaveValue,
      enterArgumentList,
      enterClosure,
      enterPlainExternalReference,
      apply,
      construct,
    },
  } = createRuntime(intrinsics);
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
    "block@declaration-overwrite": (transit, kind, frame, _tag) => {
      const copy = /** @type {{[key in string]: InternalValue}} */ (
        /** @type {unknown} */ ({
          __proto__: null,
        })
      );
      if (transit && isClosureKind(kind)) {
        for (const variable in frame) {
          if (variable === "this") {
            copy[variable] = /** @type {InternalValue} */ (frame[variable]);
          } else if (variable === "function.arguments") {
            copy[variable] = registerInput(
              input_registery,
              /** @type {InternalValue[]} */ (
                /** @type {unknown} */ (frame[variable])
              ),
              (value) => leaveValue(value, primitive_registery),
            );
          } else {
            copy[variable] = enterValue(
              /** @type {ExternalValue} */ (frame[variable]),
              init_tree_size,
              primitive_registery,
            );
          }
        }
      } else {
        for (const variable in frame) {
          copy[variable] = enterValue(
            /** @type {ExternalValue} */ (frame[variable]),
            init_tree_size,
            primitive_registery,
          );
        }
      }
      return copy;
    },
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
    "closure@after": (_transit, kind, closure, _tag) =>
      registerInternalClosure(closure_registery, closure, kind),
    "import@after": (_transit, _source, _specifier, value, _tag) =>
      enterValue(
        /** @type {ExternalValue} */ (value),
        init_tree_size,
        primitive_registery,
      ),
    "primitive@after": (_transit, primitive, _tag) =>
      enterPrimitive(
        /** @type {ExternalPrimitive} */ (/** @type {unknown} */ (primitive)),
        init_tree_size,
        primitive_registery,
      ),
    "test@before": (_transit, kind, value, tag) => {
      recordBranch(kind, getTreeSize(value, primitive_registery), tag);
      return leaveValue(value, primitive_registery);
    },
    "intrinsic@after": (_transit, _name, value, _tag) =>
      enterValue(
        /** @type {ExternalValue} */ (value),
        init_tree_size,
        primitive_registery,
      ),
    "await@before": (_transit, value, _tag) =>
      leaveValue(value, primitive_registery),
    "await@after": (_transit, value, _tag) =>
      enterValue(
        /** @type {ExternalValue} */ (value),
        init_tree_size,
        primitive_registery,
      ),
    "yield@before": (_transit, _delegate, value, _tag) =>
      leaveValue(value, primitive_registery),
    "yield@after": (_transit, _delegate, value, _tag) =>
      enterValue(
        /** @type {ExternalValue} */ (value),
        init_tree_size,
        primitive_registery,
      ),
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
      if (is(callee, getValueProperty) && input.length === 2) {
        const { 0: int_obj, 1: int_key } = input;
        const obj = leaveValue(int_obj, primitive_registery);
        const key = leaveValue(int_key, primitive_registery);
        const args = recoverInput(input_registery, int_obj);
        const result = getValueProperty(obj, key);
        if (args && typeof key === "number" && key < args.length) {
          const arg = args[key];
          // Check for out-of-sync
          if (is(leaveValue(arg, primitive_registery), result)) {
            return updateInternalResultTreeSize(
              callee,
              that,
              input,
              arg,
              primitive_registery,
            );
          }
        } else {
          return updateExternalResultTreeSize(
            callee,
            that,
            input,
            result,
            primitive_registery,
          );
        }
      }
      {
        const kind = getInternalClosureKind(closure_registery, callee);
        if (kind != null) {
          // If callee is an internal closure:
          //   - Apply cannot throw before reaching block@declaration-overwrite.
          //   - It cannot be a Proxy as it directly comes from a literal closure.
          transit = true;
          const result = apply(callee, that, input);
          if (isInternalResult(result, kind)) {
            return updateInternalResultTreeSize(
              callee,
              that,
              input,
              result,
              primitive_registery,
            );
          } else if (isExternalResult(result, kind)) {
            return updateExternalResultTreeSize(
              callee,
              that,
              input,
              result,
              primitive_registery,
            );
          } else {
            throw new Error(`unexpected closure kind, got: ${kind}`);
          }
        }
      }
      return updateExternalResultTreeSize(
        callee,
        that,
        input,
        apply(
          leaveValue(callee, primitive_registery),
          leaveValue(that, primitive_registery),
          map(input, (value) => leaveValue(value, primitive_registery)),
        ),
        primitive_registery,
      );
    },
    "construct@around": (_transit, callee, input, _tag) => {
      if (getInternalClosureKind(closure_registery, callee) === "function") {
        transit = true;
        return /** @type {Reference} */ (construct(callee, input));
      }
      return /** @type {Reference} */ (
        construct(
          leaveValue(callee, primitive_registery),
          map(input, (value) => leaveValue(value, primitive_registery)),
        )
      );
    },
  };
};
