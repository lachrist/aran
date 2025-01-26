/* eslint-disable local/no-jsdoc-typedef */
/* eslint-disable no-console */

import { weaveStandard } from "aran";

const { WeakMap, String, JSON, Object, undefined } = globalThis;

/**
 * @type {<K extends PropertyKey, V>(
 *   o: {[k in K]?: V},
 * ) => [K, V][]}
 */
const listEntry = Object.entries;

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
 *   State: Indent,
 *   StackValue: Value,
 *   ScopeValue: Value,
 *   OtherValue: Value,
 * }} Runtime
 * @typedef {(
 *   | "setup"
 *   | "declare"
 *   | "before"
 *   | "after"
 *   | "suspend"
 *   | "resume"
 *   | "throw"
 *   | "teardown"
 *   | "break"
 *   | "apply"
 *   | "construct"
 *   | "return"
 *   | "test"
 *   | "eval"
 *   | "await"
 *   | "resolve"
 *   | "yield"
 *   | "yield*"
 *   | "read"
 *   | "write"
 *   | "import"
 *   | "export"
 *   | "intrinsic"
 *   | "primitive"
 *   | "drop"
 *   | "closure"
 * )} TrapName
 */

const MAX_STRING_LENGTH = 20;

const NAME_PADDING = 10;

const BODY_PADDING = 20;

const TAIL_PADDING = 20;

/**
 * @type {() => (
 *   value: Value,
 * ) => string}
 */
const compileShow = () => {
  let current_tag = 1;
  /**
   * @type {WeakMap<object, number>}
   */
  const tagging = new WeakMap();
  return (value) => {
    if (
      typeof value === "function" ||
      (typeof value === "object" && value !== null)
    ) {
      let tag = tagging.get(value);
      if (tag === undefined) {
        tag = current_tag++;
        tagging.set(value, tag);
      }
      return `#${tag}`;
    } else if (typeof value === "string") {
      if (/** @type {string} */ (value).length > 20) {
        return JSON.stringify(value).slice(0, MAX_STRING_LENGTH) + "...";
      } else {
        return JSON.stringify(value);
      }
    } else if (typeof value === "symbol") {
      const name = /** @type {symbol} */ (value).description;
      return typeof name === "string" ? `<symbol ${name}>` : "<symbol>";
    } else {
      return String(value);
    }
  };
};

/**
 * @type {(
 *   show: (value: Value) => string,
 * ) => (
 *   entry: [string, Value],
 * ) => string}
 */
const compileShowProperty =
  (show) =>
  ([key, val]) =>
    `${key}: ${show(val)}`;

/**
 * @type {(
 *   body: null | string,
 *   tail: null | string,
 * ) => string}
 */
const padMain = (body, tail) => {
  body = body ?? "";
  if (tail === null) {
    return body.padEnd(BODY_PADDING + TAIL_PADDING + 3);
  } else {
    if (body.length < BODY_PADDING) {
      body = body.padEnd(BODY_PADDING);
      if (tail.length < TAIL_PADDING) {
        tail = tail.padEnd(TAIL_PADDING);
      }
    }
    return `${body} | ${tail}`;
  }
};

/**
 * @type {(
 *   kind: ">>" | "--" | "<<",
 * ) => (
 *   indent: Indent,
 *   name: TrapName,
 *   body: null | string,
 *   tail: null | string,
 *   hash: NodeHash,
 * ) => void}
 */
const compileLog = (kind) => (indent, name, body, tail, hash) => {
  console.log(
    `${indent}${name.padEnd(NAME_PADDING)} ${kind} ${padMain(body, tail)} @ ${hash}`,
  );
};

const logProduce = compileLog(">>");

const logConsume = compileLog("<<");

const logNeutral = compileLog("--");

export const INITIAL_INDENT = /** @type {Indent} */ ("");

export const ADVICE_GLOBAL_VARIABLE = "__aran_advice__";

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
 *   Kind: import("aran").StandardAspectKind,
 *   Atom: Atom,
 *   Runtime: Runtime,
 * }>}
 */
