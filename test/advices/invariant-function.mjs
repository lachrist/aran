/* eslint-disable no-restricted-syntax */

/**
 * @typedef {Brand<unknown, "value">} Value
 * @typedef {Brand<string, "location">} Location
 * @typedef {Brand<string, "hash">} Hash
 * @typedef {import("../../lib/index.mjs").Advice<Value, Location>} Advice
 * @typedef {import("../../lib/index.mjs").Label} Label
 * @typedef {import("../../lib/index.mjs").Link} Link
 * @typedef {import("../../lib/index.mjs").Variable} Variable
 * @typedef {import("../../lib/index.mjs").EstreeVariable} EstreeVariable
 * @typedef {{ [key in Variable]?: Value }} Record
 */

/**
 * @typedef {(import("../../lib/index.mjs").Point<Value, Location> | {
 *   type: "apply.before",
 *   callee: Value,
 *   this: Value,
 *   arguments: Value[],
 *   location: Location,
 * } | {
 *   type: "apply.after",
 *   value: Value,
 *   location: Location,
 * } | {
 *   type: "construct.before",
 *   callee: Value,
 *   arguments: Value[],
 *   location: Location,
 * } | {
 *   type: "construct.after",
 *   value: Value,
 *   location: Location,
 * }
 * )} Point
 */

const {
  undefined,
  Object: { is: same },
  Error,
  WeakMap,
  WeakMap: {
    prototype: {
      has: hasWeakMap,
      get: getWeakMap,
      set: setWeakMap,
      delete: deleteWeakMap,
    },
  },
  Array: {
    prototype: { splice },
  },
  Reflect: { apply, construct },
  console: { dir },
} = globalThis;

///////////
// Error //
///////////

// eslint-disable-next-line local/no-class
const InvariantError = class InvariantError extends Error {
  /**
   * @param {string} message
   * @param {object} data
   */
  // eslint-disable-next-line local/no-function
  constructor(message, data) {
    super(message);
    this.name = "InvariantError";
    this.data = data;
  }
};

///////////
// Stack //
///////////

/**
 * @type {<X>(array: X[], element: X) => void}
 */
const push = (array, element) => {
  array[array.length] = element;
};

/**
 * @type {<X>(array: X[]) => X}
 */
const peek = (array) => {
  if (array.length === 0) {
    throw new InvariantError("peek on empty array", {});
  }
  return array[array.length - 1];
};

/**
 * @type {<X>(array: X[]) => X}
 */
const pop = (array) => {
  if (array.length === 0) {
    throw new InvariantError("pop on empty array", {});
  }
  const element = array[array.length - 1];
  array.length -= 1;
  return element;
};

///////////
// Scope //
///////////

/**
 * @type {(
 *   point: Point & { type: "read.after" | "write.before" },
 *   stack: Point[],
 *   closures: WeakMap<Value, Point[]>,
 * ) => void}
 */
const lookup = (point, stack, closures) => {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const stack_point = stack[index];
    if ("record" in stack_point) {
      const { record } = stack_point;
      if (point.variable in record) {
        if (point.type === "read.after") {
          if (point.value !== record[point.variable]) {
            throw new InvariantError("read value mismatch", {
              point,
              stack_point,
            });
          }
        }
        if (point.type === "write.before") {
          record[point.variable] = point.value;
        }
        return undefined;
      }
    }
    if (stack_point.type === "program.enter") {
      throw new InvariantError("missing variable", { point, stack });
    }
    if (stack_point.type === "closure.enter") {
      const { callee } = stack_point;
      if (!apply(hasWeakMap, closures, [callee])) {
        throw new InvariantError("missing closure", { callee });
      }
      return lookup(point, apply(getWeakMap, closures, [callee]), closures);
    }
  }
  throw new InvariantError("missing root", { stack });
};

/**
 * @type {(stack: Point[]) => number}
 */
const findRootIndex = (stack) => {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const { type } = stack[index];
    if (type === "program.enter" || type === "closure.enter") {
      return index;
    }
  }
  throw new InvariantError("missing root point", { stack });
};

/**
 * @type {(points: Point[]) => Point[]}
 */
const trimScopeStack = (stack) => {
  const { length } = stack;
  let index = findRootIndex(stack);
  /** @type {Point[]} */
  const trim = [stack[index]];
  while (index < length) {
    const point = stack[index];
    if (point.type === "block.enter") {
      push(trim, point);
    }
    index += 1;
  }
  return trim;
};

/**
 * @type {(
 *   point: Point,
 *   stack: Point[],
 *   closures: WeakMap<Value, Point[]>,
 * ) => void}
 */
const lookupAdvice = (point, stack, closures) => {
  const { type } = point;
  if (type === "read.after" || type === "write.before") {
    lookup(point, stack, closures);
  }
};

