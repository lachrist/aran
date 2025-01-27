// @ts-nocheck

const ts_aware_context = context;

const { log, aran, astring, acorn, target } = /**
 * @type {{
 *   log: (message: string) => void,
 *   aran: import(".."),
 *   astring: {
 *     generate: (node: object) => string,
 *   },
 *   acorn: {
 *     parse: (
 *       code: string,
 *       options: {
 *         ecmaVersion: number,
 *         sourceType: "script" | "module",
 *       },
 *     ) => {
 *       type: "Program",
 *       sourceType: "script" | "module",
 *       body: object[],
 *     },
 *   },
 *   target: string,
 * }}
 */ (ts_aware_context);

/**
 * @typedef {string & {__brand: "NodeHash"}} NodeHash
 * @typedef {string & {__brand: "FilePath"}} FilePath
 * @typedef {string & {__brand: "Indent"}} Indent
 * @typedef {unknown & {__brand: "Value"}} Value
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

const ADVICE_VARIABLE = "__ADVICE__";

const MAX_STRING_LENGTH = 20;

const NAME_PADDING = 10;

const BODY_PADDING = 20;

const TAIL_PADDING = 20;

let current_tag = 1;

/**
 * @type {import("..").Digest<
 *   FilePath,
 *   NodeHash,
 * >}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}#${node_path}`);

/**
 * @type {WeakMap<object, number>}
 */
const tagging = new WeakMap();

/**
 * @type {(
 *   value: Value,
 * ) => string}
 */
const show = (value) => {
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

/**
 * @type {(
 *   entry: [string, Value],
 * ) => string}
 */
const showProperty = ([key, val]) => `${key}: ${show(val)}`;

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
  log(
    `${indent}${name.padEnd(NAME_PADDING)} ${kind} ${padMain(body, tail)} @ ${hash}`,
  );
};

const logProduce = compileLog(">>");

const logConsume = compileLog("<<");

const logNeutral = compileLog("--");

const INITIAL_INDENT = /** @type {Indent} */ ("");

let global_indent = INITIAL_INDENT;

const intrinsics = globalThis.eval(astring.generate(aran.generateSetup({})));

/**
 * @type {import("..").StandardAdvice<
 *   NodeHash,
 *   Indent,
 *   {
 *     Stack: Value,
 *     Scope: Value,
 *     Other: Value,
 *   }
 * >}
 */
const advice = {
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
      indent = /** @type {Indent} */ (`${global_indent}|`);
    }
    indent = /** @type {Indent} */ (`${indent}.`);
    logNeutral(indent, "setup", null, kind, hash);
    return indent;
  },
  "block@declaration": (indent, kind, frame, hash) => {
    logNeutral(
      indent,
      "declare",
      `{${Object.entries(frame)
        .map(/** @type {any} */ (showProperty))
        .join(", ")}}`,
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
  "apply@around": (indent, callee, this_arg, arg_list, hash) => {
    global_indent = indent;
    if (this_arg === undefined) {
      logConsume(
        indent,
        "apply",
        `${show(callee)}(${arg_list.map(show).join(", ")})`,
        null,
        hash,
      );
    } else {
      logConsume(
        indent,
        "apply",
        `${show(callee)}[this=${show(this_arg)}](${arg_list.map(show).join(", ")})`,
        null,
        hash,
      );
    }
    const result = intrinsics["Reflect.apply"](
      /** @type {any} */ (callee),
      this_arg,
      arg_list,
    );
    logProduce(indent, "return", show(result), null, hash);
    return result;
  },
  "construct@around": (indent, callee, arg_list, hash) => {
    global_indent = indent;
    logConsume(
      indent,
      "construct",
      `${show(callee)}(${arg_list.map(show).join(", ")})`,
      null,
      hash,
    );
    const result = intrinsics["Reflect.construct"](
      /** @type {any} */ (callee),
      arg_list,
    );
    logProduce(indent, "return", show(result), null, hash);
    return result;
  },
  "test@before": (indent, kind, value, hash) => {
    logConsume(indent, "test", show(value), kind, hash);
    return !!value;
  },
  "eval@before": (indent, situ, code, hash) => {
    logConsume(indent, "eval", show(code), null, hash);
    if (typeof code === "string") {
      return astring.generate(
        aran.instrument(
          {
            kind: "eval",
            situ,
            path: /** @type {FilePath} */ ("dynamic"),
            root: acorn.parse(code, {
              ecmaVersion: 2024,
              sourceType: "script",
            }),
          },
          {
            initial_state: INITIAL_INDENT,
            advice_variable: ADVICE_VARIABLE,
            standard_pointcut: true,
            digest,
          },
        ),
      );
    } else {
      return code;
    }
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
    logConsume(indent, delegate ? "yield*" : "yield", show(value), null, hash);
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

/** @type {any} */ (globalThis)[ADVICE_VARIABLE] = advice;

globalThis.eval(
  astring.generate(
    aran.instrument(
      {
        kind: "script",
        situ: { type: "global" },
        path: /** @type {FilePath} */ ("main"),
        root: acorn.parse(target, { ecmaVersion: 2024, sourceType: "script" }),
      },
      {
        initial_state: INITIAL_INDENT,
        advice_variable: ADVICE_VARIABLE,
        standard_pointcut: true,
        digest,
      },
    ),
  ),
);
