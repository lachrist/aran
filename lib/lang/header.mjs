import { AranExecError, AranTypeError } from "../error.mjs";

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
 *   source: import("estree-sentry").SourceValue,
 *   specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierValue
 *     | import("estree-sentry").SpecifierName
 *   ),
 * ) => import("./header").ModuleHeader}
 */
export const makeImportHeader = (source, specifier) => ({
  type: "import",
  source,
  import: specifier,
});

/**
 * @type {(
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 * ) => import("./header").ModuleHeader}
 */
export const makeExportHeader = (specifier) => ({
  type: "export",
  export: specifier,
});

/**
 * @type {(
 *   source: import("estree-sentry").SourceValue,
 *   import_specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   export_specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 * ) => import("./header").ModuleHeader}
 */
export const makeAggregateHeader = (
  source,
  import_specifier,
  export_specifier,
) => {
  if (export_specifier === null) {
    if (import_specifier === null) {
      return {
        type: "aggregate",
        source,
        import: import_specifier,
        export: export_specifier,
      };
    } else {
      throw new AranExecError("cannot export * if import is not *", {
        source,
        import_specifier,
        export_specifier,
      });
    }
  } else {
    return {
      type: "aggregate",
      source,
      import: import_specifier,
      export: export_specifier,
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
