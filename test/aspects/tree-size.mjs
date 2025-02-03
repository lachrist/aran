import { weaveStandard } from "aran";

const {
  Error,
  Object: { keys, hasOwn, is },
  Array: { from: toArray },
  Reflect: { apply },
  WeakMap,
  WeakMap: {
    prototype: { set: setWeakMap, get: getWeakMap, has: hasWeakMap },
  },
} = globalThis;

const listKey = /**
 * @type {<K extends PropertyKey>(record: {[k in K]: unknown}) => K[]}
 */ (keys);

/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (element: X) => Y
 * ) => Y[]}
 */
const map = toArray;

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
 * @typedef {WeakMap<InternalPrimitive, TreeSize>} Registery
 * @typedef {(
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
 *   registery: Registery,
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
 *   register: Registery,
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
 *   registery: Registery,
 * ) => InternalValue}
 */
const enterValue = (value, tree_size, registery) =>
  isExternalPrimitive(value)
    ? enterPrimitive(value, tree_size, registery)
    : value;

/**
 * @type {(
 *   value: InternalValue,
 *   registery: Registery,
 * ) => ExternalValue}
 */
const leaveValue = (value, registery) =>
  isInternalPrimitive(value, registery) ? leavePrimitive(value) : value;

/**
 * @type {(
 *   value: InternalValue,
 *   registery: Registery,
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

/**
 * @type {(
 *   root: import("aran").Program<Atom>,
 * ) => import("aran").Program}
 */
export const weave = (root) =>
  weaveStandard(root, {
    advice_global_variable,
    initial_state: null,
    pointcut,
  });

////////////
// Advice //
////////////

const INIT_TREE_SIZE = 0;

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
 * @type {{[k in import("aran").ClosureKind]: null}}
 */
const closure_kind_record = {
  ...internal_closure_kind_record,
  ...external_closure_kind_record,
};

/**
 * @type {(
 *   _result: InternalValue | ExternalValue,
 *   kind: import("aran").ClosureKind
 * ) => _result is InternalValue}
 */
const isInternalResult = (_result, kind) =>
  hasOwn(internal_closure_kind_record, kind);

/**
 * @type {(
 *   _result: InternalValue | ExternalValue,
 *   kind: import("aran").ClosureKind
 * ) => _result is ExternalValue}
 */
const isExternalResult = (_result, kind) =>
  hasOwn(external_closure_kind_record, kind);

/**
 * @type {(
 *   callee: InternalValue,
 *   that: null | InternalValue,
 *   input: InternalValue[],
 *   registery: Registery,
 * ) => TreeSize}
 */
const computeInputSize = (callee, that, input, registery) =>
  reduce(
    input,
    (size, value) => size + getTreeSize(value, registery),
    getTreeSize(callee, registery) +
      (that === null ? 0 : getTreeSize(that, registery)),
  );

/**
 * @type {<T extends import("aran").Json>(
 *   intrinscs: {
 *     getValueProperty: (
 *       object: ExternalValue,
 *       key: ExternalValue,
 *     ) => ExternalValue,
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
 *   },
 *   config: {
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       size: TreeSize,
 *       tag: T,
 *     ) => void,
 *   },
 * ) => import("aran").StandardAdvice<{
 *   Tag: T,
 *   Kind: AspectKind,
 *   ScopeValue: InternalValue,
 *   StackValue: InternalValue,
 *   OtherValue: ExternalValue,
 * }>}
 */
