const {
  WeakMap,
  Error,
  String,
  JSON: { stringify },
  Object: { entries },
  undefined,
} = globalThis;

/**
 * @type {<K extends PropertyKey, V>(
 *   o: {[k in K]?: V},
 * ) => [K, V][]}
 */
const listEntry = entries;

/**
 * @type {<X>(
 *   array: ArrayLike<X>,
 * ) => X[]}
 */
const copyArraylike = (input) => {
  const copy = [];
  const { length } = input;
  for (let index = 0; index < length; index++) {
    copy.push(input[index]);
  }
  return copy;
};

/**
 * @typedef {string & {__brand: "NodeHash"}} NodeHash
 * @typedef {string & {__brand: "FilePath"}} FilePath
 * @typedef {{
 *   Variable: string & {__brand: "Variable"},
 *   Label: string & {__brand: "Label"},
 *   Specifier: string & {__brand: "Specifier"},
 *   Source: string & {__brand: "Source"},
 *   Tag: NodeHash,
 * }} Atom
 * @typedef {string & {__brand: "Indent"}} Indent
 * @typedef {{__brand: "Value"}} Value
 * @typedef {{
 *   current: number,
 *   tagging: WeakMap<Value, number>,
 *   getSymbolKey: (symbol: symbol) => undefined | string,
 * }} Registery
 * @typedef {(
 *   | Exclude<import("aran").StandardAspectKind, (
 *       | "apply@around"
 *       | "construct@around"
 *       | "block@declaration-overwrite"
 *       | "program-block@before"
 *       | "closure-block@before"
 *       | "segment-block@before"
 *     )>
 *   | "apply@before"
 *   | "apply@after"
 *   | "construct@before"
 *   | "construct@after"
 * )} TraceKind
 * @typedef {{
 *   type: "call",
 *   callee: Value,
 *   that: Value | undefined,
 *   input: Value[],
 * } | {
 *   type: "intercept",
 *   target: Value,
 * } | {
 *   type: "frame",
 *   bindings: [string, Value][],
 * } | {
 *   type: "void",
 * }} TracePayload
 * @typedef {{
 *   kind: TraceKind,
 *   info: null | string,
 *   hash: NodeHash,
 *   data: TracePayload,
 * }} Trace
 */

const MAX_PRINT_LENGTH = 20;

const NAME_PADDING = 10;

const PREFIX = " ".repeat(NAME_PADDING);

const BEGIN = ">>";
const END = "<<";
const CALL = "->";
const RETURN = "<-";
const CONSUME = "--";
const PRODUCE = "++";
const SUSPEND = "*>";
const RESUME = "<*";
const THROW = "!!";
const BREAK = "@@";

/**
 * @type {{[k in TraceKind]: {
 *   name: string,
 *   sort: string,
 * }}}
 */
const PARSING = {
  "block@setup": { name: "setup", sort: BEGIN },
  "block@teardown": { name: "teardown", sort: END },
  "block@declaration": { name: "enter", sort: BEGIN },
  "segment-block@after": { name: "leave", sort: END },
  "closure-block@after": { name: "leave", sort: END },
  "program-block@after": { name: "leave", sort: END },
  "generator-block@suspension": { name: "suspend", sort: SUSPEND },
  "generator-block@resumption": { name: "resume", sort: RESUME },
  "block@throwing": { name: "throw", sort: THROW },
  "yield@before": { name: "yield", sort: SUSPEND },
  "yield@after": { name: "resume", sort: RESUME },
  "await@before": { name: "await", sort: SUSPEND },
  "await@after": { name: "resolve", sort: RESUME },
  "break@before": { name: "break", sort: BREAK },
  "eval@before": { name: "eval", sort: CALL },
  "eval@after": { name: "return", sort: RETURN },
  "apply@before": { name: "apply", sort: CALL },
  "apply@after": { name: "return", sort: RETURN },
  "construct@before": { name: "construct", sort: CALL },
  "construct@after": { name: "return", sort: RETURN },
  "primitive@after": { name: "primitive", sort: PRODUCE },
  "intrinsic@after": { name: "intrinsic", sort: PRODUCE },
  "import@after": { name: "import", sort: PRODUCE },
  "closure@after": { name: "closure", sort: PRODUCE },
  "read@after": { name: "read", sort: PRODUCE },
  "test@before": { name: "test", sort: CONSUME },
  "drop@before": { name: "drop", sort: CONSUME },
  "export@before": { name: "export", sort: CONSUME },
  "write@before": { name: "write", sort: CONSUME },
};

/**
 * @type {(
 *   registery: Registery,
 *   value: Value,
 * ) => string}
 */
const show = (registery, value) => {
  if (
    typeof value === "symbol" ||
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    let tag = registery.tagging.get(value);
    if (tag === undefined) {
      tag = registery.current++;
      try {
        registery.tagging.set(value, tag);
      } catch (error) {
        // TypeError >> new WeakMap([Symbol.for('foo'), 123]);
        if (typeof value !== "symbol") {
          throw error;
        }
        const key = registery.getSymbolKey(value);
        if (key === undefined) {
          throw error;
        }
        return `<symbol ${stringify(key)}>`;
      }
    }
    return `#${tag}`;
  } else if (typeof value === "string") {
    const print = stringify(value);
    return print.length > MAX_PRINT_LENGTH
      ? `${print.slice(0, MAX_PRINT_LENGTH)}..."`
      : print;
  } else {
    return String(value);
  }
};

