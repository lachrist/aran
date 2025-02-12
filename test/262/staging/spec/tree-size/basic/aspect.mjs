import { weaveStandard } from "aran";
import { AranExecError } from "../../../../error.mjs";
import { compileInterceptEval, map, reduce } from "../../../helper.mjs";

const {
  Error,
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

/**
 * @typedef {WeakMap<InternalPrimitive, TreeSize>} PrimitiveRegistery
 * @typedef {WeakMap<Reference, import("aran").ClosureKind>} ClosureRegistery
 * @typedef {WeakMap<Reference, InternalValue[]>} InputRegistery
 * @typedef {string & { __brand: "NodeHash" }} NodeHash
 * @typedef {import("aran").Atom & { Tag: NodeHash }} Atom
 * @typedef {string & { __brand: "FilePath" }} FilePath
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
 * ) => import("aran").Program<Atom>}
 */
export const weave = (root) =>
  weaveStandard(root, {
    advice_global_variable,
    initial_state: external_program_transit,
    pointcut,
  });

/**
 * @type {import("aran").Digest<{
 *   NodeHash: NodeHash,
 * }>}
 */
export const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}:${node_path}`);

/**
 * @type {(hash: NodeHash) => FilePath}
 */
export const toEvalPath = (hash) =>
  /** @type {FilePath} */ (`dynamic://eval/local/${hash}`);

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
 *   registery: null | InputRegistery,
 *   reference: Reference,
 *   input: InternalValue[],
 * ) => void}
 */
const registerInput = (registery, reference, input) => {
  if (registery !== null) {
    apply(setWeakMap, registery, [reference, input]);
  }
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
 * @type {(
 *   config: {
 *     toEvalPath: (hash: NodeHash) => FilePath,
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
 *       size: TreeSize,
 *       tag: NodeHash,
 *     ) => void,
 *     procedural: "inter" | "intra",
 *   },
 * ) => import("aran").StandardAdvice<{
 *   State: boolean,
 *   Tag: NodeHash,
 *   Kind: AspectKind,
 *   ScopeValue: InternalValue,
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
  procedural,
}) => {
  const inter_procedural_tracking = procedural === "inter";
  /** @type {PrimitiveRegistery} */
  const primitive_registery = new WeakMap();
  /** @type {null | ClosureRegistery} */
  const closure_registery = inter_procedural_tracking ? new WeakMap() : null;
  /** @type {null | InputRegistery} */
  const input_registery = inter_procedural_tracking ? new WeakMap() : null;
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
          : enterValue(result, init_tree_size, primitive_registery);
      } else {
        return enterValue(result, init_tree_size, primitive_registery);
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
          return enterValue(result, init_tree_size, primitive_registery);
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
      init_tree_size,
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
        enterValue: (value) =>
          enterValue(value, init_tree_size, primitive_registery),
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
    "block@declaration-overwrite": (transit, kind, frame, _tag) => {
      const copy = /** @type {{[key in string]: InternalValue}} */ (
        /** @type {unknown} */ ({
          __proto__: null,
        })
      );
      if (transit && isClosureKind(kind)) {
        for (const variable in frame) {
          if (variable === "this") {
            if (!("new.target" in frame)) {
              throw new AranExecError("missing new.target", { frame });
            }
            copy[variable] = frame["new.target"]
              ? enterPrimitive(
                  /** @type {ExternalPrimitive} */ (
                    /** @type {unknown} */ (frame[variable])
                  ),
                  init_tree_size,
                  primitive_registery,
                )
              : /** @type {InternalValue} */ (frame[variable]);
          } else if (variable === "function.arguments") {
            const input = /** @type {InternalValue[]} */ (
              /** @type {unknown} */ (frame[variable])
            );
            const reference = createArray(
              map(input, (value) => leaveValue(value, primitive_registery)),
            );
            registerInput(input_registery, reference, input);
            copy[variable] = reference;
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
    "apply@around": (_transit, callee, that, input, tag) => {
      const result = apply(callee, that, input, tag);
      if (isInternalPrimitive(result, primitive_registery)) {
        return enterPrimitive(
          leavePrimitive(result),
          reduce(
            input,
            (size, value) => size + getTreeSize(value, primitive_registery),
            1 +
              getTreeSize(callee, primitive_registery) +
              getTreeSize(that, primitive_registery) +
              getTreeSize(result, primitive_registery),
          ),
          primitive_registery,
        );
      } else {
        return result;
      }
    },
    "construct@around": (_transit, callee, input, tag) =>
      construct(callee, input, tag),
  };
};
