/* eslint-disable no-use-before-define */

import { flatMap, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   hoist: import("./hoist").RegularHoist,
 * ) => hoist is import("./hoist").DeadzoneHoist}
 */
export const isDeadzoneHoist = (hoist) =>
  hoist.kind === "let" || hoist.kind === "const" || hoist.kind === "class";

/**
 * @type {(
 *   hoist: import("./hoist").RegularHoist,
 * ) => hoist is import("./hoist").LifespanHoist}
 */
export const isLifespanHoist = (hoist) =>
  hoist.kind === "var" || hoist.kind === "function";

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").LifespanHoist}
 */
const makeVarHoist = (variable) => ({
  type: "regular",
  kind: "var",
  variable,
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").DeadzoneHoist}
 */
const makeLetHoist = (variable) => ({
  type: "regular",
  kind: "let",
  variable,
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").LifespanHoist}
 */
const makeFunctionHoist = (variable) => ({
  type: "regular",
  kind: "function",
  variable,
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").DeadzoneHoist}
 */
const makeClassHoist = (variable) => ({
  type: "regular",
  kind: "class",
  variable,
});

/**
 * @type {(
 * variable: estree.Variable,
 * ) => import("./hoist").DeadzoneHoist}
 */
const makeConstHoist = (variable) => ({
  type: "regular",
  kind: "const",
  variable,
});

/**
 * @type {(
 *   node:estree.AssignmentProperty | estree.RestElement,
 * ) => estree.Variable[]}
 */
const listPropertyVariable = (node) => {
  if (node.type === "Property") {
    return listPatternVariable(node.value);
  } else if (node.type === "RestElement") {
    return listPatternVariable(node);
  } /* c8 ignore start */ else {
    throw new AranTypeError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Pattern | null) => estree.Variable[]} */
const listElementVariable = (node) => {
  if (node === null) {
    return [];
  } else {
    return listPatternVariable(node);
  }
};

/** @type {(node: estree.Pattern) => estree.Variable[]} */
export const listPatternVariable = (node) => {
  if (node.type === "Identifier") {
    return [/** @type {estree.Variable} */ (node.name)];
  } else if (node.type === "ObjectPattern") {
    return flatMap(node.properties, listPropertyVariable);
  } else if (node.type === "ArrayPattern") {
    return flatMap(node.elements, listElementVariable);
  } else if (node.type === "AssignmentPattern") {
    return listPatternVariable(node.left);
  } else if (node.type === "MemberExpression") {
    return [];
  } else if (node.type === "RestElement") {
    return listPatternVariable(node.argument);
  } /* c8 ignore start */ else {
    throw new AranTypeError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.VariableDeclarator) => estree.Variable[]} */
export const listDeclaratorVariable = (node) => listPatternVariable(node.id);

/**
 * @type {(
 *   node: (
 *     | estree.VariableDeclaration
 *     | estree.FunctionDeclaration
 *     | estree.ClassDeclaration
 *   ),
 * ) => estree.Variable[]}
 */
export const listDeclarationVariable = (node) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return flatMap(node.declarations, listDeclaratorVariable);
    }
    case "FunctionDeclaration": {
      return node.id === null
        ? []
        : [/** @type {estree.Variable} */ (node.id.name)];
    }
    case "ClassDeclaration": {
      return node.id === null
        ? []
        : [/** @type {estree.Variable} */ (node.id.name)];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   node: estree.Node,
 * ) => import("./hoist").LifespanHoist[]}
 */
export const hoistClosure = (mode, node) => {
  if (node.type === "BlockStatement") {
    return flatMap(node.body, (node) => hoistClosure(mode, node));
  } else if (node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return [];
    } else {
      switch (mode) {
        case "strict": {
          return [];
        }
        case "sloppy": {
          return [
            makeFunctionHoist(/** @type {estree.Variable} */ (node.id.name)),
          ];
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
  } else if (node.type === "VariableDeclaration") {
    if (node.kind === "var") {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        makeVarHoist,
      );
    } else {
      return [];
    }
  } else if (node.type === "IfStatement") {
    return [
      ...hoistClosure(mode, node.consequent),
      ...(node.alternate == null ? [] : hoistClosure(mode, node.alternate)),
    ];
  } else if (node.type === "TryStatement") {
    return [
      ...hoistClosure(mode, node.block),
      ...(node.handler == null ? [] : hoistClosure(mode, node.handler)),
      ...(node.finalizer == null ? [] : hoistClosure(mode, node.finalizer)),
    ];
  } else if (node.type === "CatchClause") {
    return hoistClosure(mode, node.body);
  } else if (node.type === "ForStatement") {
    return [
      ...(node.init == null ? [] : hoistClosure(mode, node.init)),
      ...hoistClosure(mode, node.body),
    ];
  } else if (node.type === "ForInStatement" || node.type === "ForOfStatement") {
    return [...hoistClosure(mode, node.left), ...hoistClosure(mode, node.body)];
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "LabeledStatement" ||
    node.type === "WithStatement"
  ) {
    return hoistClosure(mode, node.body);
  } else if (node.type === "SwitchStatement") {
    return flatMap(node.cases, (node) => hoistClosure(mode, node));
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, (node) => hoistClosure(mode, node));
  } else if (
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration"
  ) {
    return node.declaration == null ? [] : hoistClosure(mode, node.declaration);
  } else {
    return [];
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   node: estree.Node,
 * ) => import("./hoist").RegularHoist[]}
 */
export const hoistBlock = (mode, node) => {
  if (node.type === "VariableDeclaration") {
    if (node.kind === "let") {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        makeLetHoist,
      );
    } else if (node.kind === "const") {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        makeConstHoist,
      );
    } else {
      return [];
    }
  } else if (node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return [];
    } else {
      switch (mode) {
        case "strict": {
          return [
            makeFunctionHoist(/** @type {estree.Variable} */ (node.id.name)),
          ];
        }
        case "sloppy": {
          return [];
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
  } else if (node.type === "ClassDeclaration") {
    return node.id == null
      ? []
      : [makeClassHoist(/** @type {estree.Variable} */ (node.id.name))];
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, (node) => hoistBlock(mode, node));
  } else if (node.type === "LabeledStatement") {
    return hoistBlock(mode, node.body);
  } else if (node.type === "ExportNamedDeclaration") {
    return node.declaration == null ? [] : hoistBlock(mode, node.declaration);
  } else if (node.type === "ExportDefaultDeclaration") {
    if (
      (node.declaration.type === "ClassDeclaration" ||
        node.declaration.type === "FunctionDeclaration") &&
      node.declaration.id != null
    ) {
      return [
        makeLetHoist(/** @type {estree.Variable} */ (node.declaration.id.name)),
      ];
    } else {
      return [];
    }
  } else {
    return [];
  }
};

////////////
// Export //
////////////

/**
 * @type {(
 *   node: estree.ExportSpecifier,
 * ) => import("./hoist").ExportHoist}
 */
const makeSpecifierExportHoist = (node) => ({
  type: "export",
  variable: /** @type {estree.Variable} */ (node.local.name),
  specifier: /** @type {estree.Specifier} */ (node.exported.name),
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").ExportHoist}
 */
const makeSelfExportHoist = (variable) => ({
  type: "export",
  variable,
  specifier: /** @type {estree.Specifier} */ (/** @type {string} */ (variable)),
});

const DEFAULT_SPECIFIER = /** @type {estree.Specifier} */ ("default");

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").ExportHoist}
 */
const makeDefaultExportHoist = (variable) => ({
  type: "export",
  variable,
  specifier: DEFAULT_SPECIFIER,
});

/**
 * @type {(
 *   node: import("estree").Declaration,
 * ) => import("./hoist").ExportHoist[]}
 */
const makeDeclarationExportHoist = (node) => {
  if (node.type === "VariableDeclaration") {
    return map(
      flatMap(node.declarations, listDeclaratorVariable),
      makeSelfExportHoist,
    );
  } else if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    if (node.id == null) {
      return [];
    } else {
      return [
        makeSelfExportHoist(/** @type {estree.Variable} */ (node.id.name)),
      ];
    }
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: estree.Node,
 * ) => import("./hoist").ExportHoist[]}
 */
export const hoistExport = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    return [
      ...(node.declaration != null
        ? makeDeclarationExportHoist(node.declaration)
        : []),
      ...map(node.specifiers, makeSpecifierExportHoist),
    ];
  } else if (node.type === "ExportDefaultDeclaration") {
    if (
      (node.declaration.type === "ClassDeclaration" ||
        node.declaration.type === "FunctionDeclaration") &&
      node.declaration.id != null
    ) {
      return [
        makeDefaultExportHoist(
          /** @type {estree.Variable} */ (node.declaration.id.name),
        ),
      ];
    } else {
      return [];
    }
  } else {
    return [];
  }
};

////////////
// Import //
////////////

/**
 * @type {(
 *   node: (
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportSpecifier
 *     | estree.ImportNamespaceSpecifier
 *   ),
 *   source: estree.Source,
 * ) => import("./hoist").ImportHoist}
 */
const makeImportHoist = (node, source) => {
  if (node.type === "ImportDefaultSpecifier") {
    return {
      type: "import",
      variable: /** @type {estree.Variable} */ (node.local.name),
      source,
      specifier: /** @type {estree.Specifier} */ ("default"),
    };
  } else if (node.type === "ImportSpecifier") {
    return {
      type: "import",
      variable: /** @type {estree.Variable} */ (node.local.name),
      source,
      specifier: /** @type {estree.Specifier} */ (node.imported.name),
    };
  } else if (node.type === "ImportNamespaceSpecifier") {
    return {
      type: "import",
      variable: /** @type {estree.Variable} */ (node.local.name),
      source,
      specifier: null,
    };
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: estree.Node,
 * ) => import("./hoist").ImportHoist[]}
 */
export const hoistImport = (node) => {
  if (node.type === "ImportDeclaration") {
    const source = /** @type {estree.Source} */ (String(node.source.value));
    return map(node.specifiers, (declaration) =>
      makeImportHoist(declaration, source),
    );
  } else {
    return [];
  }
};
