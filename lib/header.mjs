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
      return `declare:${header.kind}:${header.variable}`;
    }
    case "aggregate": {
      return `aggregate:${stringify([
        header.source,
        header.import,
        header.export,
      ])}`;
    }
    case "export": {
      return `export:${header.export}`;
    }
    case "import": {
      return `import:${stringify([header.source, header.import])}`;
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   source: import("./estree").Source,
 *   import_: import("./estree").Specifier | null,
 * ) => import("./header").ModuleHeader}
 */
export const makeImportHeader = (source, import_) => ({
  type: "import",
  source,
  import: import_,
});

/**
 * @type {(
 *   export_: import("./estree").Specifier,
 * ) => import("./header").ModuleHeader}
 */
export const makeExportHeader = (export_) => ({
  type: "export",
  export: export_,
});

/**
 * @type {(
 *   source: import("./estree").Source,
 *   import_: import("./estree").Specifier | null,
 *   export_: import("./estree").Specifier | null,
 * ) => import("./header").ModuleHeader}
 */
export const makeAggregateHeader = (source, import_, export_) => {
  if (export_ === null) {
    if (import_ === null) {
      return {
        type: "aggregate",
        source,
        import: import_,
        export: export_,
      };
    } else {
      throw new AranError("cannot export * if import is not *", {
        source,
        import_,
        export_,
      });
    }
  } else {
    return {
      type: "aggregate",
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
