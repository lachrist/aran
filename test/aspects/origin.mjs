const {
  WeakSet,
  WeakSet: {
    prototype: { has: hasWeakSet, add: addWeakSet },
  },
  Reflect: { apply },
  String,
  Object: { hasOwn },
} = globalThis;

/** @type {import("./origin").Transit} */
const VOID_TRANSIT = { type: "void" };

/* eslint-disable */
class AranExecError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranExecError";
  }
}
/* eslint-enable */

/* eslint-disable */
class AranTypeError extends Error {
  constructor(/** @type {never} */ data) {
    super("type error");
    this.name = "AranTypeError";
  }
}
/* eslint-enable */

/**
 * @type {<X>(
 *   array: X[],
 * ) => X}
 */
const pop = (array) => {
  const { length } = array;
  if (length === 0) {
    throw new AranExecError("Cannot pop from empty array");
  } else {
    const last = array[length - 1];
    array.length -= 1;
    return last;
  }
};

/**
 * @type {<X>(
 *   array: X[],
 *   item: X,
 * ) => void}
 */
const push = (array, item) => {
  array[array.length] = item;
};

/**
 * @type {(
 *   membrane: {
 *     intrinsics: import("../../lib").IntrinsicRecord,
 *     instrumentDeep: import("../262/aran").InstrumentDeep,
 *   },
 * ) => import("../../lib").StandardAdvice<
 *   import("./origin").ShadowState,
 *   import("./origin").Valuation,
 * >}
 */
