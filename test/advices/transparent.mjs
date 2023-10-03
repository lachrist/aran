/**
 * @typedef {Brand<unknown, "value">} Value
 */

/**
 * @typedef {Brand<string, "location">} Location
 */

const {
  Error,
  Reflect: { apply, construct },
} = globalThis;

/**
 * @type {import("../../lib/index.mjs").Advice<Value, Location>}
 */
export default {
  "program.enter": (_kind, _links, frame, _location) => frame,
  "program.completion": (_kind, value, _location) => value,
  "program.failure": (_kind, value, _location) => value,
  "program.leave": (_kind, _location) => {},
  "function.enter": (_kind, _links, frame, _location) => frame,
  "function.failure": (_kind, value, _location) => value,
  "function.completion": (_kind, value, _location) => value,
  "function.leave": (_kind, _location) => {},
  "block.enter": (_kind, _labels, frame, _location) => frame,
  "block.completion": (_kind, _location) => {},
  "block.failure": (_kind, value, _location) => value,
  "block.leave": (_kind, _location) => {},
  "debugger.before": (_location) => {},
  "debugger.after": (_location) => {},
  "break.before": (_label, _location) => {},
  "branch.before": (_kind, value, _location) => value,
  "branch.after": (_kind, _location) => {},
  "intrinsic.after": (_name, value, _location) => value,
  "primitive.after": (primitive, _location) =>
    /** @type {Value} */ (/** @type {unknown} */ (primitive)),
  "import.after": (_source, _specifier, value, _location) => value,
  "function.after": (_kind, _asynchronous, _generator, value, _location) =>
    value,
  "read.after": (_variable, value, _location) => value,
  "conditional.before": (value, _location) => value,
  "conditional.after": (value, _location) => value,
  "eval.before": (_value, _context, _location) => {
    throw new Error("eval is not supported");
  },
  "eval.after": (value, _location) => value,
  "await.before": (value, _location) => value,
  "await.after": (value, _location) => value,
  "yield.before": (_delegate, value, _location) => value,
  "yield.after": (_delegate, value, _location) => value,
  "drop.before": (value, _location) => value,
  "export.before": (_specifier, value, _location) => value,
  "write.before": (_variable, value, _location) => value,
  "return.before": (value, _location) => value,
  "apply": (callee, this_, arguments_, _location) =>
    /** @type {Value} */ (
      apply(
        /** @type {Function} */ (/** @type {unknown} */ (callee)),
        this_,
        arguments_,
      )
    ),
  "construct": (callee, arguments_, _location) =>
    /** @type {Value} */ (
      construct(
        /** @type {Function} */ (/** @type {unknown} */ (callee)),
        arguments_,
      )
    ),
  "global.read.before": (_variable, _location) => {},
  "global.read.after": (_variable, value, _location) => value,
  "global.typeof.before": (_variable, _location) => {},
  "global.typeof.after": (_variable, value, _location) => value,
  "global.write.before": (_variable, value, _location) => value,
  "global.write.after": (_variable, _location) => {},
  "global.declare.before": (_kind, _variable, value, _location) => value,
  "global.declare.after": (_kind, _variable, _location) => {},
};
