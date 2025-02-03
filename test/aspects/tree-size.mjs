import { weaveStandard } from "aran";

const {
  Object: { keys },
  Array: { from: toArray },
  Reflect: { apply },
  WeakMap,
  WeakMap: {
    prototype: { set: setWeakMap, get: getWeakMap, has: hasWeakMap },
  },
} = globalThis;

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
 * @typedef {{ __brand: ExternalPrimitive }} ExternalPrimitive
 * @typedef {{ __brand: InternalPrimitive }} InternalPrimitive
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
 *   | "await@before"
 *   | "await@after"
 *   | "yield@before"
 *   | "yield@after"
 *   | "export@before"
 *   | "eval@before"
 *   | "apply@around"
 *   | "construct@around"
 * )} AspectKind
 */

const listKey = /**
 * @type {<K extends PropertyKey>(record: {[k in K]: unknown}) => K[]}
 */ (keys);

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
 *   value: ExternalValue,
 *   registery: Registery,
 * ) => InternalValue}
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
 * @type {<T extends import("aran").Json>(
 *   Reflect: {
 *     apply: (
 *       callee: ExternalValue,
 *       that: ExternalValue,
 *       args: ExternalValue[],
 *     ) => ExternalValue,
 *     construct: (
 *       callee: ExternalValue,
 *       args: ExternalValue[],
 *     ) => ExternalValue,
 *   },
 *   branch: (
 *     kind: import("aran").TestKind,
 *     size: TreeSize,
 *     tag: T,
 *   ) => void,
 * ) => import("aran").StandardAdvice<{
 *   Tag: T,
 *   Kind: AspectKind,
 *   ScopeValue: InternalValue,
 *   StackValue: InternalValue,
 *   OtherValue: ExternalValue,
 * }>}
 */
export const createAdvice = ({ apply, construct }, branch) => {
  /** @type {Registery} */
  const registery = new WeakMap();
  return {
    "block@declaration-overwrite": (_state, _kind, frame, _tag) => {
      const copy = /** @type {{[key in string]: InternalValue}} */ (
        /** @type {unknown} */ ({
          __proto__: null,
        })
      );
      for (const variable in frame) {
        copy[variable] = enterValue(
          /** @type {ExternalValue} */ (frame[variable]),
          INIT_TREE_SIZE,
          registery,
        );
      }
      return copy;
    },
    "program-block@after": (_state, kind, value, _tag) =>
      kind === "deep-local-eval" ? value : leaveValue(value, registery),
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
      branch(kind, getTreeSize(value, registery), tag);
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
    "apply@around": (_state, callee, that, input, _tag) =>
      enterValue(
        apply(
          leaveValue(callee, registery),
          leaveValue(that, registery),
          toArray(input, (value) => leaveValue(value, registery)),
        ),
        reduce(
          input,
          (size, value) => size + getTreeSize(value, registery),
          1 + getTreeSize(callee, registery) + getTreeSize(that, registery),
        ),
        registery,
      ),
    "construct@around": (_state, callee, input, _tag) =>
      enterValue(
        construct(
          leaveValue(callee, registery),
          toArray(input, (value) => leaveValue(value, registery)),
        ),
        reduce(
          input,
          (size, value) => size + getTreeSize(value, registery),
          1 + getTreeSize(callee, registery),
        ),
        registery,
      ),
  };
};