export const makeOriginAdvice = ({ intrinsics, instrumentDeep }) => {
  /** @type {import("./origin").Transit} */
  let transit = VOID_TRANSIT;
  /** @type {WeakSet<Function>} */
  const closures = new WeakSet();
  /**
   * @type {import("../../lib").StandardAdvice<
   *   import("./origin").ShadowState,
   *   import("./origin").Valuation,
   * >}
   */
  return {
    "block@setup": (state, _kind, _path) => {
      const copy = transit;
      transit = VOID_TRANSIT;
      return {
        parent: state,
        transit: copy,
        frame: { __proto__: null },
        stack: [],
      };
    },
    "block@declaration": (state, _kind, frame, path) => {
      for (const key in frame) {
        state.frame[/** @type {import("./origin").Key} */ (key)] = {
          type: "initial",
          variable: /** @type {import("./origin").Key} */ (key),
          path,
        };
      }
      if (
        state.transit.type === "apply" ||
        state.transit.type === "construct"
      ) {
        state.frame["function.callee"] = state.transit.callee;
        if (state.transit.type === "apply") {
          state.frame.this = state.transit.this;
        }
        state.frame["function.arguments"] = {
          type: "arguments",
          values: state.transit.arguments,
          path,
        };
      }
      return frame;
    },
    "program-block@after": (state, _kind, value, _path) => {
      if (state.transit.type === "eval") {
        transit = { type: "return", result: pop(state.stack) };
      } else if (state.transit.type === "void") {
        pop(state.stack);
      } else if (
        state.transit.type === "return" ||
        state.transit.type === "apply" ||
        state.transit.type === "construct"
      ) {
        throw new AranExecError("unexpected transit");
      } else {
        throw new AranTypeError(state.transit);
      }
      return value;
    },
    "closure-block@after": (state, kind, value, _path) => {
      if (
        state.transit.type === "apply" ||
        state.transit.type === "construct"
      ) {
        if (
          kind === "generator" ||
          kind === "async-generator" ||
          kind === "async-method" ||
          kind === "async-function"
        ) {
          pop(state.stack);
        } else {
          transit = { type: "return", result: pop(state.stack) };
        }
      } else if (state.transit.type === "void") {
        pop(state.stack);
      } else if (
        state.transit.type === "return" ||
        state.transit.type === "eval"
      ) {
        throw new AranExecError("unexpected transit");
      } else {
        throw new AranTypeError(state.transit);
      }
      return value;
    },
    // Call //
    "apply@around": (state, callee, this_, arguments_, path) => {
      const shadow_argument_array = [];
      for (let index = arguments_.length - 1; index >= 0; index -= 1) {
        shadow_argument_array[index] = pop(state.stack);
      }
      const shadow_this = pop(state.stack);
      const shadow_callee = pop(state.stack);
      /** @type {import("./origin").ShadowValue} */
      const shadow_result = {
        type: "apply",
        callee: shadow_callee,
        this: shadow_this,
        arguments: shadow_argument_array,
        path,
      };
      if (apply(hasWeakSet, closures, [callee])) {
        if (transit.type === "void") {
          transit = shadow_result;
        } else {
          throw new AranExecError("expected no transit");
        }
      }
      const result = /** @type {import("./origin").Value} */ (
        intrinsics["Reflect.apply"](
          /** @type {any} */ (callee),
          this_,
          arguments_,
        )
      );
      if (transit.type === "return") {
        push(state.stack, transit.result);
        transit = VOID_TRANSIT;
      } else if (transit.type === "void") {
        push(state.stack, shadow_result);
      } else {
        throw new AranExecError("expected return transit");
      }
      return result;
    },
    "construct@around": (state, callee, arguments_, path) => {
      const shadow_argument_array = [];
      for (let index = arguments_.length - 1; index >= 0; index -= 1) {
        shadow_argument_array[index] = pop(state.stack);
      }
      const shadow_callee = pop(state.stack);
      /** @type {import("./origin").ShadowValue} */
      const shadow_result = {
        type: "construct",
        callee: shadow_callee,
        arguments: shadow_argument_array,
        path,
      };
      if (apply(hasWeakSet, closures, [callee])) {
        if (transit.type === "void") {
          transit = shadow_result;
        } else {
          throw new AranExecError("expected no transit");
        }
      }
      const result = /** @type {import("./origin").Value} */ (
        intrinsics["Reflect.construct"](/** @type {any} */ (callee), arguments_)
      );
      if (transit.type === "return") {
        push(state.stack, transit.result);
        transit = VOID_TRANSIT;
      } else if (transit.type === "void") {
        push(state.stack, shadow_result);
      } else {
        throw new AranExecError("expected return transit");
      }
      return result;
    },
    "primitive@after": (state, value, path) => {
      push(state.stack, {
        type: "primitive",
        value: typeof value === "bigint" ? { bigint: String(value) } : value,
        path,
      });
      return value;
    },
    "intrinsic@after": (state, name, value, path) => {
      push(state.stack, {
        type: "intrinsic",
        name,
        path,
      });
      return value;
    },
    "import@after": (state, source, specifier, value, path) => {
      push(state.stack, {
        type: "import",
        source,
        specifier,
        path,
      });
      return value;
    },
    "read@after": (state, variable, value, _path) => {
      /** @type {import("./origin").ShadowState | null} */
      let current = state;
      while (current !== null) {
        if (hasOwn(current.frame, variable)) {
          push(state.stack, current.frame[variable]);
          return value;
        }
        current = current.parent;
      }
      throw new AranExecError("missing variable");
    },
    "closure@after": (state, kind, value, path) => {
      apply(addWeakSet, closures, [value]);
      push(state.stack, {
        type: "closure",
        kind,
        path,
      });
      return value;
    },
    // Consume //
    "test@before": (state, _kind, value, _path) => {
      pop(state.stack);
      return !!value;
    },
    "write@before": (state, variable, value, _path) => {
      /** @type {import("./origin").ShadowState | null} */
      let current = state;
      while (current !== null) {
        if (hasOwn(current.frame, variable)) {
          current.frame[variable] = pop(state.stack);
          return value;
        }
        current = current.parent;
      }
      throw new AranExecError("missing variable");
    },
    "export@before": (state, _specifier, value, _path) => {
      pop(state.stack);
      return value;
    },
    "drop@before": (state, value, _path) => {
      pop(state.stack);
      return value;
    },
    // Jump //
    "eval@before": (state, reboot, value, path) => {
      if (typeof value === "string") {
        pop(state.stack);
        return instrumentDeep(value, path, reboot);
      } else {
        transit = { type: "return", result: pop(state.stack) };
        return value;
      }
    },
    "eval@after": (state, value, _path) => {
      if (transit.type === "return") {
        push(state.stack, transit.result);
        transit = VOID_TRANSIT;
        return value;
      } else {
        throw new AranExecError("expected return transit");
      }
    },
    "await@before": (state, value, _path) => {
      pop(state.stack);
      return value;
    },
    "await@after": (state, value, path) => {
      push(state.stack, {
        type: "resolve",
        path,
      });
      return value;
    },
    "yield@before": (state, _delegate, value, _path) => {
      pop(state.stack);
      return value;
    },
    "yield@after": (state, _delegate, value, path) => {
      push(state.stack, {
        type: "resume",
        path,
      });
      return value;
    },
  };
};
