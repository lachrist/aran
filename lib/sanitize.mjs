import { AranInputError, AranTypeError } from "./util/error.mjs";
import { hasOwn, includes } from "./util/index.mjs";

const {
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
  JSON: { stringify: stringifyJson },
} = globalThis;

/**
 * @template L
 * @typedef {import("../type/options.d.ts").Locate<L>} Locate
 */

/**
 * @template L
 * @typedef {import("../type/advice.d.ts").Pointcut<L>} Pointcut
 */

/**
 * @template L
 * @typedef {import("../type/options.d.ts").Options<L>} Options
 */

/**
 * @typedef {import("../type/options.d.ts").Base} Base
 */

/////////////////////
// Atomic Sanitize //
/////////////////////

const variable_regexp = /^\p{ID_Start}\p{ID_Continue}*$/u;

/**
 * @type {(name: string, condidate: unknown) => Base}
 */
const sanitizeBase = (name, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(name, "a string", candidate);
  }
  return /** @type {Base} */ (candidate);
};

/**
 * @type {(name: string, candidate: unknown) => estree.Variable}
 */
const sanitizeVariable = (name, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(name, "a string", candidate);
  }
  if (!apply(testRegExp, variable_regexp, [candidate])) {
    throw new AranInputError(name, "a valid estree identifier", candidate);
  }
  return /** @type {estree.Variable} */ (candidate);
};

/**
 * @type {<X extends Json>(
 *   name: string,
 *   candidate: unknown,
 *   enumeration: X[],
 * ) => X}
 */
const sanitizeEnumeration = (name, candidate, enumeration) => {
  if (includes(enumeration, candidate)) {
    return /** @type {any} */ (candidate);
  } else {
    throw new AranInputError(
      name,
      `one of ${stringifyJson(enumeration)}`,
      candidate,
    );
  }
};

/**
 * @type {<X extends Json>(name: string, value: unknown, values: X) => X}
 */
const sanitizeSingleton = (name, candidate, singleton) => {
  if (candidate === singleton) {
    return singleton;
  } else {
    throw new AranInputError(name, stringifyJson(singleton), candidate);
  }
};

/**
 * @type {(candidate: unknown) => estree.Program}
 */
export const sanitizeProgram = (candidate) => {
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    hasOwn(candidate, "type") &&
    /** @type {{type: unknown}} */ (candidate).type === "Program"
  ) {
    return /** @type {estree.Program} */ (candidate);
  } else {
    throw new AranInputError("input", "an estree.Program", candidate);
  }
};

/**
 * @type {<L>(
 *   name: string,
 *   candidate: unknown,
 * ) => Pointcut<L>}
 */
export const sanitizePointcut = (name, candidate) => {
  if (
    typeof candidate === "function" ||
    typeof candidate === "boolean" ||
    (typeof candidate === "object" && candidate !== null)
  ) {
    return /** @type {any} */ (candidate);
  } else {
    throw new AranInputError(
      name,
      "either a function, a boolean, an array, or an object",
      candidate,
    );
  }
};

/**
 * @type {<L>(
 *   name: string,
 *   candidate: unknown,
 * ) => Locate<L>}
 */
export const sanitizeLocate = (name, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranInputError(name, "a function", candidate);
  }
  return /** @type {any} */ (candidate);
};

/**
 * @type {(
 *   name: string,
 *   candidate: unknown,
 * ) => import("./unbuild/context.d.ts").EvalContext}
 */
export const sanitizeContext = (name, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(name, "an object", candidate);
  }
  if (
    !hasOwn(candidate, "meta") ||
    typeof (/** @type {{meta: unknown}} */ (candidate).meta) !== "string"
  ) {
    throw new AranInputError(`${name}.meta`, "a string", candidate);
  }
  return /** @type {any} */ (candidate);
};

//////////////////////////
// sanitizeSetupOptions //
//////////////////////////

/**
 * @type {(options: unknown) => {
 *   intrinsic: estree.Variable,
 *   global: estree.Variable,
 * }}
 */
export const sanitizeSetupOptions = (options) => {
  const { intrinsic, global } =
    /** @type {{[k in "intrinsic" | "global"]: unknown}} */ ({
      intrinsic: "_ARAN_INTRINSIC_",
      global: "globalThis",
      .../** @type {object} */ (options),
    });
  return {
    intrinsic: sanitizeVariable("options.intrinsic", intrinsic),
    global: sanitizeVariable("options.global", global),
  };
};

