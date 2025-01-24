import { weaveStandard } from "aran";

const {
  String,
  Reflect: { ownKeys },
  Object: { hasOwn, is },
} = globalThis;

/**
 * @type {<O>(
 *   object: O,
 * ) => (keyof O)[]}
 */
const listKey = /** @type {any} */ (ownKeys);

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

export const ADVICE_GLOBAL_VARIABLE =
  /** @type {import("./track-origin").JavaScriptIdentifier}*/ (
    "__aran_track_origin_advice__"
  );

/**
 * @type {{[key in import("./track-origin").AspectKind]: null}}
 */
const aspect_kind_enum = {
  "block@setup": null,
  "block@declaration": null,
  "program-block@after": null,
  "closure-block@after": null,
  "apply@around": null,
  "construct@around": null,
  "primitive@after": null,
  "intrinsic@after": null,
  "import@after": null,
  "read@after": null,
  "closure@after": null,
  "test@before": null,
  "write@before": null,
  "export@before": null,
  "drop@before": null,
  "eval@before": null,
  "eval@after": null,
  "await@before": null,
  "await@after": null,
  "yield@before": null,
  "yield@after": null,
};

const pointcut = listKey(aspect_kind_enum);

/**
 * @type {import("aran").StandardWeaveConfig<{
 *   Atom: import("./track-origin").Atom,
 *   InitialState: null,
 *   JavaScriptIdentifier: import("./track-origin").JavaScriptIdentifier,
 * }>}
 */
const conf = {
  advice_global_variable: ADVICE_GLOBAL_VARIABLE,
  initial_state: null,
  pointcut,
};

/**
 * @type {(
 *   root: import("aran").Program<import("./track-origin").Atom>,
 * ) => import("aran").Program<import("./track-origin").Atom>}
 */
export const weave = (root) => weaveStandard(root, conf);

/**
 * @type {(
 *   parent: null | import("./track-origin").ShadowState,
 * ) => import("./track-origin").ShadowState}
 */
const extendState = (parent) => ({
  parent,
  frame: /** @type {any} */ ({ __proto__: null }),
  stack: [],
});

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
 * ) => import("aran").StandardAdvice<{
 *   Kind: import("./track-origin").AspectKind,
 *   Atom: import("./track-origin").Atom,
 *   Runtime: {
 *     State: import("./track-origin").ShadowState,
 *     StackValue: import("./track-origin").Value,
 *     ScopeValue: import("./track-origin").Value,
 *     OtherValue: import("./track-origin").Value,
 *   },
 * }>}
 */
export const createTrackOriginAdvice = ({ apply, construct }) => {
  /** @type {import("./track-origin").Transit} */
  let transit = { type: "void" };
  /** @type {null | import("./track-origin").ShadowState} */
  let deep_eval_state = null;
  return {
    "block@setup": (_state, kind, _hash) => {
      if (kind === "deep-local-eval") {
        if (deep_eval_state === null) {
          throw new AranExecError("missing deep eval state");
        } else {
          const state = extendState(deep_eval_state);
          deep_eval_state = null;
          return state;
        }
      } else {
        return extendState(null);
      }
    },
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
    "eval@before": (state, value, _hash) => {
      if (deep_eval_state !== null) {
        throw new AranExecError("deep eval state clash");
      }
      deep_eval_state = state;
      return /** @type {any} */ (weave(/** @type {any} */ (value)));
    },
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
};
