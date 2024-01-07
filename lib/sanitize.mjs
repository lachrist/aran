import { hasOwn, includes } from "./util/index.mjs";
import { AranTypeError, AranInputError } from "./error.mjs";

const {
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
  JSON: { stringify: stringifyJson },
} = globalThis;

/////////////////////
// Atomic Sanitize //
/////////////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(
 *   path: string,
 *   condidate: unknown,
 * ) => import("../type/options").Base}
 */
export const sanitizeBase = (path, candidate) => {
  if (typeof candidate !== "string") {
    throw new AranInputError(path, "a string", candidate);
  }
  return /** @type {import("../type/options").Base} */ (candidate);
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
 * @type {(path: string, candidate: unknown) => estree.Variable | null}
 */
export const sanitizeNullableVariable = (path, candidate) => {
  if (candidate === null) {
    return null;
  } else {
    return sanitizeVariable(path, candidate);
  }
};

/**
 * @type {<X extends Json>(
 *   path: string,
 *   candidate: unknown,
 *   enumeration: X[],
 * ) => X}
 */
export const sanitizeEnumeration = (path, candidate, enumeration) => {
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
export const sanitizeSingleton = (path, candidate, singleton) => {
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
 * ) => import("../type/advice.js").Pointcut<L>}
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
 * ) => import("../type/options").Locate<L>}
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
 * ) => import("./unbuild/meta").PackMeta}
 */
export const sanitizePackMeta = (path, meta) => {
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
 * ) => import("./unbuild/context").Context}
 */
export const sanitizeContext = (path, candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new AranInputError(path, "an object", candidate);
  }
  if (!hasOwn(candidate, "path")) {
    throw new AranInputError(path, "an object with a path property", candidate);
  }
  if (!hasOwn(candidate, "meta")) {
    throw new AranInputError(path, "an object with a meta property", candidate);
  }
  if (!hasOwn(candidate, "scope")) {
    throw new AranInputError(
      path,
      "an object with a scope property",
      candidate,
    );
  }
  return {
    path: /** @type {any} */ (candidate).path,
    meta: sanitizePackMeta(`${path}.meta`, /** @type {any} */ (candidate).meta),
    scope: /** @type {any} */ (candidate).scope,
  };
};

//////////////////////////
// sanitizeSetupOptions //
//////////////////////////

/**
 * @type {(path: string, options: unknown) => {
 *   global: estree.Variable,
 *   intrinsic: estree.Variable,
 *   escape: estree.Variable,
 *   exec: estree.Variable | null,
 * }}
 */
export const sanitizeSetupOptions = (path, options) => {
  const { global, intrinsic, escape, exec } =
    /** @type {{[k in "global" | "intrinsic" | "escape" | "exec"]: unknown}} */ ({
      global: "globalThis",
      intrinsic: "_ARAN_INTRINSIC_",
      escape: "_ARAN_",
      exec: null,
      .../** @type {object} */ (options),
    });
  return {
    global: sanitizeVariable(`${path}.global`, global),
    intrinsic: sanitizeVariable(`${path}.intrinsic`, intrinsic),
    escape: sanitizeVariable(`${path}.escape`, escape),
    exec: sanitizeNullableVariable(`${path}.exec`, exec),
  };
};

///////////////////////////////
// sanitizeInstrumentOptions //
///////////////////////////////

/**
 * @type {<L>(
 *   path: string,
 *   options: object,
 * ) => import("../type/options").Common<L>}
 */
const sanitizeInstrumentCommon = (path, options) => {
  const { pointcut, advice, intrinsic, escape, locate, base } = {
    base: "main",
    pointcut: false,
    advice: "_ARAN_ADVICE_",
    intrinsic: "_ARAN_INTRINSIC_",
    escape: "_ARAN_",
    locate: (/** @type {string} */ path, /** @type {string} */ root) =>
      `${root}.${path}`,
    .../** @type {object} */ (options),
  };
  return {
    base: sanitizeBase(`${path}.base`, base),
    pointcut: sanitizePointcut(`${path}.pointcut`, pointcut),
    advice: sanitizeVariable(`${path}.advice`, advice),
    intrinsic: sanitizeVariable(`${path}.intrinsic`, intrinsic),
    escape: sanitizeVariable(`${path}.escape`, escape),
    locate: sanitizeLocate(`${path}.locate`, locate),
  };
};

