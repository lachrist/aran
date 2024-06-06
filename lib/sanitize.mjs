import {
  hasNarrowObject,
  includes,
  isIterable,
  listEntry,
  map,
  mapIndex,
  reduceEntry,
} from "./util/index.mjs";
import { AranTypeError, AranInputError } from "./error.mjs";
import {
  flexible_aspect_kind_enumeration,
  standard_aspect_kind_enumeration,
} from "./weave/index.mjs";

const {
  Array: { isArray, from: toArray },
  undefined,
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
  JSON: { stringify: stringifyJson },
} = globalThis;

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

/** @type {["strict", "sloppy"]} */
const MODE = ["strict", "sloppy"];

/**
 * @type {["standard", "flexible"]}
 */
const WEAVE = ["standard", "flexible"];

/** @type {["normal", "standalone"]} */
const ARAN_MODE = ["normal", "standalone"];

/** @type {["module", "script", "eval"]} */
const KIND = ["module", "script", "eval"];

/** @type {["global", "local.root", "local.deep"]} */
const SITU = ["global", "local.root", "local.deep"];

/** @type {["native", "emulate"]} */
const GLOBAL_DECLARATIVE_RECORD = ["native", "emulate"];

/** @type {["embed", "console", "ignore", "throw"]} */
const WARNING = ["embed", "console", "ignore", "throw"];

/** @type {["embed", "throw"]} */
const EARLY_SYNTAX_ERROR = ["embed", "throw"];

/////////////
// Atomic  //
/////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(report: string, candidate: unknown) => string}
 */
const sanitizeString = (report, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(report, "a string", candidate);
  }
  return candidate;
};

/**
 * @type {(report: string, candidate: unknown) => number}
 */
const sanitizeNumber = (report, candidate) => {
  if (typeof candidate !== "number") {
    throw new AranInputError(report, "a number", candidate);
  }
  return candidate;
};

/**
 * @type {(report: string, candidate: unknown) => function}
 */
const sanitizeFunction = (report, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranInputError(report, "a boolean", candidate);
  }
  return candidate;
};

/**
 * @type {(report: string, candidate: unknown) => import("./estree").Variable}
 */
export const sanitizeVariable = (report, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(report, "a string", candidate);
  }
  if (!apply(testRegExp, variable_regexp, [candidate])) {
    throw new AranInputError(report, "a valid estree identifier", candidate);
  }
  return /** @type {import("./estree").Variable} */ (candidate);
};

/**
 * @type {<X>(
 *   report: string,
 *   candidate: unknown,
 *   sanitizeItem: (report: string, element: unknown) => X,
 * ) => X[]}
 */
const sanitizeArray = (report, candidate, sanitizeItem) => {
  if (isArray(candidate)) {
    return mapIndex(candidate.length, (index) =>
      sanitizeItem(`${report}[${index}]`, candidate[index]),
    );
  } else {
    throw new AranInputError(report, "an array", candidate);
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => object}
 */
const sanitizeObject = (report, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(report, "an object", candidate);
  }
  return candidate;
};

/**
 * @type {<X extends (
 *   | undefined
 *   | null
 *   | boolean
 *   | number
 *   | string
 *   | bigint
 * )>(
 *   report: string,
 *   candidate: unknown,
 *   record: X[],
 * ) => X}
 */
const sanitizeEnumeration = (report, candidate, enumeration) => {
  for (const element of enumeration) {
    if (candidate === element) {
      return element;
    }
  }
  throw new AranInputError(
    report,
    `one of ${stringifyJson(enumeration)}`,
    candidate,
  );
};

/**
 * @type {<X extends (
 *   | undefined
 *   | null
 *   | boolean
 *   | number
 *   | string
 *   | bigint
 * )>(
 *   report: string,
 *   candidate: unknown,
 *   singleton: X,
 * ) => X}
 */
