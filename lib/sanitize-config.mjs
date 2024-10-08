import {
  hasNarrowObject,
  includes,
  isIterable,
  listEntry,
  map,
  mapIndex,
  reduceEntry,
} from "./util/index.mjs";
import { AranTypeError, AranConfigError } from "./report.mjs";
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

/** @type {["normal", "standalone"]} */
const ARAN_MODE = ["normal", "standalone"];

/** @type {["module", "script", "eval"]} */
const KIND = ["module", "script", "eval"];

/** @type {["global", "local", "aran"]} */
const SITU = ["global", "local", "aran"];

/** @type {["builtin", "emulate"]} */
const GLOBAL_DECLARATIVE_RECORD = ["builtin", "emulate"];

/////////////
// Atomic  //
/////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(report: string, candidate: unknown) => string}
 */
const sanitizeString = (report, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranConfigError({
      target: report,
      expect: "a string",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(report: string, candidate: unknown) => number}
 */
const sanitizeNumber = (report, candidate) => {
  if (typeof candidate !== "number") {
    throw new AranConfigError({
      target: report,
      expect: "a number",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(report: string, candidate: unknown) => function}
 */
const sanitizeFunction = (report, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranConfigError({
      target: report,
      expect: "a function",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(report: string, candidate: unknown) => import("./estree").Variable}
 */
export const sanitizeVariable = (report, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranConfigError({
      target: report,
      expect: "a string",
      actual: candidate,
    });
  }
  if (!apply(testRegExp, variable_regexp, [candidate])) {
    throw new AranConfigError({
      target: report,
      expect: "a valid estree identifier",
      actual: candidate,
    });
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
    throw new AranConfigError({
      target: report,
      expect: "an array",
      actual: candidate,
    });
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
    throw new AranConfigError({
      target: report,
      expect: "an object",
      actual: candidate,
    });
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
  throw new AranConfigError({
    target: report,
    expect: `one of ${stringifyJson(enumeration)}`,
    actual: candidate,
  });
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
    throw new AranConfigError({
      target: report,
      expect: stringifyJson(singleton),
      actual: candidate,
    });
  }
};

/**
 * @type {(
 *   report: string,
 *   root: unknown,
 * ) => import("./estree").ModuleProgram}
 */
const sanitizeModuleProgram = (report, candidate) => {
  const type = getDefault(candidate, "type", undefined);
  if (type === "Program") {
    const kind = getDefault(candidate, "sourceType", undefined);
    if (kind === "module") {
      return /** @type {any} */ (candidate);
    } else {
      throw new AranConfigError({
        target: `${report}.sourceType`,
        expect: "'module'",
        actual: kind,
      });
    }
  } else {
    throw new AranConfigError({
      target: `${report}.type`,
      expect: "'Program'",
      actual: type,
    });
  }
};

/**
 * @type {(
 *   report: string,
 *   root: unknown,
 * ) => import("./estree").ScriptProgram}
 */
const sanitizeScriptProgram = (report, candidate) => {
  const type = getDefault(candidate, "type", undefined);
  if (type === "Program") {
    const kind = getDefault(candidate, "sourceType", undefined);
    if (kind === "script") {
      return /** @type {any} */ (candidate);
    } else {
      throw new AranConfigError({
        target: `${report}.sourceType`,
        expect: "'script'",
        actual: kind,
      });
    }
  } else {
    throw new AranConfigError({
      target: `${report}.type`,
      expect: "'Program'",
      actual: type,
    });
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/meta").Meta}
 */
const sanitizePackMeta = (report, meta) => ({
  body: sanitizeString(`${report}.body`, getDefault(meta, "body", undefined)),
  tail: sanitizeNumber(`${report}.tail`, getDefault(meta, "tail", undefined)),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").Frame}
 */
const sanitizeFrame = (report, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranConfigError({
      target: report,
      expect: "an object",
      actual: candidate,
    });
  }
  const type = "type" in candidate ? candidate.type : undefined;
  if (typeof type !== "string") {
    throw new AranConfigError({
      target: `${report}.type`,
      expect: "a string",
      actual: type,
    });
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
 * ) => import("./source").GlobalSitu}
 */
const sanitizeGlobalSitu = (report, candidate) => ({
  type: sanitizeSingleton(
    `${report}.type`,
    getDefault(candidate, "type", "aran"),
    "global",
  ),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").DeepLocalSitu}
 */
const sanitizeDeepLocalSitu = (report, candidate) => ({
  type: sanitizeSingleton(
    `${report}.type`,
    getDefault(candidate, "type", "aran"),
    "aran",
  ),
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
 * ) => import("./source").RootLocalSitu}
 */
const sanitizeRootLocalSitu = (report, candidate) => ({
  type: sanitizeSingleton(
    `${report}.type`,
    getDefault(candidate, "type", "aran"),
    "local",
  ),
  mode: sanitizeEnumeration(
    `${report}.mode`,
    getDefault(candidate, "meta", "sloppy"),
    MODE,
  ),
});

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").Situ}
 */
const sanitizeSitu = (report, candidate) => {
  const type = sanitizeEnumeration(
    `${report}.type`,
    getDefault(candidate, "type", "global"),
    SITU,
  );
  switch (type) {
    case "global": {
      return sanitizeGlobalSitu(report, candidate);
    }
    case "local": {
      return sanitizeRootLocalSitu(report, candidate);
    }
    case "aran": {
      return sanitizeDeepLocalSitu(report, candidate);
    }
    default: {
      throw new AranTypeError(type);
    }
  }
};

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
      situ: sanitizeGlobalSitu(
        `${report}.situ`,
        getDefault(candidate, "situ", null),
      ),
      root: sanitizeModuleProgram(
        `${report}.root`,
        getDefault(candidate, "root", undefined),
      ),
    };
  } else if (kind === "script") {
    return {
      kind,
      path,
      situ: sanitizeGlobalSitu(
        `${report}.situ`,
        getDefault(candidate, "situ", null),
      ),
      root: sanitizeScriptProgram(
        `${report}.root`,
        getDefault(candidate, "root", undefined),
      ),
    };
  } else if (kind === "eval") {
    return {
      kind,
      path,
      situ: sanitizeSitu(`${report}.situ`, getDefault(candidate, "situ", null)),
      root: sanitizeScriptProgram(
        `${report}.root`,
        getDefault(candidate, "root", undefined),
      ),
    };
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
 * ) => import("./weave/standard/aspect").Kind}
 */
const sanitizeStandardAspectKind = (report, candidate) =>
  sanitizeEnumeration(report, candidate, standard_aspect_kind_enumeration);

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => null | import("./weave/standard/aspect").Pointcut}
 */
const sanitizeStandardPointcut = (report, candidate) => {
  if (candidate === null) {
    return candidate;
  } else if (typeof candidate === "boolean") {
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
        throw new AranConfigError({
          target: `${report}@keys`,
          expect: `one of ${stringifyJson(standard_aspect_kind_enumeration)}`,
          actual: key,
        });
      }
      if (typeof val !== "function" && typeof val !== "boolean") {
        throw new AranConfigError({
          target: `${report}.${key}`,
          expect: "either a function or a boolean",
          actual: val,
        });
      }
    }
    return /** @type {any} */ (candidate);
  } else {
    throw new AranConfigError({
      target: report,
      expect: "either a function, a boolean, an iterable, or an object",
      actual: candidate,
    });
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
      `${report}.${key}.kind`,
      getDefault(val, "kind", undefined),
      flexible_aspect_kind_enumeration,
    ),
    pointcut: /** @type {any} */ (
      sanitizeFunction(
        `${report}.${key}.pointcut`,
        getDefault(val, "pointcut", undefined),
      )
    ),
  },
];

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => null | import("./weave/flexible/aspect").Pointcut}
 */
const sanitizeFlexiblePointcut = (report, candidate) => {
  if (candidate === null) {
    return candidate;
  } else {
    return /** @type {any} */ (
      reduceEntry(
        map(listEntry(sanitizeObject(report, candidate)), (entry) =>
          sanitizeFlexiblePointcutEntry(report, entry),
        ),
      )
    );
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./config").Config}
 */
export const sanitizeConfig = (report, candidate) => ({
  mode: sanitizeEnumeration(
    `${report}.mode`,
    getDefault(candidate, "mode", "normal"),
    ARAN_MODE,
  ),
  global_declarative_record: sanitizeEnumeration(
    `${report}.global_declarative_record`,
    getDefault(candidate, "global_declarative_record", "builtin"),
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
    getDefault(candidate, "escape_prefix", "_aran_"),
  ),
  standard_pointcut: sanitizeStandardPointcut(
    `${report}.standard_pointcut`,
    getDefault(candidate, "standard_pointcut", null),
  ),
  flexible_pointcut: sanitizeFlexiblePointcut(
    `${report}.flexible_pointcut`,
    getDefault(candidate, "flexible_pointcut", null),
  ),
  initial_state: /** @type {import("./json").Json} */ (
    getDefault(candidate, "initial_state", null)
  ),
  advice_variable: sanitizeVariable(
    `${report}.advice_variable`,
    getDefault(candidate, "advice_variable", "_ARAN_ADVICE_"),
  ),
});