/**
 * @type {(
 *   path: string,
 *   situ: object,
 *   source: "script" | "module",
 * ) => import("./situ").RootSitu}
 */
const sanitizeRootSitu = (path, situ, source) => {
  const kind = sanitizeEnumeration(
    `${path}.kind`,
    hasOwn(situ, "kind") && "kind" in situ && situ.kind != null
      ? situ.kind
      : source,
    ["script", "module", "eval"],
  );
  if ((source === "module") !== (kind === "module")) {
    throw new AranInputError(
      `${path}.kind`,
      "compatible with program.sourceType",
      kind,
    );
  }
  if (kind === "script") {
    const { scope, mode, ambient, closure, root } = {
      scope: "global",
      mode: "sloppy",
      ambient: "external",
      closure: "program",
      root: "script",
      ...situ,
    };
    return /** @type {import("./situ").ScriptSitu} */ ({
      kind,
      scope: sanitizeSingleton(`${path}.scope`, scope, "global"),
      mode: sanitizeSingleton(`${path}.mode`, mode, "sloppy"),
      ambient: sanitizeEnumeration(`${path}.ambient`, ambient, [
        "internal",
        "external",
      ]),
      closure: sanitizeSingleton(`${path}.closure`, closure, "program"),
      root: sanitizeSingleton(`${path}.root`, root, "script"),
    });
  } else if (kind === "module") {
    const { scope, mode, ambient, closure, root } = {
      scope: "global",
      mode: "strict",
      ambient: "external",
      closure: "program",
      root: "module",
      ...situ,
    };
    return /** @type {import("./situ").ModuleSitu} */ ({
      kind,
      scope: sanitizeSingleton(`${path}.scope`, scope, "global"),
      mode: sanitizeSingleton(`${path}.mode`, mode, "strict"),
      ambient: sanitizeEnumeration(`${path}.ambient`, ambient, [
        "internal",
        "external",
      ]),
      closure: sanitizeSingleton(`${path}.closure`, closure, "program"),
      root: sanitizeSingleton(`${path}.root`, root, "module"),
    });
  } else if (kind === "eval") {
    const scope = sanitizeEnumeration(
      `${path}.scope`,
      hasOwn(situ, "scope") && "scope" in situ && situ.scope != null
        ? situ.scope
        : "global",
      ["global", "local"],
    );
    if (scope === "global") {
      const { mode, ambient, closure, root } = {
        mode: "sloppy",
        ambient: "external",
        closure: "program",
        root: "global-eval",
        ...situ,
      };
      return /** @type {import("./situ").GlobalEvalSitu} */ ({
        kind,
        scope,
        mode: sanitizeSingleton(`${path}.mode`, mode, "sloppy"),
        ambient: sanitizeEnumeration(`${path}.ambient`, ambient, [
          "internal",
          "external",
        ]),
        closure: sanitizeSingleton(`${path}.closure`, closure, "program"),
        root: sanitizeSingleton(`${path}.root`, root, "global-eval"),
      });
    } else if (scope === "local") {
      const { mode, ambient, closure, root } = {
        mode: "sloppy",
        ambient: "external",
        closure: "program",
        root: "script",
        ...situ,
      };
      return /** @type {import("./situ").ExternalLocalEvalSitu} */ ({
        kind,
        scope,
        mode: sanitizeSingleton(`${path}.mode`, mode, "sloppy"),
        ambient: sanitizeEnumeration(`${path}.ambient`, ambient, [
          "internal",
          "external",
        ]),
        closure: sanitizeEnumeration(`${path}.closure`, closure, [
          "program",
          "function",
          "method",
          "constructor",
        ]),
        root: sanitizeEnumeration(`${path}.root`, root, [
          "module",
          "script",
          "global-eval",
        ]),
      });
    } else {
      throw new AranTypeError(scope);
    }
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   path: string,
 *   situ: object,
 *   source: "script" | "module",
 * ) => import("./situ").NodeSitu}
 */