/**
 * @type {(
 *   registery: Registery,
 *   payload: TracePayload,
 * ) => string[]}
 */
const formatPayload = (registery, payload) => {
  switch (payload.type) {
    case "void": {
      return [];
    }
    case "intercept": {
      const { target: main } = payload;
      return [show(registery, main)];
    }
    case "call": {
      const { callee, that, input } = payload;
      const head =
        show(registery, callee) +
        (that === undefined ? "" : `[this=${show(registery, that)}]`);
      if (input.length < 4) {
        return [
          head + "(" + input.map((value) => show(registery, value)).join(","),
          ")",
        ];
      } else {
        return [
          head + "(",
          ...input.map((value) => "  " + show(registery, value) + ","),
          ")",
        ];
      }
    }
    case "frame": {
      const { bindings } = payload;
      if (bindings.length < 4) {
        return [
          "{" +
            bindings
              .map(({ 0: key, 1: val }) => key + ": " + show(registery, val))
              .join(", ") +
            "}",
        ];
      } else {
        return [
          "{",
          ...bindings.map(
            ({ 0: key, 1: val }) =>
              "  " + key + ": " + show(registery, val) + ",",
          ),
          "}",
        ];
      }
    }
    default: {
      throw new Error(`Invalid trace payload type: ${payload}`);
    }
  }
};

/**
 * @type {(
 *  registery: Registery,
 *  indent: Indent,
 *  trace: Trace,
 * ) => string}
 */
const format = (registery, indent, { kind, info, data, hash }) => {
  const { name, sort } = PARSING[kind];
  const lines = formatPayload(registery, data);
  return [
    name.padEnd(NAME_PADDING) +
      sort +
      (info === null ? "" : " [" + info + "]") +
      (lines.length > 0 ? " " + lines.shift() : ""),
    ...lines.map((line) => PREFIX + sort + " " + line),
    PREFIX + sort + " @ " + hash,
  ]
    .map((line) => indent + line)
    .join("\n");
};

const initial_state = /** @type {Indent} */ ("");

export const advice_global_variable = "__aran_advice__";

export const weave_config = {
  pointcut: true,
  advice_global_variable,
  initial_state,
};

/**
 * @type {(
 *   indent: Indent,
 * ) => Indent}
 */
const indentRoutine = (indent) => /** @type {Indent} */ (`${indent}|`);

/**
 * @type {(
 *   indent: Indent,
 * ) => Indent}
 */
const indentControl = (indent) => /** @type {Indent} */ (`${indent}.`);

/**
 * @type {TracePayload}
 */
const VOID = { type: "void" };

/**
 * @type {(
 *   weaveStandard: import("aran").weaveStandard,
 *   global: {
 *     Reflect: {
 *       apply: (
 *         callee: Value,
 *         that: Value,
 *         input: Value[],
 *       ) => Value,
 *       construct: (
 *         callee: Value,
 *         input: Value[],
 *       ) => Value,
 *     },
 *     Symbol: {
 *       keyFor: (symbol: symbol) => undefined | string,
 *     },
 *     console: {
 *       log: (message: string) => void,
 *     },
 *   },
 * ) => import("aran").StandardAdvice<Atom & {
 *   Kind: import("aran").StandardAspectKind,
 *   State: Indent,
 *   StackValue: Value,
 *   ScopeValue: Value,
 *   OtherValue: Value,
 * }>}
 */
