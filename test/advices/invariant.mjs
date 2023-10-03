/**
 * @typedef {Brand<unknown, "value">} Value
 */

/**
 * @typedef {Brand<string, "location">} Location
 */

/**
 * @typedef {Brand<string, "hash">} Hash
 */

/**
 * @typedef {import("../../lib/index.mjs").Label} Label
 */

/**
 * @typedef {import("../../lib/index.mjs").Link} Link
 */

/**
 * @typedef {import("../../lib/index.mjs").Variable} Variable
 */

/**
 * @typedef {{ [key in Variable]?: Value }} Record
 */

/**
 * @typedef {import("../../lib/index.mjs").EstreeVariable} EstreeVariable
 */

/**
 * @typedef {{
 *   type: "program",
 *   kind: string,
 *   links: Link[],
 *   record: Record,
 *   location: Location,
 * } | {
 *   type: "function",
 *   kind: string,
 *   callee: Value,
 *   record: Record,
 *   location: Location,
 * } | {
 *   type: "block",
 *   kind: string,
 *   labels: Label[],
 *   record: Record,
 *   location: Location,
 * }} Frame
 */

/**
 * @typedef {Frame[]} Scope
 */

/**
 * @typedef {{
 *   type: "await",
 *   location: Location
 * } | {
 *   type: "yield",
 *   delegate: boolean,
 *   location: Location
 * } | {
 *   type: "debugger",
 *   location: Location,
 * } | {
 *   type: "branch",
 *   kind: string,
 *   location: Location,
 * } | {
 *   type: "conditional",
 *   location: Location,
 * } | {
 *   type: "global.read",
 *   variable: EstreeVariable,
 *   location: Location,
 * } | {
 *   type: "global.typeof",
 *   variable: EstreeVariable,
 *   location: Location,
 * } | {
 *   type: "global.write",
 *   variable: EstreeVariable,
 *   location: Location,
 * } | {
 *   type: "global.declare",
 *   kind: string,
 *   variable: EstreeVariable,
 *   location: Location,
 * }} Trap
 */

const {
  Object: { entries: listEntry },
  Array: {
    prototype: { sort },
  },
  String: {
    prototype: { localeCompare },
  },
  JSON: { stringify: stringifyJson },
  Error,
  WeakMap,
  WeakMap: {
    prototype: { has: hasWeakMap, get: getWeakMap, set: setWeakMap },
  },
  Object: { hasOwn },
  Reflect: { apply, construct },
  console: { dir },
} = globalThis;

/** @type {Value[]} */
let values = [];

/** @type {Scope[]} */
let scopes = [];

/** @type {Trap[]} */
let traps = [];

/**
 * @type {WeakMap<Function, Scope>}
 */
const closures = new WeakMap();

/**
 * @type {WeakMap<Location, {
 *   scopes: Scope[],
 *   values: Value[],
 *   traps: Trap[],
 * }>}
 */
const jumps = new WeakMap();

/**
 * @type {(
 *   message: string,
 *   data: unknown,
 *) => Error}
 */
