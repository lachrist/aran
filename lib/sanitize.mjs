import { hasNarrowObject, includes, mapIndex } from "./util/index.mjs";
import { AranTypeError, AranInputError } from "./error.mjs";

const {
  Object,
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
 * @type {(value: unknown) => object}
 */
const toObject = Object;

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
 * @type {(path: string, candidate: unknown) => estree.Program}
 */
const sanitizeEstreeProgram = (path, candidate) => {
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    "type" in candidate &&
    candidate.type === "Program"
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
const sanitizeLocate = (path, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranInputError(path, "a function", candidate);
  }
  return /** @type {any} */ (candidate);
};

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./unbuild/meta").PackMeta}
 */
const sanitizePackMeta = (path, meta) => {
  if (typeof meta !== "object" || meta === null) {
    throw new AranInputError(path, "an object", meta);
  }
  const { product, prime_index } = {
    product: undefined,
    prime_index: undefined,
    ...meta,
  };
  return {
    product: sanitizeString(`${path}.product`, product),
    prime_index: sanitizeNumber(`${path}.prime_index`, prime_index),
  };
};

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
    typeof candidate === "object" &&
      candidate !== null &&
      hasNarrowObject(candidate, "type")
      ? candidate.type
      : "global",
    ["global", "internal-local", "external-local"],
  );
  if (type === "global") {
    return { type: "global" };
  } else if (type === "internal-local") {
    const { meta, scope } = {
      meta: undefined,
      scope: undefined,
      ...toObject(candidate),
    };
    return {
      type: "internal-local",
      meta: sanitizePackMeta(`${path}.meta`, meta),
      scope: sanitizePackScope(`${path}.scope`, scope),
    };
  } else if (type === "external-local") {
    const { mode, program, closure } = {
      mode: "sloppy",
      program: "script",
      closure: "none",
    };
    return {
      type: "external-local",
      mode: sanitizeEnumeration(`${path}.mode`, mode, MODE_ENUM),
      program: sanitizeEnumeration(`${path}.program`, program, [
        "module",
        "script",
      ]),
      closure: sanitizeEnumeration(`${path}.closure`, closure, [
        "none",
        "function",
        "method",
        "constructor",
        "derived-constructor",
      ]),
    };
  } else {
    throw new AranTypeError(type);
  }
};

/**
 * @type {<B>(
 *   path: string,
 *   candidate: object,
 * ) => import("./program").Program<B>}
 */
export const sanitizeProgram = (path, candidate) => {
  const { kind, root, base, context } = {
    kind:
      "root" in candidate &&
      typeof candidate.root === "object" &&
      candidate.root !== null &&
      hasNarrowObject(candidate.root, "sourceType")
        ? candidate.root.sourceType
        : undefined,
    root: undefined,
    base: "main",
    context: null,
  };
  const program = {
    kind: sanitizeEnumeration(`${path}.kind`, kind, [
      "module",
      "script",
      "eval",
    ]),
    root: sanitizeEstreeProgram(`${path}.root`, root),
    // eslint-disable-next-line object-shorthand
    base: /** @type {any} */ (base),
    context: sanitizeContext(`${path}.context`, context),
  };
  if ((program.kind === "module") !== (program.root.sourceType === "module")) {
    throw new AranInputError(
      `${path}.root.sourceType`,
      program.kind === "module" ? "module" : "script",
      program.root.sourceType,
    );
  }
  if (program.kind === "module" || program.kind === "script") {
    if (program.context.type === "global") {
      // ts shenanigans
      return {
        kind: program.kind,
        root: program.root,
        base: program.base,
        context: program.context,
      };
    } else {
      throw new AranInputError(
        `${path}.context.type`,
        "global",
        program.context.type,
      );
    }
  } else if (program.kind === "eval") {
    // ts shenanigans
    if (program.context.type === "global") {
      return {
        kind: program.kind,
        root: program.root,
        base: program.base,
        context: program.context,
      };
    } else if (program.context.type === "internal-local") {
      return {
        kind: program.kind,
        root: program.root,
        base: program.base,
        context: program.context,
      };
    } else if (program.context.type === "external-local") {
      return {
        kind: program.kind,
        root: program.root,
        base: program.base,
        context: program.context,
      };
    } else {
      throw new AranTypeError(program.context);
    }
  } else {
    throw new AranTypeError(program.kind);
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
export const sanitizeSetupConfig = (path, candidate) => {
  const { global_variable, intrinsic_variable } = {
    global_variable: "globalThis",
    intrinsic_variable: "_ARAN_INTRINSIC_",
    ...toObject(candidate),
  };
  return {
    global_variable: sanitizeVariable(
      `${path}.global_variable`,
      global_variable,
    ),
    intrinsic_variable: sanitizeVariable(
      `${path}.intrinsic`,
      intrinsic_variable,
    ),
  };
};

/**
 * @type {<B, L>(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./config").Config<B, L>}
 */
export const sanitizeConfig = (path, candidate) => {
  const {
    pointcut,
    locate,
    reify_global,
    global_variable,
    advice_variable,
    intrinsic_variable,
    escape_prefix,
  } = {
    pointcut: false,
    locate: (/** @type {string} */ path, /** @type {string} */ root) =>
      `${root}.${path}`,
    reify_global: false,
    global_variable: "globalThis",
    advice_variable: "_ARAN_ADVICE_",
    intrinsic_variable: "_ARAN_INTRINSIC_",
    escape_prefix: "_ARAN_",
    ...toObject(candidate),
  };
  return {
    pointcut: sanitizePointcut(`${path}.pointcut`, pointcut),
    locate: sanitizeLocate(`${path}.locate`, locate),
    reify_global: sanitizeBoolean(`${path}.reify_global`, reify_global),
    global_variable: sanitizeVariable(
      `${path}.global_variable`,
      global_variable,
    ),
    advice_variable: sanitizeVariable(
      `${path}.advice_variable`,
      advice_variable,
    ),
    intrinsic_variable:
      intrinsic_variable == null
        ? null
        : sanitizeVariable(`${path}.intrinsic_variable`, intrinsic_variable),
    escape_prefix: sanitizeVariable(`${path}.escape_prefix`, escape_prefix),
  };
};