const sanitizeNodeSitu = (path, situ, source) => {
  if (source !== "script") {
    throw new AranInputError(
      `${path}.sourceType`,
      "'script' in direct eval situ",
      source,
    );
  }
  const { kind, scope, ambient, mode, closure, root } = {
    kind: "eval",
    scope: "local",
    ambient: "external",
    mode: "sloppy",
    closure: "program",
    root: "script",
    ...situ,
  };
  return /** @type {import("./situ").InternalLocalEvalSitu} */ ({
    kind,
    scope,
    ambient,
    mode: sanitizeEnumeration(`${path}.mode`, mode, ["strict", "sloppy"]),
    closure: sanitizeSingleton(`${path}.closure`, closure, "irrelevant"),
    root: sanitizeEnumeration(`${path}.root`, root, [
      "module",
      "script",
      "global-eval",
      "external-local-eval",
    ]),
  });
};

//   const scope = hasOwn(situ, "scope") && situ.scope != null ? situ.scope : "global";
//   if (situ)

//   const mode = hasOwn(situ, "mode") && situ.scope != null ? situ.mode : "sloppy";
//   sanitizeEnumeration(`${path}.mode`, mode, ["strict", "sloppy"]);
//   if (kind === "script" || kind === "module") {
//     if (mode !== "strict" && mode !== "sloppy") {
//       throw new AranInputError(`${path}.mode`, "strict or sloppy", mode);
//     }
//   }

//   if (kind === "eval") {

//   } else {
//     if (hasOwn(situ, "mode")) {
//       const {mode } = situ;
//       if (situ.mode != null && situ.mode != "sloppy") {
//         throw new AranInputError(`${path}.mode`, "sloppy", situ.mode);
//       }
//     }
//     if (hasOwn(situ, "scope")) {
//       if (situ.scope != null && situ.scope != "global") {
//         throw new AranInputError(`${path}.scope`, "global", situ.scope);
//       }
//     }

//     const {
//       mode,
//       scope,
//       ambient,
//       closure,
//       root,
//     } =  {
//       mode: "sloppy",
//       scope: "global",
//       ambient: "external",

//       kind: "eval";
//       mode: "strict" | "sloppy";
//       scope: "global";
//       ambient: "internal" | "external";
//       closure: "program";
//       root: "global-eval";

//     }
//   }

//   const { kind, mode, scope, ambient, closure, root } = /**
//    * @type {{
//    *   [k in keyof import("./situ").UniversalSitu]: unknown
//    * }}
//    */ ({
//     kind: source,
//     mode: "sloppy",
//     scope: "global",
//     ambient: "external",
//     closure: "program",
//     root: source,
//     .../** @type {object} */ (situ),
//   });

//   return {
//     base: sanitizeBase(`${path}.base`, base),
//     pointcut: sanitizePointcut(`${path}.pointcut`, pointcut),
//     advice: sanitizeVariable(`${path}.advice`, advice),
//     intrinsic: sanitizeVariable(`${path}.intrinsic`, intrinsic),
//     escape: sanitizeVariable(`${path}.escape`, escape),
//     locate: sanitizeLocate(`${path}.locate`, locate),
//     warning: sanitizeEnumeration(`${path}.warning`, warning, [
//       "silent",
//       "console",
//     ]),
//   };
// };

/**
 * @type {<L>(
 *   path: string,
 *   options: unknown,
 *   source: "script" | "module",
 * ) => import("../type/options").Argv<L>}
 */
export const sanitizeInstrumentOptions = (path, options, source) => {
  if (options == null) {
    return {
      context: null,
      situ: sanitizeRootSitu(path, {}, source),
      ...sanitizeInstrumentCommon(path, {}),
    };
  } else if (typeof options === "object") {
    const context = "context" in options ? options.context : null;
    if (context != null) {
      return {
        context: sanitizeContext(`${path}.context`, context),
        situ: sanitizeNodeSitu(path, options, source),
        ...sanitizeInstrumentCommon(path, options),
      };
    } else {
      return {
        context: null,
        situ: sanitizeRootSitu(path, options, source),
        ...sanitizeInstrumentCommon(path, options),
      };
    }
  } else {
    throw new AranInputError(
      path,
      "either null, undefined, or an object",
      options,
    );
  }
};