/**
 * @type {(
 *   point: Point,
 *   stack: Point[],
 *   closures: WeakMap<Value, Point[]>,
 * ) => void}
 */
const registerAdvice = (point, stack, closures) => {
  const { type } = point;
  if (type === "function.after" || type === "arrow.after") {
    const callee = point.value;
    if (apply(hasWeakMap, closures, [callee])) {
      throw new InvariantError("duplicate closure declaration", {
        callee,
        closures,
      });
    }
    apply(setWeakMap, closures, [point.value, trimScopeStack(stack)]);
  }
};

/////////////////
// Value Stack //
/////////////////

/**
 * @type {(
 *   point: Point,
 *   value: Value,
 * ) => void}
 */
const consume = (point, value) => {
  const { type } = point;
  if (
    type !== "read.after" &&
    type !== "intrinsic.after" &&
    type !== "primitive.after" &&
    type !== "function.after" &&
    type !== "eval.after" &&
    type !== "conditional.after" &&
    type !== "global.read.after" &&
    type !== "global.typeof.after" &&
    type !== "apply.after" &&
    type !== "construct.after"
  ) {
    throw new InvariantError("not a producer point", { point });
  }
  if (!same(point.value, value)) {
    throw new InvariantError("value mismatch", { point, value });
  }
};

/**
 * @type {(stack: Point[], point: Point) => void}
 */
const consumeAdvice = (stack, point) => {
  const { type } = point;
  if (type === "apply.before" || type === "construct.before") {
    for (let index = point.arguments.length - 1; index >= 0; index -= 1) {
      consume(pop(stack), point.arguments[index]);
    }
    if (type === "apply.before") {
      consume(pop(stack), point.this);
    }
    consume(pop(stack), point.callee);
  }
  if (
    type === "return.before" ||
    type === "drop.before" ||
    type === "write.before" ||
    type === "branch.before" ||
    type === "conditional.before" ||
    type === "conditional.after" ||
    type === "global.write.before" ||
    type === "global.declare.before" ||
    type === "eval.before" ||
    type === "closure.completion" ||
    type === "program.completion" ||
    type === "await.before"
  ) {
    consume(pop(stack), point.value);
  }
};

/**
 * @type {(stack: Point[], point: Point) => void}
 */
const produceAdvice = (stack, point) => {
  const { type } = point;
  if (
    type === "read.after" ||
    type === "primitive.after" ||
    type === "function.after" ||
    type === "intrinsic.after" ||
    type === "eval.after" ||
    type === "global.read.after" ||
    type === "global.typeof.after" ||
    type === "apply.after" ||
    type === "construct.after" ||
    type === "await.after"
  ) {
    push(stack, point);
  }
};

///////////
// Match //
///////////

const MATCH = {
  "__proto__": null,
  "await.after": "await.before",
  "apply.after": "apply.before",
  "construct.after": "construct.before",
  "eval.after": "eval.before",
  "conditional.after": "conditional.before",
  "debugger.after": "debugger.before",
  "branch.after": "branch.before",
  "global.read.after": "global.read.before",
  "global.typeof.after": "global.typeof.before",
  "global.write.after": "global.write.before",
  "global.declare.after": "global.declare.before",
  "program.completion": "program.enter",
  "program.failure": "program.enter",
  "program.leave": "program.enter",
  "closure.completion": "closure.enter",
  "closure.failure": "closure.enter",
  "closure.leave": "closure.enter",
  "block.completion": "block.enter",
  "block.failure": "block.enter",
  "block.leave": "block.enter",
};

/**
 * @type {(
 *   point1: Point,
 *   point2: Point & { type: keyof typeof MATCH },
 * ) => void}
 */
const match = (point1, point2) => {
  if (point1.type !== MATCH[point2.type]) {
    throw new InvariantError("type mistmatch", { point1, point2 });
  }
  if (point1.location !== point2.location) {
    throw new InvariantError("location mistmatch", { point1, point2 });
  }
};

/**
 * @type {(stack: Point[], point: Point) => void}
 */
const beginAdvice = (stack, point) => {
  const { type } = point;
  if (
    // before //
    type === "debugger.before" ||
    type === "eval.before" ||
    type === "branch.before" ||
    type === "conditional.before" ||
    type === "global.read.before" ||
    type === "global.typeof.before" ||
    type === "global.write.before" ||
    type === "await.before" ||
    // enter //
    type === "program.enter" ||
    type === "closure.enter" ||
    type === "block.enter"
  ) {
    push(stack, point);
  }
};

/**
 * @type {(stack: Point[], point: Point) => void}
 */
