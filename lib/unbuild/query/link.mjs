import { AranExecError, AranTypeError } from "../../report.mjs";
import { EMPTY, flatMap, map } from "../../util/index.mjs";
import { listDeclaratorVariable } from "./pattern.mjs";

///////////////
// Specifier //
///////////////

export const DEFAULT_SPECIFIER =
  /** @type {import("estree-sentry").SpecifierName & "default"} */ ("default");

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("estree-sentry").SpecifierName}
 */
const selfSpecifier = (variable) =>
  /** @type {import("estree-sentry").SpecifierName} */ (
    /** @type {string} */ (variable)
  );

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").SpecifierIdentifier<{}>
 *     | import("estree-sentry").SpecifierLiteral<{}>
 *   ),
 * ) => (
 *   | import("estree-sentry").SpecifierName
 *   | import("estree-sentry").SpecifierValue
 * )}
 */
const getSpecifier = (node) => {
  switch (node.type) {
    case "Identifier": {
      return node.name;
    }
    case "Literal": {
      return node.value;
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

//////////
// Link //
//////////

/**
 * @type {(
 *   node: import("estree-sentry").ExportSpecifier<{}>,
 * ) => import("./link").ExportLink}
 */
const makeSpecifierExportLink = (node) => ({
  type: "export",
  variable: node.local.name,
  export: getSpecifier(node.exported),
});

/**
 * @type {(
 *   node: import("estree-sentry").AggregateExportSpecifier<{}>,
 *   source: import("estree-sentry").SourceValue,
 * ) => import("./link").AggregateLink}
 */
const makeAggregateLink = (node, source) => ({
  type: "aggregate",
  source,
  import: getSpecifier(node.local),
  export: getSpecifier(node.exported),
});

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./link").ExportLink}
 */
const makeSelfExportLink = (variable) => ({
  type: "export",
  variable,
  export: selfSpecifier(variable),
});

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./link").ExportLink}
 */
const makeDefaultExportLink = (variable) => ({
  type: "export",
  variable,
  export: DEFAULT_SPECIFIER,
});

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").VariableDeclaration<{}>
 *     | import("estree-sentry").ClassDeclaration<{}>
 *     | import("estree-sentry").FunctionDeclaration<{}>
 *   ),
 * ) => import("./link").ExportLink[]}
 */
const makeDeclarationExportLink = (node) => {
  if (node.type === "VariableDeclaration") {
    return map(
      flatMap(node.declarations, listDeclaratorVariable),
      makeSelfExportLink,
    );
  } else if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return [makeSelfExportLink(node.id.name)];
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ImportDefaultSpecifier<{}>
 *     | import("estree-sentry").ImportSpecifier<{}>
 *     | import("estree-sentry").ImportNamespaceSpecifier<{}>
 *   ),
 *   source: import("estree-sentry").SourceValue,
 * ) => import("./link").ImportLink}
 */
const makeImportLink = (node, source) => {
  if (node.type === "ImportDefaultSpecifier") {
    return {
      type: "import",
      variable: /** @type {import("estree-sentry").VariableName} */ (
        node.local.name
      ),
      source,
      import: DEFAULT_SPECIFIER,
    };
  } else if (node.type === "ImportSpecifier") {
    return {
      type: "import",
      variable: /** @type {import("estree-sentry").VariableName} */ (
        node.local.name
      ),
      source,
      import: getSpecifier(node.imported),
    };
  } else if (node.type === "ImportNamespaceSpecifier") {
    return {
      type: "import",
      variable: /** @type {import("estree-sentry").VariableName} */ (
        node.local.name
      ),
      source,
      import: null,
    };
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Node<{}>,
 * ) => import("./link").Link[]}
 */
