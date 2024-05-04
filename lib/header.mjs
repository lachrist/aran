import { AranError, AranTypeError } from "./error.mjs";

///////////////
// Construct //
///////////////

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variable: estree.Variable,
 * ) => import("./header").LookupHeader}
 */
export const makeLookupHeader = (mode, operation, variable) => {
  if (operation === "discard") {
    switch (mode) {
      case "strict": {
        throw new AranError("discard header cannot be strict", {
          mode,
          operation,
          variable,
        });
      }
      case "sloppy": {
        return {
          type: "lookup",
          mode,
          operation,
          variable,
        };
      }
      default: {
        throw new AranTypeError(mode);
      }
    }
  } else if (
    operation === "read" ||
    operation === "write" ||
    operation === "typeof"
  ) {
    return {
      type: "lookup",
      mode,
      operation,
      variable,
    };
  } else {
    throw new AranTypeError(operation);
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
 * ) => header is import("./header").PrivateHeader}
 */
export const isPrivateHeader = (header) => header.type === "private";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isScopepHeader = (header) => header.type === "lookup";

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
 * ) => header is (
 *   | import("./header").ModuleHeader
 *   | import("./header").LookupHeader
 * )}
 */
export const isModuleLookupHeader = (header) =>
  header.type === "import" ||
  header.type === "export" ||
  header.type === "aggregate" ||
  header.type === "lookup";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").DeclareHeader
 *   | import("./header").LookupHeader
 *   | import("./header").PrivateHeader
 * )}
 */
export const isDeclareLookupPrivateHeader = (header) =>
  header.type === "declare" ||
  header.type === "lookup" ||
  header.type === "private";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").LookupHeader
 *   | import("./header").PrivateHeader
 * )}
 */
export const isLookupPrivateHeader = (header) =>
  header.type === "lookup" || header.type === "private";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").DeclareHeader
 *   | import("./header").LookupHeader
 * )}
 */
export const isDeclareLookupHeader = (header) =>
  header.type === "declare" || header.type === "lookup";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DeclareHeader}
 */
export const isDeclareHeader = (header) => header.type === "declare";
