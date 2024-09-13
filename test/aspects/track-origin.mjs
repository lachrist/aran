const {
  String,
  Object: { hasOwn, is },
} = globalThis;

/**
 * @type {(
 *   value1: import("./track-origin").Value,
 *   value2: import("./track-origin").Value,
 * ) => boolean}
 */
const isSame = is;

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
 *   membrane: import("../262/aran/membrane").BasicMembrane,
 * ) => import("../../lib").StandardAdvice<
 *   import("./track-origin").ShadowState,
 *   import("./track-origin").Valuation,
 * >}
 */
export const makeTrackOriginAdvice = ({
  intrinsics,
  instrumentLocalEvalCode,
}) => {
  /** @type {import("./track-origin").Transit} */
  let transit = { type: "void" };
  /**
   * @type {import("../../lib").StandardAdvice<
   *   import("./track-origin").ShadowState,
   *   import("./track-origin").Valuation,
   * >}
   */
  return {
    "block@setup": (state, _kind, _path) => ({
      parent: state,
      frame: { __proto__: null },
      stack: [],
    }),
    "block@declaration": (state, _kind, frame, path) => {
      for (const key in frame) {
        state.frame[/** @type {import("./track-origin").Key} */ (key)] = {
          type: "initial",
          variable: /** @type {import("./track-origin").Key} */ (key),
          path,
        };
      }
      if (
        (transit.type === "apply" || transit.type === "construct") &&
        isSame(
          transit.source.function,
          /** @type {import("./track-origin").Value} */ (
            frame["function.callee"]
          ),
        )
      ) {
        state.frame["function.callee"] = transit.shadow.function;
        if (transit.type === "apply") {
          state.frame.this = transit.shadow.this;
        }
        state.frame["function.arguments"] = {
          type: "arguments",
          values: transit.shadow.arguments,
          path,
        };
      }
      return frame;
    },
    "program-block@after": (state, _kind, value, _path) => {
      transit = { type: "return", source: value, shadow: pop(state.stack) };
      return value;
    },
    "closure-block@after": (state, _kind, value, _path) => {
      transit = { type: "return", source: value, shadow: pop(state.stack) };
      return value;
    },
    // Call //
    "apply@around": (state, function_, this_, arguments_, path) => {
      const shadow_argument_array = [];
      for (let index = arguments_.length - 1; index >= 0; index -= 1) {
        shadow_argument_array[index] = pop(state.stack);
      }
      const shadow_this = pop(state.stack);
      const shadow_function = pop(state.stack);
      transit = /** @type {import("./track-origin").Transit} */ ({
        type: "apply",
        source: {
          function: function_,
          this: this_,
          arguments: arguments_,
        },
        shadow: {
          function: shadow_function,
          this: shadow_this,
          arguments: shadow_argument_array,
        },
      });
      const result = /** @type {import("./track-origin").Value} */ (
        intrinsics["Reflect.apply"](
          /** @type {any} */ (function_),
          this_,
          arguments_,
        )
      );
      if (transit.type === "return" && isSame(transit.source, result)) {
        push(state.stack, transit.shadow);
      } else {
        push(state.stack, {
          type: "apply",
          function: shadow_function,
          this: shadow_this,
          arguments: shadow_argument_array,
          path,
        });
      }
      return result;
    },
    "construct@around": (state, function_, arguments_, path) => {
      const shadow_argument_array = [];
      for (let index = arguments_.length - 1; index >= 0; index -= 1) {
        shadow_argument_array[index] = pop(state.stack);
      }
      const shadow_function = pop(state.stack);
      transit = /** @type {import("./track-origin").Transit} */ ({
        type: "construct",
        source: {
          function: function_,
          arguments: arguments_,
        },
        shadow: {
          function: shadow_function,
          arguments: shadow_argument_array,
        },
      });
      const result = /** @type {import("./track-origin").Value} */ (
        intrinsics["Reflect.construct"](
          /** @type {any} */ (function_),
          arguments_,
        )
      );
      if (transit.type === "return" && isSame(transit.source, result)) {
        push(state.stack, transit.shadow);
      } else {
        push(state.stack, {
          type: "construct",
          function: shadow_function,
          arguments: shadow_argument_array,
          path,
        });
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
      /** @type {import("./track-origin").ShadowState | null} */
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
      /** @type {import("./track-origin").ShadowState | null} */
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
        return instrumentLocalEvalCode(value, path, reboot);
      } else {
        transit = { type: "return", source: value, shadow: pop(state.stack) };
        return value;
      }
    },
    "eval@after": (state, value, _path) => {
      if (transit.type === "return" && isSame(value, transit.source)) {
        push(state.stack, transit.shadow);
      } else {
        throw new AranExecError("expected return transit after eval");
      }
      return value;
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