///////////////////////////////
// sanitizeInstrumentOptions //
///////////////////////////////

/**
 * @type {<L>(
 *   candidate: unknown,
 *   options: Options<L>,
 * ) => Options<L>}
 */
const checkSourceCompatibility = (candidate, options) => {
  const template = options.kind === "module" ? "module" : "script";
  if (candidate !== template) {
    throw new AranInputError("program.sourceType", template, candidate);
  }
  return options;
};

/**
 * @type {<L>(options: unknown) => import("../type/options.d.ts").CommonOptions<L>}
 */
const sanitizeInstrumentOptionsCommon = (options) => {
  const { pointcut, advice, intrinsic, escape, locate, base, error, warning } =
    /** @type {{[k in keyof Options<unknown>]: unknown}} */ ({
      base: "main",
      pointcut: false,
      advice: "_ARAN_ADVICE_",
      intrinsic: "_ARAN_INTRINSIC_",
      escape: "_ARAN_",
      locate: (/** @type {string} */ path, /** @type {string} */ root) =>
        `${root}.${path}`,
      error: "embed",
      warning: "console",
      .../** @type {object} */ (options),
    });
  return {
    base: sanitizeBase("options.base", base),
    pointcut: sanitizePointcut("options.pointcut", pointcut),
    advice: sanitizeVariable("options.advce", advice),
    intrinsic: sanitizeVariable("options.intrinsic", intrinsic),
    escape: sanitizeVariable("options.escape", escape),
    locate: sanitizeLocate("options.locate", locate),
    error: sanitizeEnumeration("options.error", error, ["embed", "throw"]),
    warning: sanitizeEnumeration("options.warning", warning, [
      "silent",
      "console",
    ]),
  };
};

/**
 * @type {<L>(source: "script" | "module", options: unknown) => Options<L>}
 */
export const sanitizeInstrumentOptions = (source, options) => {
  if (
    typeof options === "object" &&
    options !== null &&
    hasOwn(options, "context") &&
    /** @type {{ context: unknown }} */ (options).context != null
  ) {
    switch (source) {
      case "module": {
        throw new AranInputError("program.sourceType", "script", "module");
      }
      case "script": {
        const { kind, situ, plug, mode, context } =
          /** @type {{[k in keyof Options<unknown>]: unknown}} */ ({
            kind: "eval",
            situ: "local",
            plug: "reify",
            mode: null,
            context: null,
            .../** @type {object} */ (options),
          });
        return checkSourceCompatibility(source, {
          kind: sanitizeSingleton("options.kind", kind, "eval"),
          situ: sanitizeSingleton("options.situ", situ, "local"),
          plug: sanitizeSingleton("options.plug", plug, "reify"),
          mode: sanitizeSingleton("options.mode", mode, null),
          context: sanitizeContext("options.context", context),
          ...sanitizeInstrumentOptionsCommon(options),
        });
      }
      default: {
        throw new AranTypeError("invalid source");
      }
    }
  } else {
    const {
      kind,
      situ: situ1,
      plug,
      mode,
      context,
    } = /** @type {{[k in keyof Options<unknown>]: unknown}} */ ({
      kind: source,
      situ: "global",
      plug: "alien",
      mode: "sloppy",
      context: null,
      .../** @type {object} */ (options),
    });
    const situ2 = sanitizeEnumeration("options.situ", situ1, [
      "global",
      "local",
    ]);
    switch (situ2) {
      case "global": {
        return checkSourceCompatibility(source, {
          kind: sanitizeEnumeration("options.kind", kind, [
            "module",
            "script",
            "eval",
          ]),
          situ: "global",
          plug: sanitizeEnumeration("options.plug", plug, ["alien", "reify"]),
          mode: sanitizeSingleton("options.mode", mode, "sloppy"),
          context: sanitizeSingleton("options.context", context, null),
          ...sanitizeInstrumentOptionsCommon(options),
        });
      }
      case "local": {
        return checkSourceCompatibility(source, {
          kind: sanitizeEnumeration("options.kind", kind, ["eval"]),
          situ: "local",
          plug: sanitizeSingleton("options.plug", plug, "alien"),
          mode: sanitizeSingleton("options.mode", mode, "sloppy"),
          context: sanitizeSingleton("options.context", context, null),
          ...sanitizeInstrumentOptionsCommon(options),
        });
      }
      default: {
        throw new AranTypeError("invalid program situ", situ2);
      }
    }
  }
};
