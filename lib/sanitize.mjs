import { hasNarrowObject, mapIndex } from "./util/index.mjs";
import { AranTypeError, AranInputError } from "./error.mjs";

const {
  Array: { isArray },
  undefined,
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
  JSON: { stringify: stringifyJson },
} = globalThis;

/** @type {["strict", "sloppy"]} */
const MODE_ENUM = ["strict", "sloppy"];

/**
 * @type {(
 *   obj: unknown,
 *   key: string,
 *   def: unknown
 * ) => unknown}
 */
const getDefault = (obj, key, def) =>
  typeof obj === "object" && obj !== null && hasNarrowObject(obj, key)
    ? obj[key]
    : def;

/**
 * @type {<B, L>(base: B, path: string) => L}
 */
const DEFAULT_LOCATE = (path, base) => /** @type {any} */ (`${base}.${path}`);

/////////////
// Atomic  //
/////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(path: string, candidate: unknown) => string}
 */
const sanitizeString = (path, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(path, "a string", candidate);
  }
  return candidate;
};

/**
 * @type {(path: string, candidate: unknown) => number}
 */
const sanitizeNumber = (path, candidate) => {
  if (typeof candidate !== "number") {
    throw new AranInputError(path, "a number", candidate);
  }
  return candidate;
};

/**
 * @type {(path: string, candidate: unknown) => boolean}
 */
const sanitizeBoolean = (path, candidate) => {
  if (typeof candidate !== "boolean") {
    throw new AranInputError(path, "a boolean", candidate);
  }
  return candidate;
};

/**
 * @type {(path: string, candidate: unknown) => function}
 */
const sanitizeFunction = (path, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranInputError(path, "a boolean", candidate);
  }
  return candidate;
};

/**
 * @type {(path: string, candidate: unknown) => estree.Variable}
 */
export const sanitizeVariable = (path, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(path, "a string", candidate);
  }
  if (!apply(testRegExp, variable_regexp, [candidate])) {
    throw new AranInputError(path, "a valid estree identifier", candidate);
  }
  return /** @type {estree.Variable} */ (candidate);
};

/**
 * @type {<X>(
 *   path: string,
 *   candidate: unknown,
 *   sanitizeItem: (path: string, element: unknown) => X,
 * ) => X[]}
 */
const sanitizeArray = (path, candidate, sanitizeItem) => {
  if (isArray(candidate)) {
    return mapIndex(candidate.length, (index) =>
      sanitizeItem(`${path}[${index}]`, candidate[index]),
    );
  } else {
    throw new AranInputError(path, "an array", candidate);
  }
};

/**
 * @type {<X extends Primitive>(
 *   path: string,
 *   candidate: unknown,
 *   record: X[],
 * ) => X}
 */
const sanitizeEnumeration = (path, candidate, enumeration) => {
  for (const element of enumeration) {
    if (candidate === element) {
      return element;
    }
  }
  throw new AranInputError(
    path,
    `one of ${stringifyJson(enumeration)}`,
    candidate,
  );
};

/**
 * @type {<X extends Primitive>(
 *   path: string,
 *   candidate: unknown,
 *   singleton: X,
 * ) => X}
 */
const sanitizeSingleton = (path, candidate, singleton) => {
  if (candidate === singleton) {
    return singleton;
  } else {
    throw new AranInputError(path, stringifyJson(singleton), candidate);
  }
};

/**
 * @type {(path: string, root: unknown) => estree.ModuleProgram}
 */
const sanitizeModuleProgram = (path, candidate) => {
  // eslint-disable-next-line local/no-impure
  sanitizeSingleton(
    `${path}.type`,
    getDefault(candidate, "type", undefined),
    "Program",
  );
  // eslint-disable-next-line local/no-impure
  sanitizeSingleton(
    `${path}.sourceType`,
    getDefault(candidate, "sourceType", undefined),
    "module",
  );
  return /** @type {any} */ (candidate);
};

/**
 * @type {(path: string, root: unknown) => estree.ScriptProgram}
 */
const sanitizeScriptProgram = (path, candidate) => {
  // eslint-disable-next-line local/no-impure
  sanitizeSingleton(
    `${path}.type`,
    getDefault(candidate, "type", undefined),
    "Program",
  );
  // eslint-disable-next-line local/no-impure
  sanitizeSingleton(
    `${path}.sourceType`,
    getDefault(candidate, "sourceType", undefined),
    "script",
  );
  return /** @type {any} */ (candidate);
};

/**
 * @type {<L>(
 *   path: string,
 *   candidate: unknown,
 * ) => import("../type/advice").Pointcut<L>}
 */
