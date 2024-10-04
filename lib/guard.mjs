import {
  hasNarrowObject,
  includes,
  isIterable,
  listEntry,
  map,
  mapIndex,
  reduceEntry,
} from "./util/index.mjs";
import { AranTypeError, AranInputError } from "./report.mjs";
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
 *   obj: object,
 *   key: string,
 * ) => unknown}
 */
const get = (obj, key) => (hasNarrowObject(obj, key) ? obj[key] : undefined);

/** @type {["module", "script"]} */
const SOURCE_TYPE = ["module", "script"];

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
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => string}
 */
const guardString = (report, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "a string",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => object}
 */
const guardObject = (report, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "an object",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => number}
 */
const guardNumber = (report, candidate) => {
  if (typeof candidate !== "number") {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "a number",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => function}
 */
const guardFunction = (report, candidate) => {
  if (typeof candidate !== "function") {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "a function",
      actual: candidate,
    });
  }
  return candidate;
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("estree-sentry").VariableName}
 */
export const guardVariable = (report, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "a string",
      actual: candidate,
    });
  }
  if (!apply(testRegExp, variable_regexp, [candidate])) {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "a valid estree identifier",
      actual: candidate,
    });
  }
  return /** @type {import("estree-sentry").VariableName} */ (candidate);
};

/**
 * @type {<X>(
 *   report: string,
 *   candidate: unknown,
 *   guardItem: (report: string, element: unknown) => X,
 * ) => X[]}
 */