export const createAdvice = (
  { getValueProperty, apply, construct },
  { recordBranch },
) => {
  /** @type {Registery} */
  const registery = new WeakMap();
  /**
   * @type {WeakMap<InternalValue, import("aran").ClosureKind>}
   */
  const internals = new WeakMap();
  /**
   * @type {WeakMap<InternalValue, InternalValue[]>}
   */
  const inputs = new WeakMap();
  let transit = false;
  return {
    "block@declaration-overwrite": (_state, kind, frame, _tag) => {
      const copy = /** @type {{[key in string]: InternalValue}} */ (
        /** @type {unknown} */ ({
          __proto__: null,
        })
      );
      if (transit) {
        transit = false;
        if (!hasOwn(closure_kind_record, kind)) {
          throw new Error(`transit should only occur in closure ${kind}`);
        } else {
          for (const variable in frame) {
            if (variable === "this") {
              copy[variable] = /** @type {InternalValue} */ (frame[variable]);
            } else if (variable === "function.arguments") {
              /** @type {InternalValue[]} */
              const dirty = /** @type {any} */ (frame[variable]);
              /** @type {Reference} */
              const clean = /** @type {any} */ (
                map(dirty, (value) => leaveValue(value, registery))
              );
              inputs.set(clean, dirty);
              copy[variable] = clean;
            } else {
              copy[variable] = enterValue(
                /** @type {ExternalValue} */ (frame[variable]),
                INIT_TREE_SIZE,
                registery,
              );
            }
          }
        }
      } else {
        for (const variable in frame) {
          copy[variable] = enterValue(
            /** @type {ExternalValue} */ (frame[variable]),
            INIT_TREE_SIZE,
            registery,
          );
        }
      }
      return copy;
    },
    "program-block@after": (_state, kind, value, _tag) =>
      /** @type {any} */ (
        kind === "deep-local-eval" ? value : leaveValue(value, registery)
      ),
    "closure@after": (_state, kind, value, _tag) => {
      internals.set(/** @type {Reference} */ (value), kind);
      return /** @type {Reference} */ (value);
    },
    "closure-block@after": (_state, _kind, value, _tag) =>
      leaveValue(value, registery),
    "import@after": (_state, _source, _specifier, value, _tag) =>
      enterValue(value, INIT_TREE_SIZE, registery),
    "primitive@after": (_state, primitive, _tag) =>
      enterPrimitive(
        /** @type {ExternalPrimitive} */ (/** @type {unknown} */ (primitive)),
        INIT_TREE_SIZE,
        registery,
      ),
    "test@before": (_state, kind, value, tag) => {
      recordBranch(kind, getTreeSize(value, registery), tag);
      return leaveValue(value, registery);
    },
    "intrinsic@after": (_state, _name, value, _tag) =>
      enterValue(value, INIT_TREE_SIZE, registery),
    "await@before": (_state, value, _tag) => leaveValue(value, registery),
    "await@after": (_state, value, _tag) =>
      enterValue(value, INIT_TREE_SIZE, registery),
    "yield@before": (_state, _delegate, value, _tag) =>
      leaveValue(value, registery),
    "yield@after": (_state, _delegate, value, _tag) =>
      enterValue(value, INIT_TREE_SIZE, registery),
    "export@before": (_state, _specifier, value, _tag) =>
      leaveValue(value, registery),
    "eval@before": (_state, value, _tag) => {
      const root1 = /** @type {import("aran").Program<Atom>} */ (
        /** @type {unknown} */ (leaveValue(value, registery))
      );
      const root2 = weave(root1);
      return /** @type {ExternalValue} */ (/** @type {unknown} */ (root2));
    },
    // around //
    "apply@around": (_state, callee, that, input, _tag) => {
      if (is(callee, getValueProperty) && input.length === 2) {
        const { 0: clean, 1: key } = input;
        const dirty = inputs.get(clean);
        const external = getValueProperty(
          leaveValue(clean, registery),
          leaveValue(clean, registery),
        );
        if (dirty && typeof key === "number" && hasOwn(dirty, key)) {
          const internal = dirty[key];
          if (is(leaveValue(internal, registery), external)) {
            return internal;
          } else {
            return enterValue(
              external,
              1 + computeInputSize(callee, that, input, registery),
              registery,
            );
          }
        }
      }
      {
        const kind = internals.get(callee);
        if (kind != null) {
          transit = true;
          const result = apply(callee, that, input);
          if (isInternalResult(result, kind)) {
            if (isInternalPrimitive(result, registery)) {
              return enterPrimitive(
                leavePrimitive(result),
                1 +
                  getTreeSize(result, registery) +
                  computeInputSize(callee, that, input, registery),
                registery,
              );
            } else {
              return result;
            }
          } else if (isExternalResult(result, kind)) {
            if (isExternalPrimitive(result)) {
              throw new Error(`expect reference result for ${kind}`);
            } else {
              return result;
            }
          } else {
            throw new Error(`unexpected closure kind ${kind}`);
          }
        }
      }
      {
        const result = apply(
          leaveValue(callee, registery),
          leaveValue(that, registery),
          toArray(input, (value) => leaveValue(value, registery)),
        );
        if (isExternalPrimitive(result)) {
          return enterPrimitive(
            result,
            1 + computeInputSize(callee, that, input, registery),
            registery,
          );
        } else {
          return result;
        }
      }
    },
    "construct@around": (_state, callee, input, _tag) => {
      if (internals.has(callee)) {
        return construct(callee, input);
      }
      return construct(
        leaveValue(callee, registery),
        toArray(input, (value) => leaveValue(value, registery)),
      );
    },
  };
};