export const createTraceAdvice = (
  weaveStandard,
  { Reflect: { apply, construct }, Symbol: { keyFor }, console: { log } },
) => {
  /** @type {Registery} */
  const registery = {
    current: 0,
    tagging: new WeakMap(),
    getSymbolKey: keyFor,
  };
  let transit_indent = initial_state;
  return {
    "block@setup": (indent, kind, hash) => {
      if (
        kind === "deep-local-eval" ||
        kind === "arrow" ||
        kind === "function" ||
        kind === "method" ||
        kind === "generator" ||
        kind === "async-arrow" ||
        kind === "async-function" ||
        kind === "async-method" ||
        kind === "async-generator"
      ) {
        indent = indentRoutine(transit_indent);
      }
      indent = indentControl(indent);
      log(
        format(registery, indent, {
          kind: "block@setup",
          info: kind,
          data: VOID,
          hash,
        }),
      );
      return indent;
    },
    "block@declaration": (indent, kind, frame, hash) => {
      log(
        format(registery, indent, {
          kind: "block@declaration",
          info: kind,
          data: {
            type: "frame",
            bindings: listEntry(frame),
          },
          hash,
        }),
      );
    },
    "block@declaration-overwrite": (_indent, _kind, frame, _hash) => frame,
    "segment-block@before": (_indent, _kind, _labels, _hash) => {},
    "closure-block@before": (_indent, _kind, _hash) => {},
    "program-block@before": (_indent, _kind, _head, _hash) => {},
    "generator-block@suspension": (indent, kind, hash) => {
      log(
        format(registery, indent, {
          kind: "generator-block@suspension",
          info: kind,
          data: VOID,
          hash,
        }),
      );
    },
    "generator-block@resumption": (indent, kind, hash) => {
      log(
        format(registery, indent, {
          kind: "generator-block@resumption",
          info: kind,
          data: VOID,
          hash,
        }),
      );
    },
    "segment-block@after": (indent, kind, hash) => {
      log(
        format(registery, indent, {
          kind: "segment-block@after",
          info: kind,
          data: VOID,
          hash,
        }),
      );
    },
    "closure-block@after": (indent, kind, value, hash) => {
      log(
        format(registery, indent, {
          kind: "closure-block@after",
          info: kind,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "program-block@after": (indent, kind, value, hash) => {
      log(
        format(registery, indent, {
          kind: "program-block@after",
          info: kind,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "block@throwing": (indent, kind, value, hash) => {
      log(
        format(registery, indent, {
          kind: "block@throwing",
          info: kind,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "block@teardown": (indent, kind, hash) => {
      log(
        format(registery, indent, {
          kind: "block@teardown",
          info: kind,
          data: VOID,
          hash,
        }),
      );
    },
    "break@before": (indent, label, hash) => {
      log(
        format(registery, indent, {
          kind: "break@before",
          info: label,
          data: VOID,
          hash,
        }),
      );
    },
    "apply@around": (indent, callee, that, input, hash) => {
      transit_indent = indent;
      log(
        format(registery, indent, {
          kind: "apply@before",
          info: null,
          data: {
            type: "call",
            callee,
            that,
            // Prevent pollution from guest realm
            input: copyArraylike(input),
          },
          hash,
        }),
      );
      const result = apply(callee, that, input);
      log(
        format(registery, indent, {
          kind: "apply@after",
          info: null,
          data: { type: "intercept", target: result },
          hash,
        }),
      );
      return result;
    },
    "construct@around": (indent, callee, input, hash) => {
      transit_indent = indent;
      log(
        format(registery, indent, {
          kind: "construct@before",
          info: null,
          data: {
            type: "call",
            callee,
            that: undefined,
            // Prevent pollution from guest realm
            input: copyArraylike(input),
          },
          hash,
        }),
      );
      const result = construct(callee, input);
      log(
        format(registery, indent, {
          kind: "construct@after",
          info: null,
          data: { type: "intercept", target: result },
          hash,
        }),
      );
      return result;
    },
    "test@before": (indent, kind, value, hash) => {
      log(
        format(registery, indent, {
          kind: "test@before",
          info: kind,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "eval@before": (indent, root, hash) => {
      log(
        format(registery, indent, {
          kind: "eval@before",
          info: null,
          data: { type: "intercept", target: root },
          hash,
        }),
      );
      return /** @type {any} */ (
        weaveStandard(/** @type {any} */ (root), {
          pointcut: true,
          advice_global_variable,
          initial_state: indent,
        })
      );
    },
    "eval@after": (indent, value, hash) => {
      log(
        format(registery, indent, {
          kind: "eval@after",
          info: null,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "await@before": (indent, value, hash) => {
      log(
        format(registery, indent, {
          kind: "await@before",
          info: null,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "await@after": (indent, value, hash) => {
      log(
        format(registery, indent, {
          kind: "await@after",
          info: null,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "yield@before": (indent, delegate, value, hash) => {
      log(
        format(registery, indent, {
          kind: "yield@before",
          info: delegate ? "delegate" : "normal",
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "yield@after": (indent, delegate, value, hash) => {
      log(
        format(registery, indent, {
          kind: "yield@after",
          info: delegate ? "delegate" : "normal",
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "read@after": (indent, variable, value, hash) => {
      log(
        format(registery, indent, {
          kind: "read@after",
          info: variable,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "write@before": (indent, variable, value, hash) => {
      log(
        format(registery, indent, {
          kind: "write@before",
          info: variable,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "drop@before": (indent, value, hash) => {
      log(
        format(registery, indent, {
          kind: "drop@before",
          info: null,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "export@before": (indent, specifier, value, hash) => {
      log(
        format(registery, indent, {
          kind: "export@before",
          info: specifier,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "import@after": (indent, source, specifier, value, hash) => {
      log(
        format(registery, indent, {
          kind: "import@after",
          info: stringify(specifier) + " from " + stringify(source),
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "intrinsic@after": (indent, name, value, hash) => {
      log(
        format(registery, indent, {
          kind: "intrinsic@after",
          info: name,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "primitive@after": (indent, value, hash) => {
      log(
        format(registery, indent, {
          kind: "primitive@after",
          info: null,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
    "closure@after": (indent, kind, value, hash) => {
      log(
        format(registery, indent, {
          kind: "closure@after",
          info: kind,
          data: { type: "intercept", target: value },
          hash,
        }),
      );
      return value;
    },
  };
};
