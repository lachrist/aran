/* eslint-disable */
/** @typedef {string} Variable */
/** @typedef {unknown & {__brand: "value"}} Value */
/** @typedef {Record<Variable, Value>} Frame */
/** @typedef {{parent: State | null, frame: Frame, stack: Value[]}} State */
/** @type {<X>(array: X[], item: X) => X} */
const pop = (stack, item) => {
  if (stack.length === 0) throw new Error("Empty stack");
  if (!Object.is(stack[stack.length - 1], item))
    throw new Error("Stack value mismatch");
  stack.length--;
  return item;
};
/** @type {<X>(array: X[], item: X) => item} */
const push = (stack, item) => {
  stack.push(item);
  return item;
};
/**
 * @type {(
 *   config: {
 *     intrinsics: Record<string, Value>,
 *     instrumentLocalEvalCode: (
 *       code: string,
 *       situ: import("../../lib/source").DeepLocalSitu,
 *     ) => string,
 *   },
 * ) => import("../../lib").StandardAdvice<
 *   unknown,
 *   State,
 *   { Other: Value, Stack: Value, Scope: Value },
 * >}
 */
export const makeShadowAdvice = ({ intrinsics, instrumentLocalEvalCode }) => {
  /** @type {<X>(callee: X, that: X, args: X[]) => X} */
  const apply = /** @type {any} */ (intrinsics["Reflect.apply"]);
  /** @type {<X>(callee: X, args: X[]) => X} */
  const construct = /** @type {any} */ (intrinsics["Reflect.construct"]);
  return {
    // Block //
    "block@setup": (state, _kind, _hash) => ({
      parent: state,
      frame: /** @type {any} */ ({ __proto__: null }),
      stack: [],
    }),
    "block@declaration": (state, _kind, frame, _hash) => {
      Object.assign(state.frame, frame);
    },
    "program-block@after": (state, _kind, result, _hash) =>
      pop(state.stack, result),
    "closure-block@after": (state, _kind, result, _hash) =>
      pop(state.stack, result),
    // Around //
    "apply@around": (state, callee, that, args, _hash) => {
      for (let index = args.length - 1; index >= 0; index -= 1)
        pop(state.stack, args[index]);
      pop(state.stack, that);
      pop(state.stack, callee);
      return push(state.stack, apply(callee, that, args));
    },
    "construct@around": (state, callee, args, _hash) => {
      for (let index = args.length - 1; index >= 0; index -= 1)
        pop(state.stack, args[index]);
      pop(state.stack, callee);
      return push(state.stack, construct(callee, args));
    },
    // Scope //
    "read@after": (state, variable, result, _hash) => {
      /** @type {State | null} */
      let current = state;
      while (current !== null) {
        if (variable in current.frame) {
          if (!Object.is(current.frame[variable], result))
            throw new Error("Scope value mismatch");
          return push(state.stack, result);
        }
        current = current.parent;
      }
      throw new Error("Missing variable");
    },
    "write@before": (state, variable, right, _hash) => {
      /** @type {State | null} */
      let current = state;
      while (current !== null) {
        if (variable in current.frame) {
          current.frame[variable] = right;
          return pop(state.stack, right);
        }
        current = current.parent;
      }
      throw new Error("missing variable");
    },
    // Producer //
    "primitive@after": (state, result, _hash) => push(state.stack, result),
    "intrinsic@after": (state, _name, result, _hash) =>
      push(state.stack, result),
    "import@after": (state, _source, _specifier, result, _hash) =>
      push(state.stack, result),
    "closure@after": (state, _kind, result, _hash) => push(state.stack, result),
    // Consumer //
    "test@before": (state, _kind, decision, _hash) =>
      !!pop(state.stack, decision),
    "export@before": (state, _specifier, right, _hash) =>
      pop(state.stack, right),
    "drop@before": (state, discard, _hash) => pop(state.stack, discard),
    // Hiatus //
    "eval@before": (state, situ, code, _hash) => {
      pop(state.stack, code);
      if (typeof code !== "string") return code;
      return instrumentLocalEvalCode(code, situ);
    },
    "eval@after": (state, result, _hash) => push(state.stack, result),
    "await@before": (state, promise, _hash) => pop(state.stack, promise),
    "await@after": (state, result, _hash) => push(state.stack, result),
    "yield@before": (state, _delegate, item, _hash) => pop(state.stack, item),
    "yield@after": (state, _delegate, result, _hash) =>
      push(state.stack, result),
  };
};
