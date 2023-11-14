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
 * @type {(path: string, condidate: unknown) => Base}
 */
const sanitizeBase = (path, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(path, "a string", candidate);
  }
  return /** @type {Base} */ (candidate);
};

/**
 * @type {(path: string, candidate: unknown) => estree.Variable}
 */
const sanitizeVariable = (path, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(path, "a string", candidate);
  }
  if (!apply(testRegExp, variable_regexp, [candidate])) {
    throw new AranInputError(path, "a valid estree identifier", candidate);
  }
  return /** @type {estree.Variable} */ (candidate);
};

/**
 * @type {<X extends Json>(
 *   path: string,
 *   candidate: unknown,
 *   enumeration: X[],
 * ) => X}
 */
const sanitizeEnumeration = (path, candidate, enumeration) => {
  if (includes(enumeration, candidate)) {
    return /** @type {any} */ (candidate);
  } else {
    throw new AranInputError(
      path,
      `one of ${stringifyJson(enumeration)}`,
      candidate,
    );
  }
};

/**
 * @type {<X extends Json>(path: string, value: unknown, values: X) => X}
 */
const sanitizeSingleton = (path, candidate, singleton) => {
  if (candidate === singleton) {
    return singleton;
  } else {
    throw new AranInputError(path, stringifyJson(singleton), candidate);
  }
};

/**
 * @type {(path: string, candidate: unknown) => estree.Program}
 */
export const sanitizeProgram = (path, candidate) => {
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    hasOwn(candidate, "type") &&
    /** @type {{type: unknown}} */ (candidate).type === "Program"
  ) {
    return /** @type {estree.Program} */ (candidate);
  } else {
    throw new AranInputError(path, "an estree.Program", candidate);
  }
};

/**
 * @type {<L>(
 *   path: string,
 *   candidate: unknown,
 * ) => Pointcut<L>}
 */
export const sanitizePointcut = (path, candidate) => {
  if (
    typeof candidate === "function" ||
    typeof candidate === "boolean" ||
    (typeof candidate === "object" && candidate !== null)
  ) {
    return /** @type {any} */ (candidate);
  } else {
    throw new AranInputError(
      path,
      "either a function, a boolean, an array, or an object",
      candidate,
    );
  }
};

/**
 * @type {<L>(
 *   path: string,
 *   candidate: unknown,
 * ) => Locate<L>}
 */
export const sanitizeLocate = (path, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranInputError(path, "a function", candidate);
  }
  return /** @type {any} */ (candidate);
};

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./unbuild/context.d.ts").EvalContext}
 */
export const sanitizeContext = (path, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(path, "an object", candidate);
  }
  if (
    !hasOwn(candidate, "meta") ||
    typeof (/** @type {{meta: unknown}} */ (candidate).meta) !== "string"
  ) {
    throw new AranInputError(`${path}.meta`, "a string", candidate);
  }
  return /** @type {any} */ (candidate);
};

//////////////////////////
// sanitizeSetupOptions //
//////////////////////////

/**
 * @type {(path: string, options: unknown) => {
 *   intrinsic: estree.Variable,
 *   global: estree.Variable,
 * }}
 */
export const sanitizeSetupOptions = (path, options) => {
  const { intrinsic, global } =
    /** @type {{[k in "intrinsic" | "global"]: unknown}} */ ({
      intrinsic: "_ARAN_INTRINSIC_",
      global: "globalThis",
      .../** @type {object} */ (options),
    });
  return {
    intrinsic: sanitizeVariable(`${path}.intrinsic`, intrinsic),
    global: sanitizeVariable(`${path}.global`, global),
  };
};

///////////////////////////////
// sanitizeInstrumentOptions //
///////////////////////////////

/**
 * @type {<L>(
 *   path: string,
 *   options: unknown,
 * ) => import("../type/options.d.ts").CommonOptions<L>}
 */
const sanitizeInstrumentOptionsCommon = (path, options) => {
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
    base: sanitizeBase(`${path}.base`, base),
    pointcut: sanitizePointcut(`${path}.pointcut`, pointcut),
    advice: sanitizeVariable(`${path}.advice`, advice),
    intrinsic: sanitizeVariable(`${path}.intrinsic`, intrinsic),
    escape: sanitizeVariable(`${path}.escape`, escape),
    locate: sanitizeLocate(`${path}.locate`, locate),
    error: sanitizeEnumeration(`${path}.error`, error, ["embed", "throw"]),
    warning: sanitizeEnumeration(`${path}.warning`, warning, [
      "silent",
      "console",
    ]),
  };
};

/**
 * @type {<L>(
 *   path: string,
 *   options: unknown,
 *   source: "script" | "module",
 * ) => Options<L>}
 */
export const sanitizeInstrumentOptions = (path, options, source) => {
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
        return {
          kind: sanitizeSingleton(`${path}.kind`, kind, "eval"),
          situ: sanitizeSingleton(`${path}.situ`, situ, "local"),
          plug: sanitizeSingleton(`${path}.plug`, plug, "reify"),
          mode: sanitizeSingleton(`${path}.mode`, mode, null),
          context: sanitizeContext(`${path}.context`, context),
          ...sanitizeInstrumentOptionsCommon(path, options),
        };
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
    const situ2 = sanitizeEnumeration(`${path}.situ`, situ1, [
      "global",
      "local",
    ]);
    switch (situ2) {
      case "global": {
        return {
          kind: sanitizeEnumeration(`${path}.kind`, kind, [
            "module",
            "script",
            "eval",
          ]),
          situ: "global",
          plug: sanitizeEnumeration(`${path}.plug`, plug, ["alien", "reify"]),
          mode: sanitizeSingleton(`${path}.mode`, mode, "sloppy"),
          context: sanitizeSingleton(`${path}.context`, context, null),
          ...sanitizeInstrumentOptionsCommon(path, options),
        };
      }
      case "local": {
        return {
          kind: sanitizeEnumeration(`${path}.kind`, kind, ["eval"]),
          situ: "local",
          plug: sanitizeSingleton(`${path}.plug`, plug, "alien"),
          mode: sanitizeSingleton(`${path}.mode`, mode, "sloppy"),
          context: sanitizeSingleton(`${path}.context`, context, null),
          ...sanitizeInstrumentOptionsCommon(path, options),
        };
      }
      default: {
        throw new AranTypeError("invalid program situ", situ2);
      }
    }
  }
};
