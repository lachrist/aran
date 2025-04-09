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

/** @type {["global", "local.root", "local.deep"]} */
const SITU = ["global", "local.root", "local.deep"];

/** @type {["global", "local", "aran"]} */
const SITU_TYPE = ["global", "local", "aran"];

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
 * ) => import("./trans/meta.d.ts").Meta}
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
 * ) => import("./trans/scope/index.d.ts").PackScope}
 */
const guardPackScope = (report, candidate) => {
  const object = guardObject(report, candidate);
  // eslint-disable-next-line local/no-impure
  guardEnumeration(`${report}.mode`, get(object, "mode") ?? "sloppy", MODE);
  // eslint-disable-next-line local/no-impure
  guardString(`${report}.root`, get(object, "root"));
  return /** @type {any} */ (object);
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./trans/source.d.ts").GlobalSitu}
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
 * ) => import("./trans/source.d.ts").DeepLocalSitu}
 */
const guardDeepLocalSitu = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    type: guardSingleton(`${report}.type`, get(object, "type"), "aran"),
    meta: guardPackMeta(`${report}.meta`, get(object, "meta")),
    scope: guardPackScope(`${report}.scope`, get(object, "scope")),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./trans/source.d.ts").RootLocalSitu}
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
 * ) => import("./trans/source.d.ts").Situ}
 */
const guardSitu = (report, candidate) => {
  const object = guardObject(report, candidate);
  const type = guardEnumeration(
    `${report}.type`,
    get(object, "type") ?? "global",
    SITU_TYPE,
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
 * ) => import("./trans/config.d.ts").LooseEstreeProgram}
 */
const guardLoostEstreeProgram = (report, candidate) => {
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
 * ) => import("./trans/config-internal.d.ts").InternalFile}
 */
export const guardFile = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    root: guardLoostEstreeProgram(`${report}.root`, get(object, "root")),
    kind: guardEnumeration(
      `${report}.kind`,
      get(object, "kind") ?? get(get(object, "root") ?? {}, "sourceType"),
      KIND,
    ),
    situ: guardSitu(`${report}.situ`, get(object, "situ") ?? { global: {} }),
    path: /** @type {import("./trans/hash.d.ts").FilePath} */ (
      get(object, "path")
    ),
  };
};

/**
 * @type {import("./trans/config-internal.d.ts").InternalDigest}
 */
const digestDefault = (_node, node_path, file_path, _kind) =>
  /** @type {import("./trans/hash.d.ts").Hash} */ (`${file_path}#${node_path}`);

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./trans/config-internal.d.ts").InternalDigest}
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
 * ) => import("./setup/config-internal.d.ts").InternalConfig}
 */
