import { AranExecError, AranTypeError } from "../../error.mjs";
import { EMPTY, findMapTree, map, mapTree } from "../../util/index.mjs";
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
 * ) => import("./link.d.ts").ExportLink}
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
 * ) => import("./link.d.ts").AggregateLink}
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
 * ) => import("./link.d.ts").ExportLink}
 */
const makeSelfExportLink = (variable) => ({
  type: "export",
  variable,
  export: selfSpecifier(variable),
});

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./link.d.ts").ExportLink}
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
 * ) => import("../../util/tree.d.ts").Tree<import("./link.d.ts").ExportLink>}
 */
const makeDeclarationExportLink = (node) => {
  if (node.type === "VariableDeclaration") {
    return mapTree(
      map(node.declarations, listDeclaratorVariable),
      makeSelfExportLink,
    );
  } else if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return makeSelfExportLink(node.id.name);
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
 * ) => import("./link.d.ts").ImportLink}
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
 * ) => import("../../util/tree.d.ts").Tree<import("./link.d.ts").Link>}
 */
const listLinkNode = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    if (node.source == null) {
      return [
        node.declaration != null
          ? makeDeclarationExportLink(node.declaration)
          : null,
        map(node.specifiers, makeSpecifierExportLink),
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
      return makeDefaultExportLink(
        /** @type {import("estree-sentry").VariableName} */ (
          node.declaration.id.name
        ),
      );
    } else {
      return {
        type: "export",
        variable: null,
        export: DEFAULT_SPECIFIER,
      };
    }
  } else if (node.type === "ExportAllDeclaration") {
    return {
      type: "aggregate",
      source: node.source.value,
      import: null,
      export: node.exported == null ? null : getSpecifier(node.exported),
    };
  } else if (node.type === "ImportDeclaration") {
    if (node.specifiers.length === 0) {
      return {
        type: "import",
        variable: null,
        source: node.source.value,
        import: null,
      };
    } else {
      return map(node.specifiers, (declaration) =>
        makeImportLink(declaration, node.source.value),
      );
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   variable: null | import("estree-sentry").VariableName,
 * ) => (
 *   link: import("./link.d.ts").Link,
 * ) => null | import("./link.d.ts").ImportLink}
 */
export const compileMatchImportLink = (variable) => (link) =>
  link.type === "import" && link.variable === variable ? link : null;

/**
 * @type {(
 *   link: import("./link.d.ts").Link,
 *   links: import("../../util/tree.d.ts").Tree<import("./link.d.ts").Link>,
 * ) => import("./link.d.ts").Link}
 */
const resolveAggregateLink = (link1, links) => {
  if (link1.type === "export") {
    if (link1.export === "default") {
      return link1;
    } else {
      const link2 = findMapTree(links, compileMatchImportLink(link1.variable));
      if (link2 === null) {
        return link1;
      } else {
        return {
          type: "aggregate",
          source: link2.source,
          import: link2.import,
          export: link1.export,
        };
      }
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
 * ) => import("./link.d.ts").Link[]}
 */
export const listLink = (node) => {
  switch (node.sourceType) {
    case "module": {
      const links = map(node.body, listLinkNode);
      return mapTree(links, (link) => resolveAggregateLink(link, links));
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
 *   link: import("./link.d.ts").Link,
 * ) => import("../../lang/header.d.ts").ModuleHeader}
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
 *   links: import("./link.d.ts").Link[],
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
 *   link: import("./link.d.ts").Link[],
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
