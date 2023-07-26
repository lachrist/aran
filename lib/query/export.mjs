const bindExport = (node) => {};

/** @type {(node: EstreeProgram) => Record<Variable, Specifier[]>} */
export const mapExport = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    if (node.declaration != null) {
      if (node.declaration.type === "VariableDeclaration") {
        return map(node.declaration.declarations, (declaration) => [
          declaration.id.name,
          {
            source: null,
            specifier: null,
          },
        ]);
      } else if (node.declaration.type === "FunctionDeclaration") {
        return [[node.declaration.id.name, { source: null, specifier: null }]];
      } else {
        throw new TypeError("invalid export declaration type");
      }
    } else {
      return map(node.specifiers, (specifier) => [
        specifier.exported.name,
        {
          source: null,
          specifier: specifier.local.name,
        },
      ]);
    }
  } else if (node.type === "ExportDefaultDeclaration") {
    return [["default", { source: null, specifier: null }]];
  } else {
    return [];
  }
};
