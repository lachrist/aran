/* eslint-disable no-use-before-define */

import { flatMap, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  DEFAULT_SPECIFIER,
  getSpecifier,
  selfSpecifier,
} from "./specifier.mjs";
import { getSource } from "./source.mjs";

/**
 * @type {(
 *   hoist: import("./hoist").Hoist,
 * ) => hoist is import("./hoist").DeclareHoist}
 */
export const isDeclareHoist = (hoist) => hoist.type === "declare";

/**
 * @type {(
 *   hoist: import("./hoist").Hoist,
 * ) => hoist is import("./hoist").ImportHoist}
 */
export const isImportHoist = (hoist) => hoist.type === "import";

/**
 * @type {(
 *   hoist: import("./hoist").Hoist,
 * ) => hoist is import("./hoist").ModuleHoist}
 */
export const isModuleHoist = (hoist) =>
  hoist.type === "import" ||
  hoist.type === "export" ||
  hoist.type === "aggregate";

/**
 * @type {(
 *   hoist: import("./hoist").Hoist,
 * ) => hoist is import("./hoist").ExportHoist}
 */
export const isExportHoist = (hoist) => hoist.type === "export";

/**
 * @type {(
 *   hoist: import("./hoist").Hoist,
 * ) => hoist is import("./hoist").AggregateHoist}
 */
export const isAggregateHoist = (hoist) => hoist.type === "aggregate";

/**
 * @type {(
 *   hoist: import("./hoist").DeclareHoist,
 * ) => boolean}
 */
export const isHoistWritable = (hoist) =>
  hoist.kind === "var" || hoist.kind === "let";

/**
 * @type {(
 *   hoist: import("./hoist").DeclareHoist,
 * ) => boolean}
 */
export const isHoistDuplicable = (hoist) => hoist.kind === "var";

/**
 * @type {(
 *   hoist: import("./hoist").DeclareHoist,
 * ) => boolean}
 */
export const hasHoistDeadzone = (hoist) =>
  hoist.kind === "let" || hoist.kind === "const";

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").DeclareHoist}
 */
export const makeVarHoist = (variable) => ({
  type: "declare",
  kind: "var",
  variable,
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").DeclareHoist}
 */
export const makeLetHoist = (variable) => ({
  type: "declare",
  kind: "let",
  variable,
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").DeclareHoist}
 */
const makeFunctionHoist = (variable) => ({
  type: "declare",
  kind: "var",
  variable,
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").DeclareHoist}
 */
const makeClassHoist = (variable) => ({
  type: "declare",
  kind: "let",
  variable,
});

/**
 * @type {(
 * variable: estree.Variable,
 * ) => import("./hoist").DeclareHoist}
 */
export const makeConstHoist = (variable) => ({
  type: "declare",
  kind: "const",
  variable,
});

/**
 * @type {(
 * variable: estree.Variable,
 * ) => import("./hoist").DeclareHoist}
 */
export const makeValHoist = (variable) => ({
  type: "declare",
  kind: "val",
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
 * ) => import("./hoist").DeclareHoist[]}
 */
export const hoistClosure = (mode, node) => {
  if (node.type === "BlockStatement") {
    return flatMap(node.body, (node) => hoistClosure(mode, node));
  } else if (node.type === "FunctionDeclaration") {
    if (node.id != null) {
      if (!node.async && !node.generator && mode === "sloppy") {
        return [
          makeFunctionHoist(/** @type {estree.Variable} */ (node.id.name)),
        ];
      } else {
        return [];
      }
    } else {
      return [];
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
 * ) => import("./hoist").DeclareHoist[]}
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
    if (node.id != null) {
      if (!node.async && !node.generator && mode === "sloppy") {
        return [];
      } else {
        return [
          makeFunctionHoist(/** @type {estree.Variable} */ (node.id.name)),
        ];
      }
    } else {
      return [];
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
      node.declaration.type === "ClassDeclaration" &&
      node.declaration.id != null
    ) {
      return [
        makeClassHoist(
          /** @type {estree.Variable} */ (node.declaration.id.name),
        ),
      ];
    } else if (
      node.declaration.type === "FunctionDeclaration" &&
      node.declaration.id != null
    ) {
      return [
        makeFunctionHoist(
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
// Module //
////////////

/**
 * @type {(
 *   node: estree.ExportSpecifier,
 * ) => import("./hoist").ExportHoist}
 */
const makeSpecifierExportHoist = (node) => ({
  type: "export",
  variable: /** @type {estree.Variable} */ (node.local.name),
  export: getSpecifier(node.exported),
});

/**
 * @type {(
 *   node: estree.ExportSpecifier,
 *   source: estree.Source
 * ) => import("./hoist").AggregateHoist}
 */
const makeAggregateHoist = (node, source) => ({
  type: "aggregate",
  source,
  import: getSpecifier(node.local),
  export: getSpecifier(node.exported),
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").ExportHoist}
 */
const makeSelfExportHoist = (variable) => ({
  type: "export",
  variable,
  export: selfSpecifier(variable),
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./hoist").ExportHoist}
 */
const makeDefaultExportHoist = (variable) => ({
  type: "export",
  variable,
  export: DEFAULT_SPECIFIER,
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
      import: DEFAULT_SPECIFIER,
    };
  } else if (node.type === "ImportSpecifier") {
    return {
      type: "import",
      variable: /** @type {estree.Variable} */ (node.local.name),
      source,
      import: getSpecifier(node.imported),
    };
  } else if (node.type === "ImportNamespaceSpecifier") {
    return {
      type: "import",
      variable: /** @type {estree.Variable} */ (node.local.name),
      source,
      import: null,
    };
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: estree.Node,
 * ) => import("./hoist").ModuleHoist[]}
 */
export const hoistModule = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    const source = node.source == null ? null : getSource(node.source);
    if (source == null) {
      return [
        ...(node.declaration != null
          ? makeDeclarationExportHoist(node.declaration)
          : []),
        ...map(node.specifiers, makeSpecifierExportHoist),
      ];
    } else {
      if (node.specifiers.length === 0) {
        return [
          {
            type: "import",
            source,
            variable: null,
            import: null,
          },
        ];
      } else {
        return map(node.specifiers, (specifier) =>
          makeAggregateHoist(specifier, source),
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
        makeDefaultExportHoist(
          /** @type {estree.Variable} */ (node.declaration.id.name),
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
        source: getSource(node.source),
        import: null,
        export: node.exported == null ? null : getSpecifier(node.exported),
      },
    ];
  } else if (node.type === "ImportDeclaration") {
    const source = getSource(node.source);
    if (node.specifiers.length === 0) {
      return [
        {
          type: "import",
          variable: null,
          source,
          import: null,
        },
      ];
    } else {
      return map(node.specifiers, (declaration) =>
        makeImportHoist(declaration, source),
      );
    }
  } else {
    return [];
  }
};