const sanitizePointcut = (path, candidate) => {
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
 * @type {<B, L>(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./config").Locate<B, L>}
 */
const sanitizeLocate = (path, candidate) =>
  /** @type {any} */ (sanitizeFunction(path, candidate));

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./unbuild/meta").PackMeta}
 */
const sanitizePackMeta = (path, meta) => ({
  product: sanitizeString(
    `${path}.product`,
    getDefault(meta, "product", undefined),
  ),
  prime_index: sanitizeNumber(
    `${path}.prime_index`,
    getDefault(meta, "prime_index", undefined),
  ),
});

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").Frame}
 */
const sanitizeFrame = (path, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(path, "an object", candidate);
  }
  const type = "type" in candidate ? candidate.type : undefined;
  if (typeof type !== "string") {
    throw new AranInputError(`${path}.type`, "a string", type);
  }
  return /** @type {any} */ (candidate);
};

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").PackScope}
 */
const sanitizePackScope = (path, candidate) =>
  /** @type {any} */ (
    sanitizeArray(`${path}.frames`, candidate, sanitizeFrame)
  );

//////////////
// Compound //
//////////////

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./context").Context}
 */
export const sanitizeContext = (path, candidate) => {
  const type = sanitizeEnumeration(
    `${path}.type`,
    getDefault(candidate, "type", "global"),
    ["global", "internal-local", "external-local"],
  );
  if (type === "global") {
    return { type };
  } else if (type === "internal-local") {
    return {
      type,
      meta: sanitizePackMeta(
        `${path}.meta`,
        getDefault(candidate, "meta", undefined),
      ),
      scope: sanitizePackScope(
        `${path}.scope`,
        getDefault(candidate, "scope", undefined),
      ),
    };
  } else if (type === "external-local") {
    return {
      type,
      mode: sanitizeEnumeration(
        `${path}.mode`,
        getDefault(candidate, "mode", "sloppy"),
        MODE_ENUM,
      ),
      program: sanitizeEnumeration(
        `${path}.program`,
        getDefault(candidate, "program", "script"),
        ["module", "script"],
      ),
      closure: sanitizeEnumeration(
        `${path}.closure`,
        getDefault(candidate, "closure", "none"),
        ["none", "function", "method", "constructor", "derived-constructor"],
      ),
    };
  } else {
    throw new AranTypeError(type);
  }
};

/**
 * @type {(
 *  path: string,
 *  candidate: unknown,
 * ) => import("./context").GlobalContext}
 */
export const sanitizeGlobalContext = (path, candidate) => ({
  type: sanitizeSingleton(
    `${path}.type`,
    getDefault(candidate, "type", "global"),
    "global",
  ),
});

/**
 * @type {(
 *   path: string,
 *   program: unknown,
 * ) => "script" | "module" | "eval"}
 */
const sanitizeProgramKind = (path, program) => {
  const kind = getDefault(program, "kind", undefined);
  if (kind == null) {
    return sanitizeEnumeration(
      `${path}.root.sourceType`,
      getDefault(
        getDefault(program, "root", undefined),
        "sourceType",
        undefined,
      ),
      ["module", "script"],
    );
  } else {
    return sanitizeEnumeration(`${path}.kind`, kind, [
      "module",
      "script",
      "eval",
    ]);
  }
};

/**
 * @type {<B>(
 *   path: string,
 *   candidate: object,
 * ) => import("./program").Program<B>}
 */
export const sanitizeProgram = (path, candidate) => {
  const kind = sanitizeProgramKind(path, candidate);
  const base = /** @type {any} */ (getDefault(candidate, "base", "main"));
  if (kind === "module") {
    return {
      kind,
      base,
      root: sanitizeModuleProgram(
        `${path}.root`,
        getDefault(candidate, "root", undefined),
      ),
      context: sanitizeGlobalContext(
        `${path}.context`,
        getDefault(candidate, "context", undefined),
      ),
    };
  } else if (kind === "script") {
    return {
      kind,
      base,
      root: sanitizeScriptProgram(
        `${path}.root`,
        getDefault(candidate, "root", undefined),
      ),
      context: sanitizeGlobalContext(
        `${path}.context`,
        getDefault(candidate, "context", undefined),
      ),
    };
  } else if (kind === "eval") {
    const root = sanitizeScriptProgram(
      `${path}.root`,
      getDefault(candidate, "root", undefined),
    );
    const context = sanitizeContext(
      `${path}.context`,
      getDefault(candidate, "context", undefined),
    );
    if (context.type === "global") {
      return { kind, base, root, context };
    } else if (context.type === "external-local") {
      return { kind, base, root, context };
    } else if (context.type === "internal-local") {
      return { kind, base, root, context };
    } else {
      throw new AranTypeError(context);
    }
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => {
 *   global_variable: estree.Variable,
 *   intrinsic_variable: estree.Variable,
 * }}
 */
export const sanitizeSetupConfig = (path, candidate) => ({
  global_variable: sanitizeVariable(
    `${path}.global_variable`,
    getDefault(candidate, "global_variable", "globalThis"),
  ),
  intrinsic_variable: sanitizeVariable(
    `${path}.intrinsic_variable`,
    getDefault(candidate, "intrinsic_variable", "_ARAN_INTRINSIC_"),
  ),
});

/**
 * @type {<B, L>(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./config").Config<B, L>}
 */
export const sanitizeConfig = (path, candidate) => ({
  pointcut: sanitizePointcut(
    `${path}.pointcut`,
    getDefault(candidate, "pointcut", false),
  ),
  locate: sanitizeLocate(
    `${path}.locate`,
    getDefault(candidate, "locate", DEFAULT_LOCATE),
  ),
  reify_global: sanitizeBoolean(
    `${path}.reify_global`,
    getDefault(candidate, "reify_global", false),
  ),
  global_variable: sanitizeVariable(
    `${path}.global_variable`,
    getDefault(candidate, "global_variable", "globalThis"),
  ),
  advice_variable: sanitizeVariable(
    `${path}.advice_variable`,
    getDefault(candidate, "advice_variable", "_ARAN_ADVICE_"),
  ),
  intrinsic_variable: sanitizeVariable(
    `${path}.intrinsic_variable`,
    getDefault(candidate, "intrinsic_variable", "_ARAN_INTRINSIC_"),
  ),
  escape_prefix: sanitizeVariable(
    `${path}.escape_prefix`,
    getDefault(candidate, "escape_prefix", "_ARAN_"),
  ),
});
