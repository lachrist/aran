import { hasOwn, includes, listKey, mapIndex } from "./util/index.mjs";
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

/** @type {["alien", "reify"]} */
const SCOPE_ENUM = ["alien", "reify"];

const SCOPE_ITEM_ENUM = listKey(
  /**
   * @type {Record<
   *   import("./context").ExternalLocalEvalParameter,
   *   null
   * >}
   */
  ({
    "this": null,
    "new.target": null,
    "import.meta": null,
    "super.call": null,
    "super.get": null,
    "super.set": null,
  }),
);

const SOURCE_ENUM = listKey(
  /** @type {Record<import("./context").Context["source"], null>} */ ({
    "module": null,
    "script": null,
    "global-eval": null,
    "local-eval": null,
    "aran-eval": null,
  }),
);

/////////////
// Atomic  //
/////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

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
  if (
    !hasOwn(meta, "product") ||
    typeof (/** @type {any} */ (meta).product) !== "string"
  ) {
    throw new AranInputError(
      `${path}.product`,
      "a string",
      /** @type {any} */ (meta).product,
    );
  }
  if (
    !hasOwn(meta, "prime_index") ||
    typeof (/** @type {any} */ (meta).prime_index) !== "number"
  ) {
    throw new AranInputError(
      `${path}.prime_index`,
      "a number",
      /** @type {any} */ (meta).prime_index,
    );
  }
  return /** @type {any} */ (meta);
};

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").Scope}
 */
const sanitizeScope = (path, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(path, "an object", candidate);
  }
  return /** @type {any} */ (candidate);
};

//////////////
// Compound //
//////////////

/**
 * @type {<B>(
 *   path: string,
 *   candidate: object,
 * ) => {
 *   root: estree.Program,
 *   base: B,
 * }}
 */
export const sanitizeProgram = (path, candidate) => {
  const { root, base } = {
    root: undefined,
    base: "main",
    ...candidate,
  };
  return {
    root: sanitizeEstreeProgram(`${path}.root`, root),
    // eslint-disable-next-line object-shorthand
    base: /** @type {any} */ (base),
  };
};

/**
 * @type {(
 *   path: string,
 *   candidate: object,
 * ) => {
 *   global: estree.Variable,
 *   intrinsic: estree.Variable,
 * }}
 */
export const sanitizeSetupConfig = (path, config) => {
  const { global, intrinsic } = {
    global: "globalThis",
    intrinsic: "_ARAN_INTRINSIC_",
    ...config,
  };
  return {
    global: sanitizeVariable(`${path}.global`, global),
    intrinsic: sanitizeVariable(`${path}.intrinsic`, intrinsic),
  };
};

/**
 * @type {<B, L>(
 *   path: string,
 *   candidate: object,
 * ) => import("./config").Config<B, L>}
 */
export const sanitizeConfig = (path, candidate) => {
  const { global, pointcut, advice, intrinsic, escape, locate } = {
    global: "globalThis",
    pointcut: false,
    advice: "_ARAN_ADVICE_",
    intrinsic: "_ARAN_INTRINSIC_",
    escape: "_ARAN_",
    locate: (/** @type {string} */ path, /** @type {string} */ root) =>
      `${root}.${path}`,
    ...candidate,
  };
  return {
    global: sanitizeVariable(`${path}.global`, global),
    pointcut: sanitizePointcut(`${path}.pointcut`, pointcut),
    advice: sanitizeVariable(`${path}.advice`, advice),
    intrinsic:
      intrinsic == null
        ? null
        : sanitizeVariable(`${path}.intrinsic`, intrinsic),
    escape: sanitizeVariable(`${path}.escape`, escape),
    locate: sanitizeLocate(`${path}.locate`, locate),
  };
};

/**
 * @type {(
 *   path: string,
 *   candidate: object,
 *   hint: "script" | "module",
 * ) => import("./context").Context}
 */
export const sanitizeContext = (path, candidate, hint) => {
  const source = sanitizeEnumeration(
    `${path}.source`,
    "source" in candidate ? candidate.source : hint,
    SOURCE_ENUM,
  );
  if ((source === "module") !== (hint === "module")) {
    throw new AranInputError(
      `${path}.source`,
      "compatible with program.sourceType",
      source,
    );
  }
  if (source === "module" || source === "script" || source === "global-eval") {
    return {
      source,
      mode: sanitizeEnumeration(
        `${path}.mode`,
        "mode" in candidate ? candidate.mode : "strict",
        MODE_ENUM,
      ),
      scope: sanitizeEnumeration(
        `${path}.scope`,
        "scope" in candidate ? candidate.scope : "alien",
        SCOPE_ENUM,
      ),
    };
  } else if (source === "local-eval") {
    return {
      source,
      mode: sanitizeEnumeration(
        `${path}.mode`,
        "mode" in candidate ? candidate.mode : "sloppy",
        MODE_ENUM,
      ),
      scope: sanitizeArray(
        `${path}.scope`,
        "scope" in candidate ? candidate.scope : "alien",
        (path, element) => sanitizeEnumeration(path, element, SCOPE_ITEM_ENUM),
      ),
    };
  } else if (source === "aran-eval") {
    return {
      source,
      mode: sanitizeEnumeration(
        `${path}.mode`,
        "mode" in candidate ? candidate.mode : "sloppy",
        MODE_ENUM,
      ),
      meta: sanitizePackMeta(
        `${path}.meta`,
        "meta" in candidate ? candidate.meta : undefined,
      ),
      scope: sanitizeScope(
        `${path}.scope`,
        "scope" in candidate ? candidate.scope : undefined,
      ),
    };
  } else {
    throw new AranTypeError(source);
  }
};