export const guardSetupConfig = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    global_object_variable: guardVariable(
      `${report}.global_object_variable`,
      get(object, "global_object_variable") ?? "globalThis",
    ),
    intrinsic_global_variable: guardVariable(
      `${report}.intrinsic_global_variable`,
      get(object, "intrinsic_global_variable") ?? "_ARAN_INTRINSIC_",
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/standard/aspect.d.ts").AspectKind}
 */
const guardStandardAspectKind = (report, candidate) =>
  guardEnumeration(report, candidate, standard_aspect_kind_enumeration);

/**
 * @type {(
 *   path: string,
 *   candidate: unknown,
 * ) => import("./weave/standard/aspect-internal.d.ts").InternalPointcut}
 */
const guardStandardPointcut = (report, candidate) => {
  if (typeof candidate === "boolean") {
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
 * @type {(
 *   report: string,
 *   candidate: [unknown, unknown],
 * ) => import("./weave/flexible/aspect-internal.d.ts").PointcutEntry}
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
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/flexible/aspect-internal.d.ts").Pointcut}
 */
const guardFlexiblePointcut = (report, candidate) =>
  /** @type {any} */ (
    reduceEntry(
      map(listEntry(guardObject(report, candidate)), (entry) =>
        guardFlexiblePointcutEntry(report, entry),
      ),
    )
  );

/**
 * @type {<A extends import("./lang/syntax.d.ts").Atom>(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./lang/syntax.d.ts").Program<A>}
 */
export const guardProgram = (report, candidate) => {
  const object = guardObject(report, candidate);
  return {
    type: guardSingleton(`${report}.type`, get(object, "type"), "Program"),
    kind: /** @type {any} */ (
      guardEnumeration(`${report}.kind`, get(object, "kind"), KIND)
    ),
    situ: /** @type {any} */ (
      guardEnumeration(`${report}.situ`, get(object, "situ"), SITU)
    ),
    head: /** @type {any[]} */ (
      guardUnknownArray(`${report}.head`, get(object, "head"))
    ),
    body: /** @type {any} */ (
      guardObject(`${report}.body`, get(object, "body"))
    ),
    tag: /** @type {any} */ (get(object, "tag")),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./trans/config-internal.d.ts").InternalConfig}
 */
export const guardTransConfig = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    global_declarative_record: guardEnumeration(
      `${report}.global_declarative_record`,
      get(object, "global_declarative_record") ?? "builtin",
      GLOBAL_DECLARATIVE_RECORD,
    ),
    digest: guardDigest(`${report}.digest`, get(object, "digest") ?? null),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/standard/config-internal.d.ts").InternalConfig}
 */
export const guardStandardWeaveConfig = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    initial_state: /** @type {import("./util/util.d.ts").Json} */ (
      get(object, "initial_state") ?? null
    ),
    pointcut: guardStandardPointcut(
      `${report}.pointcut`,
      get(object, "pointcut") ?? null,
    ),
    advice_global_variable: guardVariable(
      `${report}.advice_global_variable`,
      get(object, "advice_global_variable") ?? "_ARAN_ADVICE_",
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./weave/flexible/config-internal.d.ts").InternalConfig}
 */
export const guardFlexibleWeaveConfig = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    initial_state: /** @type {import("./util/util.d.ts").Json} */ (
      get(object, "initial_state") ?? null
    ),
    pointcut: guardFlexiblePointcut(
      `${report}.pointcut`,
      get(object, "pointcut") ?? null,
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./retro/config-internal.d.ts").InternalConfig}
 */
export const guardRetroConfig = (report, candidate) => {
  const object = guardObject(report, candidate ?? {});
  return {
    mode: guardEnumeration(
      `${report}.mode`,
      get(object, "mode") ?? "normal",
      ARAN_MODE,
    ),
    global_object_variable: guardVariable(
      `${report}.global_object_variable`,
      get(object, "global_object_variable") ?? "globalThis",
    ),
    intrinsic_global_variable: guardVariable(
      `${report}.intrinsic_global_variable`,
      get(object, "intrinsic_global_variable") ?? "_ARAN_INTRINSIC_",
    ),
    escape_prefix: guardVariable(
      `${report}.escape_prefix`,
      get(object, "escape_prefix") ?? "_aran_",
    ),
  };
};

/**
 * @type {(
 *   report: string,
 *   candidate: unknown,
 * ) => import("./instrument-internal.d.ts").InternalConfig}
 */
export const guardInstrumentConfig = (report, candidate) => {
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
    global_object_variable: guardVariable(
      `${report}.global_object_variable`,
      get(object, "global_variable") ?? "globalThis",
    ),
    intrinsic_global_variable: guardVariable(
      `${report}.intrinsic_global_variable`,
      get(object, "intrinsic_global_variable") ?? "_ARAN_INTRINSIC_",
    ),
    escape_prefix: guardVariable(
      `${report}.escape_prefix`,
      get(object, "escape_prefix") ?? "_aran_",
    ),
    pointcut: guardStandardPointcut(
      `${report}.pointcut`,
      get(object, "pointcut") ?? [],
    ),
    initial_state: /** @type {import("./util/util.d.ts").Json} */ (
      get(object, "initial_state") ?? null
    ),
    advice_global_variable: guardVariable(
      `${report}.advice_global_variable`,
      get(object, "advice_global_variable") ?? "_ARAN_ADVICE_",
    ),
    digest: guardDigest(`${report}.digest`, get(object, "digest") ?? null),
  };
};