const restoreAdvice = (stack, point) => {
  const { type } = point;
  if (
    type === "program.failure" ||
    type === "closure.failure" ||
    type === "block.failure"
  ) {
    while (stack.length > 0) {
      const { type } = stack[stack.length - 1];
      if (
        type === "program.enter" ||
        type === "closure.enter" ||
        type === "block.enter"
      ) {
        return undefined;
      }
      stack.length -= 1;
    }
  }
};

/**
 * @type {(stack: Point[], point: Point) => void}
 */
const endAdvice = (stack, point) => {
  const { type } = point;
  if (
    type === "program.completion" ||
    type === "closure.completion" ||
    type === "block.completion" ||
    type === "program.failure" ||
    type === "closure.failure" ||
    type === "block.failure"
  ) {
    match(peek(stack), point);
  }
  if (
    type === "debugger.after" ||
    type === "eval.after" ||
    type === "branch.after" ||
    type === "conditional.after" ||
    type === "global.read.after" ||
    type === "global.typeof.after" ||
    type === "global.write.after" ||
    type === "await.after" ||
    type === "program.leave" ||
    type === "closure.leave" ||
    type === "block.leave"
  ) {
    match(pop(stack), point);
  }
};

//////////
// Jump //
//////////

/**
 * @type {(
 *   type: "yield.before" | "await.before",
 *   stack: Point[],
 * ) => number}
 */
const findJumpIndex = (type, stack) => {
  switch (type) {
    case "yield.before": {
      return findRootIndex(stack);
    }
    case "await.before": {
      return 0;
    }
    default: {
      throw new InvariantError("invalid before jump point type", { type });
    }
  }
};

/**
 * @type {(
 *   point: Point,
 *   stack: Point[],
 *   jumps: WeakMap<Location, Point[]>,
 * ) => void}
 */
const jumpAdvice = (point, stack, jumps) => {
  const { type } = point;
  if (type === "await.before" || type === "yield.before") {
    const { location } = point;
    if (apply(hasWeakMap, jumps, [location])) {
      throw new InvariantError("duplicate jump", { location, jumps });
    }
    apply(setWeakMap, jumps, [
      location,
      apply(splice, stack, [findJumpIndex(type, stack)]),
    ]);
  }
  if (type === "await.after" || type === "yield.after") {
    const { location } = point;
    if (!apply(hasWeakMap, jumps, [location])) {
      throw new InvariantError("missing jump", { location, jumps });
    }
    for (const point of apply(getWeakMap, jumps, [location])) {
      push(stack, point);
    }
    apply(deleteWeakMap, jumps, [location]);
  }
};

////////////
// Export //
////////////

/**
 * @type {(
 *   point: Point,
 *   state: {
 *     stack: Point[],
 *     closures: WeakMap<Value, Point[]>,
 *     jumps: WeakMap<Location, Point[]>,
 *   },
 * ) => void}
 */
const adviceUpdate = (point, { stack, closures, jumps }) => {
  consumeAdvice(stack, point);
  beginAdvice(stack, point);
  restoreAdvice(stack, point);
  lookupAdvice(point, stack, closures);
  registerAdvice(point, stack, closures);
  jumpAdvice(point, stack, jumps);
  endAdvice(stack, point);
  produceAdvice(stack, point);
};

/**
 * @type {(point: Point) => Value | undefined | Record}
 */
const adviceResult = (point) => {
  if (point.type === "primitive.after") {
    return /** @type {Value} */ (/** @type {unknown} */ (point.value));
  } else if ("value" in point) {
    return point.value;
  } else if ("record" in point) {
    return point.record;
  } else {
    return undefined;
  }
};

const state = {
  stack: [],
  closures: new WeakMap(),
  jumps: new WeakMap(),
  reported: false,
};

/**
 * @type {(point: Point) => Value | undefined | Record}
 */
const advice = (point) => {
  try {
    adviceUpdate(point, state);
    return adviceResult(point);
  } catch (error) {
    if (!state.reported) {
      apply(dir, console, [
        {
          error,
          state,
          point,
        },
        { showHidden: true, depth: null, colors: true },
      ]);
      state.reported = true;
    }
    throw error;
  }
};

/** @type {Advice} */
export default (point) => {
  if (point.type === "apply") {
    advice({
      type: "apply.before",
      callee: point.callee,
      this: point.this,
      arguments: point.arguments,
      location: point.location,
    });
    return advice({
      type: "apply.after",
      value: apply(
        /** @type {Function} */ (/** @type {unknown} */ (point.callee)),
        point.this,
        point.arguments,
      ),
      location: point.location,
    });
  } else if (point.type === "construct") {
    advice({
      type: "construct.before",
      callee: point.callee,
      arguments: point.arguments,
      location: point.location,
    });
    return advice({
      type: "construct.after",
      value: construct(
        /** @type {Function} */ (/** @type {unknown} */ (point.callee)),
        point.arguments,
      ),
      location: point.location,
    });
  } else {
    return advice(point);
  }
};
