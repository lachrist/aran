/* eslint-disable local/strict-console */

const {
  undefined,
  Object: { is: same },
  Error,
  WeakMap,
  WeakMap: {
    prototype: { has: hasWeakMap, get: getWeakMap, set: setWeakMap },
  },
  Object: { hasOwn },
  Reflect: { apply, construct },
  console,
  console: { dir },
} = globalThis;

/**
 * @type {<D extends {
 *   state: import("./invariant").State,
 *   point: import("./invariant").Point,
 * }>(
 *   message: string,
 *   data: D,
 *) => Error}
 */
const makeInvariantError = (message, data) => {
  const error = new Error(message);
  error.name = "InvariantError";
  apply(dir, console, [
    {
      error,
      data,
    },
  ]);
  return error;
};

/**
 * @type {<X>(array: X[], element: X) => void}
 */
const push = (array, element) => {
  array[array.length] = element;
};

/**
 * @type {<X>(array: X[]) => null | X}
 */
const peek = (array) => (array.length === 0 ? null : array[array.length - 1]);

/**
 * @type {<X>(array: X[]) => null | X}
 */
const pop = (array) => {
  if (array.length === 0) {
    return null;
  } else {
    const element = array[array.length - 1];
    array.length -= 1;
    return element;
  }
};

/**
 * @type {(
 *   item: import("./invariant").Item | null,
 *   value: import("./invariant").Value,
 *   state: import("./invariant").State,
 *   point: import("./invariant").Point,
 * ) => void}
 */
const consume = (item, value, state, point) => {
  const data = { item, value, state, point };
  if (item === null) {
    throw makeInvariantError("null item", data);
  }
  if (item.type !== "value") {
    throw makeInvariantError("expected value item", data);
  }
  if (!same(item.point.value, value)) {
    throw makeInvariantError("value mismatch", data);
  }
};

const MATCH = {
  "__proto__": null,
  "program.enter": {
    "__proto__": null,
    "program.completion": null,
    "program.failure": null,
    "program.leave": null,
  },
  "closure.enter": {
    "__proto__": null,
    "closure.failure": null,
    "closure.completion": null,
    "closure.leave": null,
  },
  "block.enter": {
    "__proto__": null,
    "block.completion": null,
    "block.failure": null,
    "block.leave": null,
  },
  "apply.before": { "__proto__": null, "apply.after": null },
  "construct.before": { "__proto__": null, "construct.after": null },
  "eval.before": { "__proto__": null, "eval.after": null },
  "conditional.before": { "__proto__": null, "conditional.after": null },
  "debugger.before": { "__proto__": null, "debugger.after": null },
  "branch.before": { "__proto__": null, "branch.after": null },
  "global.read.before": { "__proto__": null, "global.read.after": null },
  "global.typeof.before": { "__proto__": null, "global.typeof.after": null },
  "global.write.before": { "__proto__": null, "global.write.after": null },
  "global.declare.before": { "__proto__": null, "global.declare.after": null },
};

/**
 * @type {(
 *   item: import("./invariant").Item | null,
 *   sate: import("./invariant").State,
 *   point: import("./invariant").Point,
 * ) => void}
 */
const match = (item, state, point) => {
  const data = { item, state, point };
  if (item === null) {
    throw makeInvariantError("null item", data);
  }
  if (item.type === "value") {
    throw makeInvariantError("expected match or frame item", data);
  }
  if (!(point.type in MATCH[item.point.type])) {
    throw makeInvariantError("type mismatch", data);
  }
  if (item.point.location !== point.location) {
    throw makeInvariantError("location mismatch", data);
  }
};

/**
 * @type {(
 *   stack: import("./invariant").Item[],
 *   state: import("./invariant").State,
 *   point: import("./invariant").Point & { type: "read.after" },
 * ) => void}
 */
const read = (stack, state, point) => {
  const data = { state, point };
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const item = stack[index];
    if (item.type === "frame") {
      const { record } = item.point;
      if (hasOwn(record, point.variable)) {
        if (!same(point.value, record[point.variable])) {
          throw makeInvariantError("environment variable mismatch", data);
        }
        return undefined;
      }
    }
  }
  throw makeInvariantError("missing variable", data);
};

/**
 * @type {(
 *   stack: import("./invariant").Item[],
 *   state: import("./invariant").State,
 *   point: import("./invariant").Point & { type: "write.before"},
 * ) => void}
 */
const write = (stack, state, point) => {
  const data = { state, point };
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const item = stack[index];
    if (item.type === "frame") {
      const { record } = item.point;
      if (hasOwn(record, point.variable)) {
        record[point.variable] = point.value;
        return undefined;
      }
    }
  }
  throw makeInvariantError("missing variable", data);
};

/**
 * @type {(
 *   stack: import("./invariant").Item[],
 *   state: import("./invariant").State,
 *   point: import("./invariant").Point & { type: "apply" },
 * ) => import("./invariant").Value}
 */
