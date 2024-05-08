import { AranError, AranTypeError } from "./error.mjs";

const {
  JSON: { stringify },
} = globalThis;

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => string}
 */
export const hashHeader = (header) => {
  switch (header.type) {
    case "declare": {
      return `declare:${header.mode}:${header.kind}:${header.variable}`;
    }
    case "aggregate": {
      return `aggregate:${header.mode}:${stringify([
        header.source,
        header.import,
        header.export,
      ])}`;
    }
    case "export": {
      return `export:${header.mode}:${header.export}`;
    }
    case "import": {
      return `import:${header.mode}:${stringify([
        header.source,
        header.import,
      ])}`;
    }
    case "parameter": {
      return `parameter:${header.mode}:${header.parameter}:${header.payload}`;
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   mode: "strict",
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 * ) => import("./header").ModuleHeader}
 */
export const makeImportHeader = (mode, source, import_) => ({
  type: "import",
  mode,
  source,
  import: import_,
});

/**
 * @type {(
 *   mode: "strict",
 *   export_: estree.Specifier,
 * ) => import("./header").ModuleHeader}
 */
export const makeExportHeader = (mode, export_) => ({
  type: "export",
  mode,
  export: export_,
});

/**
 * @type {(
 *   mode: "strict",
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 * ) => import("./header").ModuleHeader}
 */
export const makeAggregateHeader = (mode, source, import_, export_) => {
  if (export_ === null) {
    if (import_ === null) {
      return {
        type: "aggregate",
        mode,
        source,
        import: import_,
        export: export_,
      };
    } else {
      throw new AranError("cannot export * if import is not *", {
        mode,
        source,
        import_,
        export_,
      });
    }
  } else {
    return {
      type: "aggregate",
      mode,
      source,
      import: import_,
      export: export_,
    };
  }
};

///////////////
// Predicate //
///////////////

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ParameterHeader}
 */
export const isParameterHeader = (header) => header.type === "parameter";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ModuleHeader}
 */
export const isModuleHeader = (header) =>
  header.type === "import" ||
  header.type === "export" ||
  header.type === "aggregate";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DeclareHeader}
 */
export const isDeclareHeader = (header) => header.type === "declare";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").PrivateParameterHeader}
 */
export const isPrivateParameterHeader = (header) =>
  isParameterHeader(header) &&
  (header.parameter === "private.get" ||
    header.parameter === "private.set" ||
    header.parameter === "private.has");

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ScopeParameterHeader}
 */
export const isScopeParameterHeader = (header) =>
  isParameterHeader(header) &&
  (header.parameter === "scope.read" ||
    header.parameter === "scope.write" ||
    header.parameter === "scope.typeof" ||
    header.parameter === "scope.discard");

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ThisParameterHeader}
 */
export const isThisParameterHeader = (header) =>
  header.type === "parameter" && header.parameter === "this";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").NewTargetParameterHeader}
 */
export const isNewTargetParameterHeader = (header) =>
  header.type === "parameter" && header.parameter === "new.target";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ImportMetaParameterHeader}
 */
export const isImportMetaParameterHeader = (header) =>
  header.type === "parameter" && header.parameter === "import.meta";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ImportMetaParameterHeader}
 */
export const isImportDynamicParameterHeader = (header) =>
  header.type === "parameter" && header.parameter === "import.dynamic";

/**
 * @type {(
 *   header: import("./header").ScopeParameterHeader,
 * ) => header is import("./header").ScopeParameterHeader & { mode: "strict" }}
 */
export const isStrictScopeHeader = (header) => header.mode === "strict";

/**
 * @type {(
 *   header: import("./header").ScopeParameterHeader,
 * ) => header is import("./header").ScopeParameterHeader & { mode: "sloppy" }}
 */
export const isSloppyScopeHeader = (header) => header.mode === "sloppy";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").ModuleHeader
 *   | import("./header").ScopeParameterHeader
 *   | import("./header").ThisParameterHeader
 *   | import("./header").ImportMetaParameterHeader
 *   | import("./header").ImportDynamicParameterHeader
 * )}
 */
export const isModuleProgramHeader = (header) =>
  isModuleHeader(header) ||
  isScopeParameterHeader(header) ||
  isThisParameterHeader(header) ||
  isImportDynamicParameterHeader(header) ||
  isImportMetaParameterHeader(header);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").DeclareHeader
 *   | import("./header").ScopeParameterHeader
 *   | import("./header").ThisParameterHeader
 *   | import("./header").ImportDynamicParameterHeader
 * )}
 */
export const isScriptProgramHeader = (header) =>
  isDeclareHeader(header) ||
  isScopeParameterHeader(header) ||
  isPrivateParameterHeader(header) ||
  isThisParameterHeader(header) ||
  isImportDynamicParameterHeader(header);

export const isGlobalEvalProgramHeader = isScriptProgramHeader;

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").DeclareHeader
 *   | import("./header").ParameterHeader
 * )}
 */
export const isRootLocalEvalProgramHeader = (header) =>
  isScopeParameterHeader(header) || isPrivateParameterHeader(header);

export const isDeepLocalEvalProgramHeader = isParameterHeader;

/**
 * @type {<P extends import("./header").ParameterHeader["parameter"]>(
 *   parameter: P,
 * ) => (
 *   header: import("./header").Header,
 * ) => header is import("./header").ParameterHeader & { parameter: P }}
 */
export const compileMatchParameterHeader = (parameter) =>
  /** @type {(header: import("./header").Header) => header is any} */ (
    (header) => header.type === "parameter" && header.parameter === parameter
  );

/**
 * @type {(
 *  header: import("./header").Header,
 * ) => header is import("./header").Header & { mode: "sloppy" }}
 */
export const isSloppyHeader = (header) => header.mode === "sloppy";

/**
 * @type {(
 *  header: import("./header").Header,
 * ) => header is import("./header").Header & { mode: "strict" }}
 */
export const isStrictHeader = (header) => header.mode === "strict";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").SuperParameterHeader}
 */
export const isSuperParameterHeader = (header) =>
  header.type === "parameter" &&
  (header.parameter === "super.get" ||
    header.parameter === "super.set" ||
    header.parameter === "super.call");