const listLinkNode = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    if (node.source == null) {
      return [
        ...(node.declaration != null
          ? makeDeclarationExportLink(node.declaration)
          : []),
        ...map(node.specifiers, makeSpecifierExportLink),
      ];
    } else {
      if (node.specifiers.length === 0) {
        return [
          {
            type: "import",
            source: node.source.value,
            variable: null,
            import: null,
          },
        ];
      } else {
        return map(node.specifiers, (specifier) =>
          makeAggregateLink(specifier, node.source.value),
        );
      }
    }
  } else if (node.type === "ExportDefaultDeclaration") {
    if (
      (node.declaration.type === "ClassDeclaration" ||
        node.declaration.type === "FunctionDeclaration") &&
      node.declaration.id != null
    ) {
      return [
        makeDefaultExportLink(
          /** @type {import("estree-sentry").VariableName} */ (
            node.declaration.id.name
          ),
        ),
      ];
    } else {
      return [
        {
          type: "export",
          variable: null,
          export: DEFAULT_SPECIFIER,
        },
      ];
    }
  } else if (node.type === "ExportAllDeclaration") {
    return [
      {
        type: "aggregate",
        source: node.source.value,
        import: null,
        export: node.exported == null ? null : getSpecifier(node.exported),
      },
    ];
  } else if (node.type === "ImportDeclaration") {
    if (node.specifiers.length === 0) {
      return [
        {
          type: "import",
          variable: null,
          source: node.source.value,
          import: null,
        },
      ];
    } else {
      return map(node.specifiers, (declaration) =>
        makeImportLink(declaration, node.source.value),
      );
    }
  } else {
    return [];
  }
};

/**
 * @type {(
 *   index: import("./link").Link,
 *   links: import("./link").Link[],
 * ) => import("./link").Link}
 */
const resolveAggregateLink = (link1, links) => {
  if (link1.type === "export") {
    if (link1.export === "default") {
      return link1;
    } else {
      for (const link2 of links) {
        if (link2.type === "import" && link1.variable === link2.variable) {
          return {
            type: "aggregate",
            source: link2.source,
            import: link2.import,
            export: link1.export,
          };
        }
      }
      return link1;
    }
  } else if (link1.type === "import" || link1.type === "aggregate") {
    return link1;
  } else {
    throw new AranTypeError(link1);
  }
};

/**
 * @type {(
 *   root: import("estree-sentry").Program<{}>,
 * ) => import("./link").Link[]}
 */
export const listLink = (node) => {
  switch (node.sourceType) {
    case "module": {
      const links = flatMap(node.body, listLinkNode);
      return map(links, (link) => resolveAggregateLink(link, links));
    }
    case "script": {
      return EMPTY;
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   link: import("./link").Link,
 * ) => import("../../lang/header").ModuleHeader}
 */
export const toModuleHeader = (link) => {
  switch (link.type) {
    case "import": {
      return {
        type: "import",
        source: link.source,
        import: link.import,
      };
    }
    case "export": {
      return {
        type: "export",
        export: link.export,
      };
    }
    case "aggregate": {
      return link;
    }
    default: {
      throw new AranTypeError(link);
    }
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   links: import("./link").Link[],
 *   variable: import("estree-sentry").VariableName,
 * ) => (
 *   | import("estree-sentry").SpecifierName
 *   | import("estree-sentry").SpecifierValue
 * )[]}
 */
export const listVariableExport = (links, variable) => {
  /**
   * @type {(
   *   | import("estree-sentry").SpecifierName
   *   | import("estree-sentry").SpecifierValue
   * )[]}
   */
  const specifiers = [];
  const { length } = links;
  for (let index = 0; index < length; index += 1) {
    const link = links[index];
    if (link.type === "export" && link.variable === variable) {
      specifiers[specifiers.length] = link.export;
    }
  }
  return specifiers;
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   link: import("./link").Link[],
 *   variable: import("estree-sentry").VariableName,
 * ) => null | {
 *   source: import("estree-sentry").SourceValue,
 *   specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 * }}
 */
export const findVariableImport = (links, variable) => {
  /**
   * @type {null | {
   *   source: import("estree-sentry").SourceValue,
   *   specifier: (
   *     | null
   *     | import("estree-sentry").SpecifierName
   *     | import("estree-sentry").SpecifierValue
   *   ),
   * }}
   */
  let match = null;
  const { length } = links;
  for (let index = 0; index < length; index += 1) {
    const link = links[index];
    if (link.type === "import" && link.variable === variable) {
      if (match === null) {
        match = { source: link.source, specifier: link.import };
      } else {
        throw new AranExecError("duplicate import variable", {
          links,
          variable,
        });
      }
    }
  }
  return match;
};
/* eslint-enable local/no-impure */
