
const makers = {
  __proto__: null,
  var: makeVarDeclaration,
  const: makeConstDeclaration,
  let: makeLetDeclaration,
};

const exportSelfDeclaration = (declaration) => exportDeclaration(
  declaration,
  getDeclarationVariable(declaration),
);

const visitExportSpecifier = (node) => exportDeclaration(
  makeVoidDeclaration(node.local.name),
  node.exporteds.name,
);

const visitImportSpecifier = (node) => {
  const visitor = import_specifier_visitors[node.type];
  return visitor(node);
};

const import_specifier_visitors = {
  __proto__: null,
  ImportSpecifier: (source, node) => makeImportDeclaration(node.local.name, source, node.imported.name),
  ImportDefaultSpecifier: (source, node) => makeImportDeclaration(node.local.name, source, "default"),
  ImportNamespaceSpecifier: (source, node) => makeImportDeclaration(node.local.name, source, null),
};

const visitors = {
  __proto__: null,
  ExportDefaultDeclaration: (node) => {
    if (node.declaration.type === "FunctionDeclaration" && node.id !== null) {
      return exportDeclaration(makeFunctionDeclaration(node.id.name), "default");
    } else if (node.declaration.type === "ClassDeclaration" && node.id !== null) {
      return exportDeclaration(makeClassDeclaration(node.id.name), "default");
    } else {
      return [];
    }
  },
  ExportNamedDeclaration: (node) => {
    if (node.source !== null) {
      return [];
    } else if (declaration !== null) {
      return map(
        map(
          flatMap(node.declaration.declarations, collectDeclarator),
          makers[node.declaration.kind],
        ),
        exportSelf,
      );
    } else {
      return map(node.specifiers, visitExportSpecifier);
    }
  },
  ExportAllDeclaration: (_node) => [],
  ImportDeclaration: (node) => flat(mapContext(node.specifiers, visitImportSpecifier, node.source.value)),
};

export const hoistModule = (node) => {
  if (node.type in visitors) {
    const visitor = visitors[node.type];
    return visitor(node);
  } else {
    return [];
  }
};
