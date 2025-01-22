import { weaveStandard } from "aran";

const {
  String,
  Reflect: { ownKeys },
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
 * @type {import("aran").StandardAspectKind[]}
 */
export const pointcut = [
  "block@setup",
  "block@declaration",
  "program-block@after",
  "closure-block@after",
  "apply@around",
  "construct@around",
  "primitive@after",
  "intrinsic@after",
  "import@after",
  "read@after",
  "closure@after",
  "test@before",
  "write@before",
  "export@before",
  "drop@before",
  "eval@before",
  "eval@after",
  "await@before",
  "await@after",
  "yield@before",
  "yield@after",
];

/**
 * @type {(
 *   Reflect: {
 *     apply: (
 *       callee: import("./track-origin").Value,
 *       that: import("./track-origin").Value,
 *       input: import("./track-origin").Value[],
 *     ) => import("./track-origin").Value,
 *     construct: (
 *       callee: import("./track-origin").Value,
 *       input: import("./track-origin").Value[],
 *     ) => import("./track-origin").Value,
 *   },
 *   options: {
 *     advice_global_variable: string,
 *   },
 * ) => import("../../").StandardAdvice<
 *   import("./track-origin").ShadowState,
 *   import("./track-origin").Atom,
 *   import("./track-origin").Valuation,
 * >}
 */
export const createTrackOriginAdvice = (
  { apply, construct },
  { advice_global_variable },
) => {
  /** @type {import("./track-origin").Transit} */
  let transit = { type: "void" };
  /**
   * @type {import("../../").StandardAdvice<
   *   import("./track-origin").ShadowState,
   *   import("./track-origin").Atom,
   *   import("./track-origin").Valuation,
   * >}
   */
  const advice = {
    "block@setup": (state, _kind, _hash) => ({
      parent: state,
      frame: { __proto__: null },
      stack: [],
    }),
    "block@declaration": (state, _kind, frame, hash) => {
      for (const identifier in frame) {
        state.frame[
          /** @type {import("./track-origin").Identifier} */ (identifier)
        ] = {
          type: "initial",
          variable: /** @type {import("./track-origin").Identifier} */ (
            identifier
          ),
          hash,
        };
      }
      if (
        (transit.type === "apply" || transit.type === "construct") &&
        "function.callee" in frame &&
        isSame(transit.source.function, frame["function.callee"])
      ) {
        state.frame["function.callee"] = transit.shadow.function;
        if (transit.type === "apply") {
          state.frame.this = transit.shadow.this;
        }
        state.frame["function.arguments"] = {
          type: "arguments",
          values: transit.shadow.arguments,
          hash,
        };
      }
      return frame;
    },
    "program-block@after": (state, _kind, value, _hash) => {
      transit = { type: "return", source: value, shadow: pop(state.stack) };
      return value;
    },
    "closure-block@after": (state, _kind, value, _hash) => {
      transit = { type: "return", source: value, shadow: pop(state.stack) };
      return value;
    },
    // Call //
    "apply@around": (state, callee, that, input, hash) => {
      const shadow_argument_array = [];
      for (let index = input.length - 1; index >= 0; index -= 1) {
        shadow_argument_array[index] = pop(state.stack);
      }
      const shadow_this = pop(state.stack);
      const shadow_function = pop(state.stack);
      transit = /** @type {import("./track-origin").Transit} */ ({
        type: "apply",
        source: {
          function: callee,
          this: that,
          arguments: input,
        },
        shadow: {
          function: shadow_function,
          this: shadow_this,
          arguments: shadow_argument_array,
        },
      });
      const result = apply(callee, that, input);
      if (transit.type === "return" && isSame(transit.source, result)) {
        push(state.stack, transit.shadow);
      } else {
        push(state.stack, {
          type: "apply",
          function: shadow_function,
          this: shadow_this,
          arguments: shadow_argument_array,
          hash,
        });
      }
      return result;
    },
    "construct@around": (state, callee, input, hash) => {
      const shadow_argument_array = [];
      for (let index = input.length - 1; index >= 0; index -= 1) {
        shadow_argument_array[index] = pop(state.stack);
      }
      const shadow_function = pop(state.stack);
      transit = /** @type {import("./track-origin").Transit} */ ({
        type: "construct",
        source: {
          function: callee,
          arguments: input,
        },
        shadow: {
          function: shadow_function,
          arguments: shadow_argument_array,
        },
      });
      const result = construct(callee, input);
      if (transit.type === "return" && isSame(transit.source, result)) {
        push(state.stack, transit.shadow);
      } else {
        push(state.stack, {
          type: "construct",
          function: shadow_function,
          arguments: shadow_argument_array,
          hash,
        });
      }
      return result;
    },
    "primitive@after": (state, value, hash) => {
      push(state.stack, {
        type: "primitive",
        value: typeof value === "bigint" ? { bigint: String(value) } : value,
        hash,
      });
      return /** @type {import("./track-origin").Value} */ (
        /** @type {unknown} */ (value)
      );
    },
    "intrinsic@after": (state, name, value, hash) => {
      push(state.stack, {
        type: "intrinsic",
        name,
        hash,
      });
      return value;
    },
    "import@after": (state, source, specifier, value, hash) => {
      push(state.stack, {
        type: "import",
        source,
        specifier,
        hash,
      });
      return value;
    },
    "read@after": (state, variable, value, _hash) => {
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
    "closure@after": (state, kind, value, hash) => {
      push(state.stack, {
        type: "closure",
        kind,
        hash,
      });
      return value;
    },
    // Consume //
    "test@before": (state, _kind, value, _hash) => {
      pop(state.stack);
      return !!value;
    },
    "write@before": (state, variable, value, _hash) => {
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
    "export@before": (state, _specifier, value, _hash) => {
      pop(state.stack);
      return value;
    },
    "drop@before": (state, value, _hash) => {
      pop(state.stack);
      return value;
    },
    // Jump //
    "eval@before": (state, value, _hash) =>
      /** @type {any} */ (
        weaveStandard(/** @type {any} */ (value), {
          initial_state: state,
          pointcut,
          advice_global_variable,
        })
      ),
    "eval@after": (state, value, _hash) => {
      if (transit.type === "return" && isSame(value, transit.source)) {
        push(state.stack, transit.shadow);
      } else {
        throw new AranExecError("expected return transit after eval");
      }
      return value;
    },
    "await@before": (state, value, _hash) => {
      pop(state.stack);
      return value;
    },
    "await@after": (state, value, hash) => {
      push(state.stack, {
        type: "resolve",
        hash,
      });
      return value;
    },
    "yield@before": (state, _delegate, value, _hash) => {
      pop(state.stack);
      return value;
    },
    "yield@after": (state, _delegate, value, hash) => {
      push(state.stack, {
        type: "resume",
        hash,
      });
      return value;
    },
  };
  if (ownKeys(advice).length !== pointcut.length) {
    throw new AranExecError("advice-pointcut arity mismathc");
  }
  for (let index = 0; index < pointcut.length; index++) {
    const kind = pointcut[index];
    if (!hasOwn(advice, kind)) {
      throw new AranExecError(`advice-pointcut kind mismatch ${kind}`);
    }
  }
  return advice;
};