export const createTraceAdvice = ({ apply, construct }) => {
  let transit_indent = INITIAL_INDENT;
  const show = compileShow();
  const showProperty = compileShowProperty(show);
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
      logNeutral(indent, "setup", null, kind, hash);
      return indent;
    },
    "block@declaration": (indent, kind, frame, hash) => {
      logNeutral(
        indent,
        "declare",
        `{${listEntry(frame).map(showProperty).join(", ")}}`,
        kind,
        hash,
      );
    },
    "block@declaration-overwrite": (_indent, _kind, frame, _hash) => frame,
    "segment-block@before": (indent, kind, _labels, hash) => {
      logNeutral(indent, "before", null, kind, hash);
    },
    "closure-block@before": (indent, kind, hash) => {
      logNeutral(indent, "before", null, kind, hash);
    },
    "program-block@before": (indent, kind, _head, hash) => {
      logNeutral(indent, "before", null, kind, hash);
    },
    "generator-block@suspension": (indent, kind, hash) => {
      logNeutral(indent, "suspend", null, kind, hash);
    },
    "generator-block@resumption": (indent, kind, hash) => {
      logNeutral(indent, "resume", null, kind, hash);
    },
    "segment-block@after": (indent, kind, hash) => {
      logNeutral(indent, "after", null, kind, hash);
    },
    "closure-block@after": (indent, kind, value, hash) => {
      logProduce(indent, "after", show(value), kind, hash);
      return value;
    },
    "program-block@after": (indent, kind, value, hash) => {
      logProduce(indent, "after", show(value), kind, hash);
      return value;
    },
    "block@throwing": (indent, kind, value, hash) => {
      logProduce(indent, "throw", show(value), kind, hash);
      return value;
    },
    "block@teardown": (indent, kind, hash) => {
      logNeutral(indent, "teardown", null, kind, hash);
    },
    "break@before": (indent, label, hash) => {
      logNeutral(indent, "break", null, label, hash);
    },
    "apply@around": (indent, callee, that, input, hash) => {
      transit_indent = indent;
      logConsume(
        indent,
        "apply",
        [
          show(callee),
          that === undefined ? "" : `[this=${show(that)}]`,
          `(${input.map(show).join(", ")})`,
        ].join(""),
        null,
        hash,
      );
      const result = apply(callee, that, input);
      logProduce(indent, "return", show(result), null, hash);
      return result;
    },
    "construct@around": (indent, callee, input, hash) => {
      transit_indent = indent;
      logConsume(
        indent,
        "construct",
        `${show(callee)}(${input.map(show).join(", ")})`,
        null,
        hash,
      );
      const result = construct(callee, input);
      logProduce(indent, "return", show(result), null, hash);
      return result;
    },
    "test@before": (indent, kind, value, hash) => {
      logConsume(indent, "test", show(value), kind, hash);
      return value;
    },
    "eval@before": (indent, root, hash) => {
      logConsume(indent, "eval", show(root), null, hash);
      return /** @type {any} */ (
        weaveStandard(/** @type {any} */ (root), {
          advice_global_variable: ADVICE_GLOBAL_VARIABLE,
          initial_state: indent,
          pointcut: true,
        })
      );
    },
    "eval@after": (indent, value, hash) => {
      logProduce(indent, "return", show(value), null, hash);
      return value;
    },
    "await@before": (indent, value, hash) => {
      logConsume(indent, "await", show(value), null, hash);
      return value;
    },
    "await@after": (indent, value, hash) => {
      logProduce(indent, "return", show(value), null, hash);
      return value;
    },
    "yield@before": (indent, delegate, value, hash) => {
      logConsume(
        indent,
        delegate ? "yield*" : "yield",
        show(value),
        null,
        hash,
      );
      return value;
    },
    "yield@after": (indent, _delegate, value, hash) => {
      logProduce(indent, "resume", show(value), null, hash);
      return value;
    },
    "read@after": (indent, variable, value, hash) => {
      logProduce(indent, "read", show(value), variable, hash);
      return value;
    },
    "write@before": (indent, variable, value, hash) => {
      logConsume(indent, "write", show(value), variable, hash);
      return value;
    },
    "drop@before": (indent, value, hash) => {
      logConsume(indent, "drop", show(value), null, hash);
      return value;
    },
    "export@before": (indent, specifier, value, hash) => {
      logConsume(indent, "export", show(value), specifier, hash);
      return value;
    },
    "import@after": (indent, source, specifier, value, hash) => {
      logProduce(
        indent,
        "import",
        show(value),
        `${specifier} from ${source}`,
        hash,
      );
      return value;
    },
    "intrinsic@after": (indent, name, value, hash) => {
      logProduce(indent, "intrinsic", show(value), name, hash);
      return value;
    },
    "primitive@after": (indent, value, hash) => {
      logProduce(indent, "primitive", show(value), null, hash);
      return value;
    },
    "closure@after": (indent, kind, value, hash) => {
      logProduce(indent, "closure", show(value), kind, hash);
      return value;
    },
  };
};

/**
 * @type {(
 *   root: import("aran").Program<Atom>,
 * ) => import("aran").Program<Atom>}
 */
export const weave = (root) =>
  weaveStandard(root, {
    advice_global_variable: ADVICE_GLOBAL_VARIABLE,
    initial_state: null,
    pointcut: true,
  });
