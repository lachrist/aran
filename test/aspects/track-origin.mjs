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

export const ADVICE_GLOBAL_VARIABLE = "__aran_track_origin_advice__";

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

const conf = {
  advice_global_variable: ADVICE_GLOBAL_VARIABLE,
  initial_state: null,
  pointcut,
};

/**
 * @type {<
 *   arg_atom extends import("aran").Atom & { Tag: import("aran").Json },
 *   res_atom extends import("aran").Atom & { Tag: arg_atom["Tag"] },
 * >(
 *   root: import("aran").Program<arg_atom>,
 * ) => import("aran").Program<res_atom>}
 */
export const weave = (root) => weaveStandard(root, conf);

/**
 * @type {<atom extends import("aran").Atom>(
 *   parent: null | import("./track-origin").ShadowState<atom>,
 * ) => import("./track-origin").ShadowState<atom>}
 */
const extendState = (parent) => ({
  parent,
  frame: /** @type {any} */ ({ __proto__: null }),
  stack: [],
});

/**
 * @type {<atom extends import("aran").Atom>(
 *   transit: import("./track-origin").Transit<atom>
 * ) => import("./track-origin").Transit<atom>}
 */
const avoidTransitNarrowing = (transit) => transit;

/**
 * @template {import("aran").Atom} atom
 * @param {{
 *   apply: (
 *     callee: import("./track-origin").Value,
 *     that: import("./track-origin").Value,
 *     input: import("./track-origin").Value[],
 *   ) => import("./track-origin").Value,
 *   construct: (
 *     callee: import("./track-origin").Value,
 *     input: import("./track-origin").Value[],
 *   ) => import("./track-origin").Value,
 * }} Reflect
 * @returns {import("aran").StandardAdvice<{
 *   Label: atom["Label"],
 *   Variable: atom["Variable"],
 *   Specifier: atom["Specifier"],
 *   Source: atom["Source"],
 *   Tag: atom["Tag"],
 *   Kind: import("./track-origin").AspectKind,
 *   State: import("./track-origin").ShadowState<atom>,
 *   StackValue: import("./track-origin").Value,
 *   ScopeValue: import("./track-origin").Value,
 *   OtherValue: import("./track-origin").Value,
 * }>}
 */
export const createTrackOriginAdvice = ({ apply, construct }) => {
  /** @type {import("./track-origin").Transit<atom>} */
  let transit = { type: "void" };
  /** @type {null | import("./track-origin").ShadowState<atom>} */
  let deep_eval_state = null;
  return {
    "block@setup": (_state, kind, _location) => {
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
    "block@declaration": (state, _kind, frame, location) => {
      const identifiers = listKey(frame);
      const { length } = identifiers;
      for (let index = 0; index < length; index++) {
        const identifier = identifiers[index];
        state.frame[identifier] = {
          type: "initial",
          identifier,
          location,
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
          location,
        };
      }
      return frame;
    },
    "program-block@after": (state, _kind, value, _location) => {
      transit = { type: "return", source: value, shadow: pop(state.stack) };
      return value;
    },
    "closure-block@after": (state, _kind, value, _location) => {
      transit = { type: "return", source: value, shadow: pop(state.stack) };
      return value;
    },
    // Call //
    "apply@around": (state, callee, that, input, location) => {
      const shadow_input = [];
      for (let index = input.length - 1; index >= 0; index -= 1) {
        shadow_input[index] = pop(state.stack);
      }
      const shadow_that = pop(state.stack);
      const shadow_callee = pop(state.stack);
      transit = avoidTransitNarrowing({
        type: "apply",
        source: {
          function: callee,
          this: that,
          arguments: input,
        },
        shadow: {
          function: shadow_callee,
          this: shadow_that,
          arguments: shadow_input,
        },
      });
      const result = apply(callee, that, input);
      if (transit.type === "return" && isSame(transit.source, result)) {
        push(state.stack, transit.shadow);
      } else {
        push(state.stack, {
          type: "apply",
          function: shadow_callee,
          this: shadow_that,
          arguments: shadow_input,
          location,
        });
      }
      return result;
    },
    "construct@around": (state, callee, input, location) => {
      const shadow_input = [];
      for (let index = input.length - 1; index >= 0; index -= 1) {
        shadow_input[index] = pop(state.stack);
      }
      const shadow_callee = pop(state.stack);
      transit = avoidTransitNarrowing({
        type: "construct",
        source: {
          function: callee,
          arguments: input,
        },
        shadow: {
          function: shadow_callee,
          arguments: shadow_input,
        },
      });
      const result = construct(callee, input);
      if (transit.type === "return" && isSame(transit.source, result)) {
        push(state.stack, transit.shadow);
      } else {
        push(state.stack, {
          type: "construct",
          function: shadow_callee,
          arguments: shadow_input,
          location,
        });
      }
      return result;
    },
    "primitive@after": (state, value, location) => {
      push(state.stack, {
        type: "primitive",
        value: typeof value === "bigint" ? { bigint: String(value) } : value,
        location,
      });
      return /** @type {import("./track-origin").Value} */ (
        /** @type {unknown} */ (value)
      );
    },
    "intrinsic@after": (state, name, value, location) => {
      push(state.stack, {
        type: "intrinsic",
        name,
        location,
      });
      return value;
    },
    "import@after": (state, source, specifier, value, location) => {
      push(state.stack, {
        type: "import",
        source,
        specifier,
        location,
      });
      return value;
    },
    "read@after": (state, variable, value, _location) => {
      /** @type {import("./track-origin").ShadowState<atom> | null} */
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
    "closure@after": (state, kind, value, location) => {
      push(state.stack, {
        type: "closure",
        kind,
        location,
      });
      return value;
    },
    // Consume //
    "test@before": (state, _kind, value, _location) => {
      pop(state.stack);
      return value;
    },
    "write@before": (state, variable, value, _location) => {
      /** @type {import("./track-origin").ShadowState<atom> | null} */
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
    "export@before": (state, _specifier, value, _location) => {
      pop(state.stack);
      return value;
    },
    "drop@before": (state, value, _location) => {
      pop(state.stack);
      return value;
    },
    // Jump //
    "eval@before": (state, value, _location) => {
      if (deep_eval_state !== null) {
        throw new AranExecError("deep eval state clash");
      }
      deep_eval_state = state;
      return /** @type {any} */ (weave(/** @type {any} */ (value)));
    },
    "eval@after": (state, value, _location) => {
      if (transit.type === "return" && isSame(value, transit.source)) {
        push(state.stack, transit.shadow);
      } else {
        throw new AranExecError("expected return transit after eval");
      }
      return value;
    },
    "await@before": (state, value, _location) => {
      pop(state.stack);
      return value;
    },
    "await@after": (state, value, location) => {
      push(state.stack, {
        type: "resolve",
        location,
      });
      return value;
    },
    "yield@before": (state, _delegate, value, _location) => {
      pop(state.stack);
      return value;
    },
    "yield@after": (state, _delegate, value, location) => {
      push(state.stack, {
        type: "resume",
        location,
      });
      return value;
    },
  };
};