const makeInvariantError = (message, data) => {
  const error = new Error(message);
  error.name = "InvariantError";
  apply(dir, console, [
    {
      error,
      data,
      scopes,
      values,
      traps,
      jumps,
      closures,
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
 * @type {<X>(array: X[]) => X}
 */
const peek = (array) => {
  if (array.length === 0) {
    throw makeInvariantError("peak on empty array", null);
  }
  return array[array.length - 1];
};

/**
 * @type {<X>(array: X[]) => X}
 */
const pop = (array) => {
  if (array.length === 0) {
    throw makeInvariantError("pop on empty array", null);
  }
  const x = array[array.length - 1];
  array.length -= 1;
  return x;
};

/**
 * @type {(
 *   frame: Frame,
 *   type: "program" | "function" | "block",
 *   kind: string,
 *   location: Location,
 * ) => void}
 */
const assertCompatibleFrame = (frame, type, kind, location) => {
  const data = {
    frame,
    type,
    kind,
    location,
  };
  if (frame.type !== type) {
    throw makeInvariantError("frame type mismatch", data);
  }
  if (frame.kind !== kind) {
    throw makeInvariantError("frame kind mismatch", data);
  }
  if (frame.location !== location) {
    throw makeInvariantError("frame location mismatch", data);
  }
};

/**
 * @type {<X>(entry1: [string, X], entry2: [string, X]) => number}
 */
const sortEntry = ([key1, _val1], [key2, _val2]) =>
  apply(localeCompare, key1, [key2]);

/**
 * @type {(trap: Trap) => Hash}
 */
const digestTrap = (trap) =>
  /** @type {Hash} */ (
    stringifyJson(apply(sort, listEntry(trap), [sortEntry]))
  );

/**
 * @type {(
 *   trap1: Trap,
 *   trap2: Trap,
 * ) => void}
 */
const assertMatchingTrap = (trap1, trap2) => {
  if (digestTrap(trap1) !== digestTrap(trap2)) {
    throw makeInvariantError("trap type mismatch", { trap1, trap2 });
  }
};

/**
 * @type {(
 *   value1: Value,
 *   Value2: Value,
 * ) => void}
 */
const assertEqualValue = (value1, value2) => {
  if (value1 !== value2) {
    throw makeInvariantError("value mismatch", { value1, value2 });
  }
};

/**
 * @type {import("../../lib/index.mjs").Advice<Value, Location>}
 */
export default {
  "program.enter": (kind, links, record, location) => {
    push(scopes, [
      {
        type: "program",
        kind,
        links,
        record,
        location,
      },
    ]);
    return record;
  },
  "program.completion": (kind, value, location) => {
    assertCompatibleFrame(peek(peek(scopes)), "program", kind, location);
    assertEqualValue(pop(values), value);
    return value;
  },
  "program.failure": (kind, value, location) => {
    assertCompatibleFrame(peek(peek(scopes)), "program", kind, location);
    return value;
  },
  "program.leave": (kind, location) => {
    assertCompatibleFrame(pop(peek(scopes)), "program", kind, location);
    if (pop(scopes).length > 0) {
      throw makeInvariantError("residual program scope", { kind, location });
    }
  },
  "function.enter": (kind, callee, record, location) => {
    if (!apply(hasWeakMap, closures, [callee])) {
      throw makeInvariantError("missing closure scope", {
        kind,
        callee,
        record,
        location,
      });
    }
    push(scopes, [
      ...apply(getWeakMap, closures, [callee]),
      {
        type: "function",
        kind,
        callee,
        record,
        location,
      },
    ]);
    return record;
  },
  "function.failure": (kind, value, location) => {
    assertCompatibleFrame(peek(peek(scopes)), "function", kind, location);
    return value;
  },
  "function.completion": (kind, value, location) => {
    assertCompatibleFrame(peek(peek(scopes)), "function", kind, location);
    assertEqualValue(pop(values), value);
    return value;
  },
  "function.leave": (kind, location) => {
    assertCompatibleFrame(peek(pop(scopes)), "function", kind, location);
  },
  "block.enter": (kind, labels, record, location) => {
    push(peek(scopes), {
      type: "block",
      kind,
      labels,
      record,
      location,
    });
    return record;
  },
  "block.completion": (kind, location) => {
    assertCompatibleFrame(peek(peek(scopes)), "block", kind, location);
  },
  "block.failure": (kind, value, location) => {
    assertCompatibleFrame(peek(peek(scopes)), "block", kind, location);
    return value;
  },
  "block.leave": (kind, location) => {
    assertCompatibleFrame(pop(peek(scopes)), "block", kind, location);
  },
  "debugger.before": (location) => {
    push(traps, {
      type: "debugger",
      location,
    });
  },
  "debugger.after": (location) => {
    assertMatchingTrap(pop(traps), { type: "debugger", location });
  },
  "break.before": (label, _location) => {
    TODO;
  },
  "branch.before": (kind, value, location) => {
    assertEqualValue(pop(values), value);
    push(traps, {
      type: "branch",
      kind,
      location,
    });
    return value;
  },
  "branch.after": (kind, location) => {
    assertMatchingTrap(pop(traps), {
      type: "branch",
      kind,
      location,
    });
  },
  "intrinsic.after": (_name, value, _location) => {
    push(values, value);
    return value;
  },
  "primitive.after": (primitive, _location) => {
    const value = /** @type {Value} */ (/** @type {unknown} */ (primitive));
    push(values, value);
    return value;
  },
  "import.after": (_source, _specifier, value, _location) => {
    push(values, value);
    return value;
  },
  "function.after": (kind, asynchronous, generator, value, location) => {
    if (apply(hasWeakMap, closures, [value])) {
      throw makeInvariantError("duplicate closure scope", {
        kind,
        asynchronous,
        generator,
        value,
        location,
      });
    }
    apply(setWeakMap, closures, [value, [...peek(scopes)]]);
    push(values, value);
    return value;
  },
  "read.after": (variable, value, location) => {
    const scope = peek(scopes);
    for (let index = scope.length - 1; index >= 0; index -= 1) {
      const { record } = scope[index];
      if (hasOwn(record, variable)) {
        assertEqualValue(value, /** @type {Value} */ (record[variable]));
        push(values, value);
        return value;
      }
    }
    throw makeInvariantError("missing variable", { variable, value, location });
  },
  "conditional.before": (value, location) => {
    push(traps, {
      type: "conditional",
      location,
    });
    assertEqualValue(pop(values), value);
    return value;
  },
  "conditional.after": (value, location) => {
    assertMatchingTrap(pop(traps), {
      type: "conditional",
      location,
    });
    assertEqualValue(peek(values), value);
    return value;
  },
  "eval.before": (_value, _context, _location) => {
    throw new Error("eval is not supported");
  },
  "eval.after": (_value, _location) => {
    throw new Error("eval is not supported");
  },
  "await.before": (value, location) => {
    push(traps, {
      type: "await",
      location,
    });
    if (apply(hasWeakMap, jumps, [location])) {
      throw makeInvariantError("duplicate await jump", { value, location });
    }
    apply(setWeakMap, jumps, [
      location,
      {
        scopes,
        values,
        traps,
      },
    ]);
    scopes = [];
    values = [];
    traps = [];
    return value;
  },
  "await.after": (value, location) => {
    TODO;
    return value;
  },
  "yield.before": (_delegate, value, _location) => {
    TODO;
    return value;
  },
  "yield.after": (_delegate, value, _location) => {
    TODO;
    return value;
  },
  "drop.before": (value, _location) => {
    assertEqualValue(pop(values), value);
    return value;
  },
  "export.before": (_specifier, value, _location) => {
    assertEqualValue(pop(values), value);
    return value;
  },
  "write.before": (variable, value, location) => {
    const scope = peek(scopes);
    for (let index = scope.length - 1; index >= 0; index -= 1) {
      const { record } = scope[index];
      if (hasOwn(record, variable)) {
        assertEqualValue(pop(values), value);
        record[variable] = value;
        return value;
      }
    }
    throw makeInvariantError("missing variable", { variable, value, location });
  },
  "return.before": (value, _location) => {
    assertEqualValue(pop(values), value);
    return value;
  },
  "apply": (callee, this_, arguments_, _location) => {
    for (let index = arguments_.length - 1; index >= 0; index -= 1) {
      assertEqualValue(pop(values), arguments_[index]);
    }
    assertEqualValue(pop(values), this_);
    assertEqualValue(pop(values), callee);
    const result = /** @type {Value} */ (
      apply(
        /** @type {Function} */ (/** @type {unknown} */ (callee)),
        this_,
        arguments_,
      )
    );
    push(values, result);
    return result;
  },
  "construct": (callee, arguments_, _location) => {
    for (let index = arguments_.length - 1; index >= 0; index -= 1) {
      assertEqualValue(pop(values), arguments_[index]);
    }
    assertEqualValue(pop(values), callee);
    const result = /** @type {Value} */ (
      construct(
        /** @type {Function} */ (/** @type {unknown} */ (callee)),
        arguments_,
      )
    );
    push(values, result);
    return result;
  },
  "global.read.before": (variable, location) => {
    push(traps, { type: "global.read", variable, location });
  },
  "global.read.after": (variable, value, location) => {
    assertMatchingTrap(pop(traps), { type: "global.read", variable, location });
    push(values, value);
    return value;
  },
  "global.typeof.before": (variable, location) => {
    push(traps, { type: "global.typeof", variable, location });
  },
  "global.typeof.after": (variable, value, location) => {
    assertMatchingTrap(pop(traps), {
      type: "global.typeof",
      variable,
      location,
    });
    push(values, value);
    return value;
  },
  "global.write.before": (variable, value, location) => {
    assertEqualValue(pop(values), value);
    push(traps, { type: "global.write", variable, location });
    return value;
  },
  "global.write.after": (variable, location) => {
    assertMatchingTrap(pop(traps), {
      type: "global.write",
      variable,
      location,
    });
  },
  "global.declare.before": (kind, variable, value, location) => {
    assertEqualValue(pop(values), value);
    push(traps, { type: "global.declare", kind, variable, location });
    return value;
  },
  "global.declare.after": (kind, variable, location) => {
    assertMatchingTrap(pop(traps), {
      type: "global.declare",
      kind,
      variable,
      location,
    });
  },
};