const guardArray = (report, candidate, guardItem) => {
  if (isArray(candidate)) {
    return mapIndex(candidate.length, (index) =>
      guardItem(`${report}[${index}]`, candidate[index]),
    );
  } else {
    throw new AranInputError({
      conditions: [],
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
 * ) => unknown[]}
 */
const guardUnknownArray = (report, candidate) => {
  if (isArray(candidate)) {
    return candidate;
  } else {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "an array",
      actual: candidate,
    });
  }
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
const guardEnumeration = (report, candidate, enumeration) => {
  for (const element of enumeration) {
    if (candidate === element) {
      return element;
    }
  }
  throw new AranInputError({
    conditions: [],
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
const guardSingleton = (report, candidate, singleton) => {
  if (candidate === singleton) {
    return singleton;
  } else {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: stringifyJson(singleton),
      actual: candidate,
    });
  }
};

//////////////
// Compound //
//////////////

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/meta").Meta}
 */
const guardPackMeta = (report, meta) => {
  const object = guardObject(report, meta);
  return {
    body: guardString(`${report}.body`, get(object, "body")),
    tail: guardNumber(`${report}.tail`, get(object, "tail")),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").Frame}
 */
const guardFrame = (report, candidate) => {
  // eslint-disable-next-line local/no-impure
  guardString(`${report}.type`, get(guardObject(report, candidate), "type"));
  return /** @type {any} */ (candidate);
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./unbuild/scope").PackScope}
 */
const guardPackScope = (report, candidate) =>
  /** @type {import("./unbuild/scope").PackScope} */ (
    guardArray(`${report}.frames`, candidate, guardFrame)
  );

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").GlobalSitu}
 */
const guardGlobalSitu = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    type: guardSingleton(
      `${report}.type`,
      get(object, "type") ?? "global",
      "global",
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").DeepLocalSitu}
 */
const guardDeepLocalSitu = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    type: guardSingleton(`${report}.type`, get(object, "type"), "aran"),
    mode: guardEnumeration(`${report}.mode`, get(object, "mode"), MODE),
    depth: /** @type {import("./weave/depth").Depth} */ (
      guardNumber(`${report}.depth`, get(object, "depth"))
    ),
    meta: guardPackMeta(`${report}.meta`, get(object, "meta")),
    scope: guardPackScope(`${report}.scope`, get(object, "scope")),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").RootLocalSitu}
 */
const guardRootLocalSitu = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    type: guardSingleton(
      `${report}.type`,
      get(object, "type") ?? "local",
      "local",
    ),
    mode: guardEnumeration(
      `${report}.mode`,
      get(object, "mode") ?? "sloppy",
      MODE,
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./source").Situ}
 */
const guardSitu = (report, candidate) => {
  const object = guardObject(report, candidate);
  const type = guardEnumeration(
    `${report}.type`,
    get(object, "type") ?? "global",
    SITU,
  );
  switch (type) {
    case "global": {
      return guardGlobalSitu(report, candidate);
    }
    case "local": {
      return guardRootLocalSitu(report, candidate);
    }
    case "aran": {
      return guardDeepLocalSitu(report, candidate);
    }
    default: {
      throw new AranTypeError(type);
    }
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import(".").Program}
 */
const guardRoot = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    type: guardSingleton(`${report}.type`, get(object, "type"), "Program"),
    sourceType: guardEnumeration(
      `${report}.sourceType`,
      get(object, "sourceType"),
      SOURCE_TYPE,
    ),
    body: guardUnknownArray(`${report}.body`, get(object, "body")),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import(".").File<import("./hash").FilePath>}
 */
export const guardFile = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    root: guardRoot(`${report}.root`, get(object, "root")),
    kind: guardEnumeration(
      `${report}.kind`,
      get(object, "kind") ?? get(get(object, "root") ?? {}, "sourceType"),
      KIND,
    ),
    situ: guardSitu(`${report}.situ`, get(object, "situ") ?? { global: {} }),
    path: /** @type {import("./hash").FilePath} */ (get(object, "path")),
  };
};

/**
 * @type {import(".").Digest<
 *   import("./hash").FilePath,
 *   import("./hash").Hash,
 * >}}
 */
const digestDefault = (_node, node_path, file_path, _kind) =>
  /** @type {import("./hash").Hash} */ (`${file_path}#${node_path}`);

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import(".").Digest<
 *   import("./hash").FilePath,
 *   import("./hash").Hash,
 * >}
 */
const guardDigest = (report, candidate) => {
  if (candidate == null) {
    return digestDefault;
  } else {
    return /** @type {any} */ (guardFunction(report, candidate));
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import(".").SetupConf}
 */
export const guardSetupConf = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    global_variable: guardVariable(
      `${report}.global_variable`,
      get(object, "global_variable") ?? "globalThis",
    ),
    intrinsic_variable: guardVariable(
      `${report}.intrinsic_variable`,
      get(object, "intrinsic_variable") ?? "_ARAN_INTRINSIC_",
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/standard/aspect").Kind}
 */
const guardStandardAspectKind = (report, candidate) =>
  guardEnumeration(report, candidate, standard_aspect_kind_enumeration);

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => null | import("./weave/standard/aspect").Pointcut<import("./hash").Hash>}
 */
const guardStandardPointcut = (report, candidate) => {
  if (candidate === null) {
    return candidate;
  } else if (typeof candidate === "boolean") {
    return candidate;
  } else if (isArray(candidate) || isIterable(candidate)) {
    return guardArray(
      report,
      isArray(candidate) ? candidate : toArray(candidate),
      guardStandardAspectKind,
    );
  } else if (typeof candidate === "function") {
    return /** @type {any} */ (candidate);
  } else if (typeof candidate === "object" && candidate !== null) {
    const entries = listEntry(candidate);
    for (const [key, val] of entries) {
      if (!includes(standard_aspect_kind_enumeration, key)) {
        throw new AranInputError({
          conditions: [],
          target: `${report}@keys`,
          expect: `one of ${stringifyJson(standard_aspect_kind_enumeration)}`,
          actual: key,
        });
      }
      if (typeof val !== "function" && typeof val !== "boolean") {
        throw new AranInputError({
          conditions: [],
          target: `${report}.${key}`,
          expect: "either a function or a boolean",
          actual: val,
        });
      }
    }
    return /** @type {any} */ (candidate);
  } else {
    throw new AranInputError({
      conditions: [],
      target: report,
      expect: "either a function, a boolean, an iterable, or an object",
      actual: candidate,
    });
  }
};

/**
 * @type {<H>(
 *   report: string,
 *   candidate: [unknown, unknown],
 * ) => import("./weave/flexible/aspect").PointcutEntry<
 *   H,
 *   import("./weave/flexible/aspect").AspectKind,
 * >}
 */
const guardFlexiblePointcutEntry = (report, [key, val]) => {
  const obj = guardObject(report, val);
  return [
    guardVariable(`${report}@key`, key),
    {
      kind: guardEnumeration(
        `${report}.${key}.kind`,
        get(obj, "kind"),
        flexible_aspect_kind_enumeration,
      ),
      pointcut: /** @type {any} */ (
        guardFunction(`${report}.${key}.pointcut`, get(obj, "pointcut"))
      ),
    },
  ];
};

/**
 * @type {<H>(
 *   report: string,
 *   candidate: unknown,
 * ) => null | import("./weave/flexible/aspect").Pointcut<import("./hash").Hash>}
 */
const guardFlexiblePointcut = (report, candidate) => {
  if (candidate === null) {
    return candidate;
  } else {
    return /** @type {any} */ (
      reduceEntry(
        map(listEntry(guardObject(report, candidate)), (entry) =>
          guardFlexiblePointcutEntry(report, entry),
        ),
      )
    );
  }
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import(".").Conf<
 *   import("./hash").FilePath,
 *   import("./hash").Hash
 * >}
 */
export const guardConf = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    mode: guardEnumeration(
      `${report}.mode`,
      get(object, "mode") ?? "normal",
      ARAN_MODE,
    ),
    global_declarative_record: guardEnumeration(
      `${report}.global_declarative_record`,
      get(object, "global_declarative_record") ?? "builtin",
      GLOBAL_DECLARATIVE_RECORD,
    ),
    global_variable: guardVariable(
      `${report}.global_variable`,
      get(object, "global_variable") ?? "globalThis",
    ),
    intrinsic_variable: guardVariable(
      `${report}.intrinsic_variable`,
      get(object, "intrinsic_variable") ?? "_ARAN_INTRINSIC_",
    ),
    escape_prefix: guardVariable(
      `${report}.escape_prefix`,
      get(object, "escape_prefix") ?? "_aran_",
    ),
    standard_pointcut: guardStandardPointcut(
      `${report}.standard_pointcut`,
      get(object, "standard_pointcut") ?? null,
    ),
    flexible_pointcut: guardFlexiblePointcut(
      `${report}.flexible_pointcut`,
      get(object, "flexible_pointcut") ?? null,
    ),
    initial_state: /** @type {import("./json").Json} */ (
      get(object, "initial_state") ?? null
    ),
    advice_variable: guardVariable(
      `${report}.advice_variable`,
      get(object, "advice_variable") ?? "_ARAN_ADVICE_",
    ),
    digest: guardDigest(`${report}.digest`, get(object, "digest") ?? null),
  };
};