const applyAdvice = (stack, state, point) => {
  for (let index = point.arguments.length - 1; index >= 0; index -= 1) {
    consume(pop(stack), point.arguments[index], state, point);
  }
  consume(pop(stack), point.this, state, point);
  consume(pop(stack), point.callee, state, point);
  push(stack, {
    type: "match",
    point: {
      ...point,
      type: "apply.before",
    },
  });
  const value = apply(
    /** @type {Function} */ (/** @type {unknown} */ (point.callee)),
    point.this,
    point.arguments,
  );
  match(pop(stack), state, point);
  push(stack, {
    type: "value",
    point: {
      ...point,
      type: "apply.after",
      value,
    },
  });
  return value;
};

/**
 * @type {(
 *   stack: import("./invariant").Item[],
 *   state: import("./invariant").State,
 *   point: import("./invariant").Point & { type: "construct" },
 * ) => import("./invariant").Value}
 */
const constructAdvice = (stack, state, point) => {
  for (let index = point.arguments.length - 1; index >= 0; index -= 1) {
    consume(pop(stack), point.arguments[index], state, point);
  }
  consume(pop(stack), point.callee, state, point);
  push(stack, {
    type: "match",
    point: {
      ...point,
      type: "construct.before",
    },
  });
  const value = construct(
    /** @type {Function} */ (/** @type {unknown} */ (point.callee)),
    point.arguments,
  );
  match(pop(stack), state, point);
  push(stack, {
    type: "value",
    point: {
      ...point,
      type: "construct.after",
      value,
    },
  });
  return value;
};

/**
 * @type {import("./invariant").State}
 */
const state = {
  callstack: [],
  closures: new WeakMap(),
  jumps: new WeakMap(),
};

/** @type {import("./invariant").Advice} */
export default (point) => {
  const { type } = point;

  // push callstack //
  if (type === "program.enter") {
    push(state.callstack, []);
  } else if (type === "closure.enter") {
    if (!apply(hasWeakMap, state.closures, [point.callee])) {
      throw makeInvariantError("missing closure stack", {
        state,
        point,
      });
    }
    push(state.callstack, apply(getWeakMap, state.closures, [point.callee]));
  }

  const stack = peek(state.callstack);

  if (stack === null) {
    throw makeInvariantError("empty callstack", {
      state,
      point,
    });
  }

  // push stack //
  if (
    type === "program.enter" ||
    type === "closure.enter" ||
    type === "block.enter"
  ) {
    push(stack, {
      type: "frame",
      point,
    });
  }

  if (type === "function.after" || type === "arrow.after") {
    // register closure //
    if (apply(hasWeakMap, state.closures, [point.value])) {
      throw makeInvariantError("duplicate closure declaration", {
        state,
        point,
      });
    }
    apply(setWeakMap, state.closures, [point.value, [...stack]]);
  }

  // read //
  if (type === "read.after") {
    read(stack, state, point);
  }

  // write //
  if (type === "write.before") {
    write(stack, state, point);
  }

  // consume //
  if (
    type === "return.before" ||
    type === "closure.completion" ||
    type === "program.completion" ||
    type === "drop.before" ||
    type === "write.before" ||
    type === "branch.before" ||
    type === "global.write.before" ||
    type === "eval.before" ||
    type === "conditional.before" ||
    type === "eval.after" ||
    type === "conditional.after"
  ) {
    consume(pop(stack), point.value, state, point);
  }

  // before //
  if (
    type === "eval.before" ||
    type === "conditional.before" ||
    type === "debugger.before" ||
    type === "branch.before" ||
    type === "global.read.before" ||
    type === "global.typeof.before" ||
    type === "global.write.before" ||
    type === "global.declare.before"
  ) {
    push(stack, {
      type: "match",
      point,
    });
  }

  // after //
  if (
    type === "eval.after" ||
    type === "conditional.after" ||
    type === "debugger.after" ||
    type === "branch.after" ||
    type === "global.read.after" ||
    type === "global.typeof.after" ||
    type === "global.write.after" ||
    type === "global.declare.after"
  ) {
    match(pop(stack), state, point);
  }

  // produce //
  if (
    type === "read.after" ||
    type === "primitive.after" ||
    type === "function.after" ||
    type === "arrow.after" ||
    type === "intrinsic.after" ||
    type === "eval.after" ||
    type === "conditional.after"
  ) {
    push(stack, {
      type: "value",
      point,
    });
  }

  // completion
  if (
    type === "program.completion" ||
    type === "closure.completion" ||
    type === "block.completion"
  ) {
    match(peek(stack), state, point);
  }

  // failure //
  if (
    type === "program.failure" ||
    type === "closure.failure" ||
    type === "block.failure"
  ) {
    let last = peek(stack);
    while (last !== null && last.type !== "frame") {
      pop(stack);
      last = peek(stack);
    }
    match(last, state, point);
  }

  // leave //
  if (
    type === "program.leave" ||
    type === "closure.leave" ||
    type === "block.leave"
  ) {
    match(pop(stack), state, point);
  }

  // return //
  if (point.type === "apply") {
    return applyAdvice(stack, state, point);
  } else if (point.type === "construct") {
    return constructAdvice(stack, state, point);
  } else if (point.type === "primitive.after") {
    return /** @type {import("./invariant").Value} */ (
      /** @type {unknown} */ (point.value)
    );
  } else if ("record" in point) {
    return point.record;
  } else if ("value" in point) {
    return point.value;
  } else {
    return undefined;
  }
};
