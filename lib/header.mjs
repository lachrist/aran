import { AranError, AranTypeError } from "./error.mjs";

///////////////
// Construct //
///////////////

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   operation: "scope.read" | "scope.write" | "scope.typeof" | "scope.discard",
 *   payload: estree.Variable,
 * ) => import("./header").LookupHeader}
 */
export const makeLookupEagerHeader = (mode, parameter, payload) => {
  if (parameter === "scope.discard") {
    switch (mode) {
      case "strict": {
        throw new AranError("discard header cannot be strict", {
          mode,
          parameter,
          payload,
        });
      }
      case "sloppy": {
        return {
          type: "eager",
          mode,
          parameter,
          payload,
        };
      }
      default: {
        throw new AranTypeError(mode);
      }
    }
  } else if (
    parameter === "scope.read" ||
    parameter === "scope.write" ||
    parameter === "scope.typeof"
  ) {
    return {
      type: "eager",
      mode,
      parameter,
      payload,
    };
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   mode: "strict",
 *   parameter: "private.get" | "private.set" | "private.has",
 *   payload: estree.PrivateKey,
 * ) => import("./header").PrivateHeader}
 */
export const makePrivateEagerHeader = (mode, parameter, payload) => ({
  type: "eager",
  mode,
  parameter,
  payload,
});

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
export const isPrivateEagerHeader = (header) =>
  header.type === "eager" &&
  (header.parameter === "private.get" ||
    header.parameter === "private.set" ||
    header.parameter === "private.has");

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isLookupEagerHeader = (header) =>
  header.type === "eager" &&
  (header.parameter === "scope.read" ||
    header.parameter === "scope.write" ||
    header.parameter === "scope.typeof" ||
    header.parameter === "scope.discard");

/**
 * @type {(
 *   header: import("./header").LookupHeader,
 * ) => header is import("./header").LookupHeader & { mode: "strict" }}
 */
export const isStrictLookupHeader = (header) => header.mode === "strict";

/**
 * @type {(
 *   header: import("./header").LookupHeader,
 * ) => header is import("./header").LookupHeader & { mode: "sloppy" }}
 */
export const isSloppyLookupHeader = (header) => header.mode === "sloppy";

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
 * ) => header is (
 *   | import("./header").ModuleHeader
 *   | import("./header").LookupHeader
 * )}
 */
export const isModuleLookupHeader = (header) =>
  isModuleHeader(header) || isLookupEagerHeader(header);

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
  isDeclareHeader(header) ||
  isLookupEagerHeader(header) ||
  isPrivateEagerHeader(header);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").LookupHeader
 *   | import("./header").PrivateHeader
 * )}
 */
export const isLookupPrivateHeader = (header) =>
  isLookupEagerHeader(header) || isPrivateEagerHeader(header);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is (
 *   | import("./header").DeclareHeader
 *   | import("./header").LookupHeader
 * )}
 */
export const isDeclareLookupHeader = (header) =>
  isDeclareHeader(header) || isLookupEagerHeader(header);

/**
 * @type {<P extends import("./header").EagerHeader["parameter"]>(
 *  header: import("./header").Header,
 *  parameter: P,
 * ) => header is import("./header").EagerHeader & { parameter: P }}
 */
export const matchEagerHeader = (header, parameter) =>
  header.type === "eager" && header.parameter === parameter;

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