const sanitizeSingleton = (report, candidate, singleton) => {
  if (candidate === singleton) {
    return singleton;
  } else {
    throw new AranInputError(report, stringifyJson(singleton), candidate);
  }
};

/**
 * @type {(report: string, root: unknown) => (
 *   | import("./estree").ModuleProgram
 *   | import("./source").EarlySyntaxError
 * )}
 */
const sanitizeModuleProgram = (report, candidate) => {
  const type = getDefault(candidate, "type", undefined);
  if (type === "Program") {
    // eslint-disable-next-line local/no-impure
    sanitizeSingleton(
      `${report}.sourceType`,
      getDefault(candidate, "sourceType", undefined),
      "module",
    );
    return /** @type {any} */ (candidate);
  } else if (type === "EarlySyntaxError") {
    return {
      type: "EarlySyntaxError",
      message: sanitizeString(
        `${report}.message`,
        getDefault(candidate, "message", "generic syntax error"),
      ),
    };
  } else {
    throw new AranInputError(
      `${report}.type`,
      "either Program or EarlySyntaxError",
      type,
    );
  }
};

/**
 * @type {(report: string, root: unknown) => (
 *  | import("./estree").ScriptProgram
 *  | import("./source").EarlySyntaxError
 * )}
 */
const sanitizeScriptProgram = (report, candidate) => {
  const type = getDefault(candidate, "type", undefined);
  if (type === "Program") {
    // eslint-disable-next-line local/no-impure
    sanitizeSingleton(
      `${report}.sourceType`,
      getDefault(candidate, "sourceType", undefined),
      "script",
    );
    return /** @type {any} */ (candidate);
  } else if (type === "EarlySyntaxError") {
    return {
      type: "EarlySyntaxError",
      message: sanitizeString(
        `${report}.message`,
        getDefault(candidate, "message", "generic syntax error"),
      ),
    };
  } else {
    throw new AranInputError(
      `${report}.type`,
      "either Program or EarlySyntaxError",
      type,
    );
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/meta").PackMeta}
 */
const sanitizePackMeta = (report, meta) => ({
  product: sanitizeString(
    `${report}.product`,
    getDefault(meta, "product", undefined),
  ),
  prime_index: sanitizeNumber(
    `${report}.prime_index`,
    getDefault(meta, "prime_index", undefined),
  ),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").Frame}
 */
const sanitizeFrame = (report, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(report, "an object", candidate);
  }
  const type = "type" in candidate ? candidate.type : undefined;
  if (typeof type !== "string") {
    throw new AranInputError(`${report}.type`, "a string", type);
  }
  return /** @type {any} */ (candidate);
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").PackScope}
 */
const sanitizePackScope = (report, candidate) =>
  /** @type {any} */ (
    sanitizeArray(`${report}.frames`, candidate, sanitizeFrame)
  );

//////////////
// Compound //
//////////////

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").GlobalContext}
 */
export const sanitizeGlobalContext = (_report, _candidate) => ({});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").DeepLocalContext}
 */
export const sanitizeDeepLocalContext = (report, candidate) => ({
  depth: /** @type {import("./weave/depth").Depth} */ (
    sanitizeNumber(`${report}.depth`, getDefault(candidate, "depth", 0))
  ),
  meta: sanitizePackMeta(
    `${report}.meta`,
    getDefault(candidate, "meta", undefined),
  ),
  scope: sanitizePackScope(
    `${report}.scope`,
    getDefault(candidate, "scope", undefined),
  ),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").RootLocalContext}
 */
export const sanitizeRootLocalContext = (report, candidate) => ({
  mode: sanitizeEnumeration(
    `${report}.mode`,
    getDefault(candidate, "meta", "sloppy"),
    MODE,
  ),
});

/**
 * @type {(
 *   report: string,
 *   source: unknown,
 * ) => "script" | "module" | "eval"}
 */
const sanitizeSourceKind = (report, source) => {
  const kind = getDefault(source, "kind", undefined);
  if (kind == null) {
    return sanitizeEnumeration(
      `${report}.root.sourceType`,
      getDefault(
        getDefault(source, "root", undefined),
        "sourceType",
        undefined,
      ),
      ["module", "script"],
    );
  } else {
    return sanitizeEnumeration(`${report}.kind`, kind, KIND);
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: object,
 * ) => import("./source").Source}
 */
export const sanitizeSource = (report, candidate) => {
  const kind = sanitizeSourceKind(report, candidate);
  const path = /** @type {import("./path").Path} */ (
    sanitizeString(`${report}.path`, getDefault(candidate, "path", "$"))
  );
  if (kind === "module") {
    return {
      kind,
      path,
      situ: sanitizeSingleton(
        `${report}.situ`,
        getDefault(candidate, "situ", "global"),
        "global",
      ),
      root: sanitizeModuleProgram(
        `${report}.root`,
        getDefault(candidate, "root", undefined),
      ),
      context: sanitizeGlobalContext(
        `${report}.context`,
        getDefault(candidate, "context", undefined),
      ),
    };
  } else if (kind === "script") {
    return {
      kind,
      path,
      situ: sanitizeSingleton(
        `${report}.situ`,
        getDefault(candidate, "situ", "global"),
        "global",
      ),
      root: sanitizeScriptProgram(
        `${report}.root`,
        getDefault(candidate, "root", undefined),
      ),
      context: sanitizeGlobalContext(
        `${report}.context`,
        getDefault(candidate, "context", undefined),
      ),
    };
  } else if (kind === "eval") {
    const root = sanitizeScriptProgram(
      `${report}.root`,
      getDefault(candidate, "root", undefined),
    );
    const situ = sanitizeEnumeration(
      `${report}.situ`,
      getDefault(candidate, "situ", "global"),
      SITU,
    );
    if (situ === "global") {
      return {
        kind,
        path,
        situ,
        root,
        context: sanitizeGlobalContext(
          `${report}.context`,
          getDefault(candidate, "context", undefined),
        ),
      };
    } else if (situ === "local.root") {
      return {
        kind,
        path,
        situ,
        root,
        context: sanitizeRootLocalContext(
          `${report}.context`,
          getDefault(candidate, "context", undefined),
        ),
      };
    } else if (situ === "local.deep") {
      return {
        kind,
        path,
        situ,
        root,
        context: sanitizeDeepLocalContext(
          `${report}.context`,
          getDefault(candidate, "context", undefined),
        ),
      };
    } else {
      throw new AranTypeError(situ);
    }
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => {
 *   global_variable: import("./estree").Variable,
 *   intrinsic_variable: import("./estree").Variable,
 * }}
 */
export const sanitizeSetupConfig = (report, candidate) => ({
  global_variable: sanitizeVariable(
    `${report}.global_variable`,
    getDefault(candidate, "global_variable", "globalThis"),
  ),
  intrinsic_variable: sanitizeVariable(
    `${report}.intrinsic_variable`,
    getDefault(candidate, "intrinsic_variable", "_ARAN_INTRINSIC_"),
  ),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./config").CommonConfig}
 */
export const sanitizeCommonConfig = (report, candidate) => ({
  mode: sanitizeEnumeration(
    `${report}.mode`,
    getDefault(candidate, "mode", "normal"),
    ARAN_MODE,
  ),
  global_declarative_record: sanitizeEnumeration(
    `${report}.reify_global`,
    getDefault(candidate, "global_declarative_record", "native"),
    GLOBAL_DECLARATIVE_RECORD,
  ),
  global_variable: sanitizeVariable(
    `${report}.global_variable`,
    getDefault(candidate, "global_variable", "globalThis"),
  ),
  intrinsic_variable: sanitizeVariable(
    `${report}.intrinsic_variable`,
    getDefault(candidate, "intrinsic_variable", "_ARAN_INTRINSIC_"),
  ),
  escape_prefix: sanitizeVariable(
    `${report}.escape_prefix`,
    getDefault(candidate, "escape_prefix", "__ARAN__"),
  ),
  warning: sanitizeEnumeration(
    `${report}.warning`,
    getDefault(candidate, "warning", "embed"),
    WARNING,
  ),
  early_syntax_error: sanitizeEnumeration(
    `${report}.early_syntax_error`,
    getDefault(candidate, "early_syntax_error", "embed"),
    EARLY_SYNTAX_ERROR,
  ),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/standard/aspect").AspectKind}
 */
const sanitizeStandardAspectKind = (report, candidate) =>
  sanitizeEnumeration(report, candidate, standard_aspect_kind_enumeration);

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./weave/standard/aspect").Pointcut}
 */
const sanitizeStandardPointcut = (report, candidate) => {
  if (typeof candidate === "boolean") {
    return candidate;
  } else if (isArray(candidate) || isIterable(candidate)) {
    return sanitizeArray(
      report,
      isArray(candidate) ? candidate : toArray(candidate),
      sanitizeStandardAspectKind,
    );
  } else if (typeof candidate === "function") {
    return /** @type {any} */ (candidate);
  } else if (typeof candidate === "object" && candidate !== null) {
    const entries = listEntry(candidate);
    for (const [key, val] of entries) {
      if (!includes(standard_aspect_kind_enumeration, key)) {
        throw new AranInputError(
          `${report}@keys`,
          `keys should be one of ${stringifyJson(
            standard_aspect_kind_enumeration,
          )}`,
          key,
        );
      }
      if (typeof val !== "function" && typeof val !== "boolean") {
        throw new AranInputError(
          `${report}.${key}`,
          "either a function or a boolean",
          val,
        );
      }
    }
    return /** @type {any} */ (candidate);
  } else {
    throw new AranInputError(
      report,
      "either a function, a boolean, an iterable, or an object",
      candidate,
    );
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: [unknown, unknown],
 * ) => import("./weave/flexible/aspect").PointcutEntry<
 *   import("./weave/flexible/aspect").AspectKind,
 * >}
 */
const sanitizeFlexiblePointcutEntry = (report, [key, val]) => [
  sanitizeVariable(`${report}@key`, key),
  {
    kind: sanitizeEnumeration(
      `${report}.${key}`,
      key,
      flexible_aspect_kind_enumeration,
    ),
    pointcut: /** @type {any} */ (sanitizeFunction(`${report}.${key}`, val)),
  },
];

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/flexible/aspect").Pointcut}
 */
const sanitizeFlexiblePointcut = (report, candidate) =>
  /** @type {any} */ (
    reduceEntry(
      map(listEntry(sanitizeObject(report, candidate)), (entry) =>
        sanitizeFlexiblePointcutEntry(report, entry),
      ),
    )
  );

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/config").Config}
 */
const sanitizeWeaveConfig = (report, candidate) => {
  const weave = sanitizeEnumeration(
    `${report}.type`,
    getDefault(candidate, "type", "standard"),
    WEAVE,
  );
  switch (weave) {
    case "standard": {
      return {
        weave,
        advice_variable: sanitizeVariable(
          `${report}.advice_variable`,
          getDefault(candidate, "advice_variable", "_ARAN_ADVICE_"),
        ),
        pointcut: sanitizeStandardPointcut(
          `${report}.pointcut`,
          getDefault(candidate, "pointcut", []),
        ),
      };
    }
    case "flexible": {
      return {
        weave,
        pointcut: sanitizeFlexiblePointcut(
          `${report}.pointcut`,
          getDefault(candidate, "pointcut", {}),
        ),
      };
    }
    default: {
      throw new AranTypeError(weave);
    }
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./config").Config}
 */
export const sanitizeConfig = (report, candidate) => ({
  ...sanitizeCommonConfig(report, candidate),
  ...sanitizeWeaveConfig(report, candidate),
});
