"use strict";

// type Hoisting = Map Identifier Writable
// type Writable = Boolean
// type Pattern = estree.Pattern
// type Length = Int

const ArrayLite = require("array-lite");
// const global_Reflect_apply = global.Reflect.apply;
// const global_Array_prototype_slice = global.Array.prototype.slice;

const collect = (variables, kind, pattern) => {
  const patterns = [pattern];
  let length = 1;
  while (length > 0) {
    const pattern = patterns[--length];
    if (pattern.type === "RestElement") {
      patterns[length++] = pattern.argument;
    } else if (pattern.type === "AssignmentPattern") {
      patterns[length++] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index = pattern.elements.length - 1; index >= 0; index--) {
        if (pattern.elements[index] !== null) {
          patterns[length++] = pattern.elements[index];
        }
      }
    } else if (pattern.type === "ObjectPattern") {
      for (let index = pattern.properties.length - 1; index >= 0; index--) {
        if (pattern.properties[index].type === "RestElement") {
          patterns[length++] = pattern.properties[index]
        } else {
          patterns[length++] = pattern.properties[index].value;
        }
      }
    } else {
      // console.assert(pattern.type === "Identifier");
      variables[variables.length] = {
        kind,
        name: pattern.name
      }
    }
  }
  return variables;
};

exports._get_parameter_hoisting = (patterns) => {
  const variables = [];
  for (let index = 0; index < patterns.length; index++) {
    collect(variables, "param", patterns[index]);
  }
  return variables;
};

exports._get_block_hoisting = (statements) => {
  const variables = [];
  statements = ArrayLite.reverse(statements);
  let length = statements.length;
  while (length > 0) {
    const statement = statements[--length];
    if (statement.type === "VariableDeclaration") {
      if (statement.kind !== "var") {
        for (let index = 0; index < statement.declarations.length; index++) {
          collect(variables, statement.kind, statement.declarations[index].id);
        }
      }
    } else if (statement.type === "ClassDeclaration") {
      if (statement.id !== null) {
        variables[variables.length] = {
          kind: "class",
          name: statement.id.name
        };
      }
    } else if (statement.type === "ImportDeclaration") {
      for (let index = 0; index < statement.specifiers.length; index++) {
        variables[variables.length] = {
          kind: "import",
          name: statement.specifiers[index].local.name
        };
      }
    } else if (statement.type === "ExportDefaultDeclaration") {
      if (statement.declaration.type === "FunctionDeclaration" || statement.declaration.type === "ClassDeclaration") {
        statements[length++] = statement.declaration;
      }
    } else if (statement.type === "ExportNamedDeclaration") {
      if (statement.declaration !== null) {
        statements[length++] = statement.declaration;
      }
    }
  }
  return variables;
};

//   for (let index1 = 0; index1 < statements.length; index1++) {
//     if (statements[index1].type === "VariableDeclaration" && statements[index1].kind !== "var") {
//       for (let index2 = 0; index2 < statements[index1].declarations.length; index2++) {
//         collect(variables, statements[index1].kind, statements[index1].declarations[index2].id);
//       }
//     } else if (statements[index1].type === "ClassDeclaration" && statements[index1].id !== null) {
//       variables[variables.length] = {
//         kind: "class",
//         name: statements[index1].id.name
//       };
//     } else if (statements[index1].type === "ImportDeclaration") {
//       for (let index2 = 0; index2 < statements[index1].specifiers.length; index2++) {
//         variables[variables.length] = {
//           kind: "import",
//           name: statements[index1].specifiers[index2].local.name;
//         };
//       }
//     } else if (statements[index1].type === )
//   }
//   return variables;
// };

exports._get_closure_hoisting = (statements) => {
  const variables = [];
  statements = ArrayLite.reverse(statements);
  let length = statements.length;
  while (length > 0) {
    const statement = statements[--length];
    if (statement.type === "IfStatement") {
      if (statement.alternate) {
        statements[length++] = statement.alternate;
      }
      statements[length++] = statement.consequent;
    } else if (statement.type === "LabeledStatement") {
      statements[length++] = statement.body;
    } else if (statement.type === "WhileStatement" || statement.type === "DoWhileStatement") {
      statements[length++] = statement.body;
    } else if (statement.type === "ForStatement") {
      statements[length++] = statement.body;
      if (statement.init && statement.init.type === "VariableDeclaration") {
        statements[length++] = statement.init;
      }
    } else if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
      statements[length++] = statement.body;
      if (statement.left.type === "VariableDeclaration") {
        statements[length++] = statement.left;
      }
    } else if (statement.type === "BlockStatement") {
      for (let index = statement.body.length - 1; index >= 0; index--) {
        statements[length++] = statement.body[index];
      }
    } else if (statement.type === "TryStatement") {
      if (statement.finalizer) {
        statements[length++] = statement.finalizer;
      }
      if (statement.handler) {
        statements[length++] = statement.handler.body;
      }
      statements[length++] = statement.block;
    } else if (statement.type === "SwitchStatement") {
      for (let index1 = statement.cases.length - 1; index1 >= 0; index1--) {
        for (let index2 = statement.cases[index1].consequent.length - 1; index2 >= 0; index2--) {
          statements[length++] = statement.cases[index1].consequent[index2];
        }
      }
    } else if (statement.type === "VariableDeclaration") {
      if (statement.kind === "var") {
        for (let index = 0; index < statement.declarations.length; index++) {
          collect(variables, "var", statement.declarations[index].id);
        }
      }
    } else if (statement.type === "FunctionDeclaration") {
      if (statement.id !== null) {
        variables[variables.length] = {
          kind: "function",
          name: statement.id.name
        };
      }
    } else if (statement.type === "ExportDefaultDeclaration") {
      if (statement.declaration.type === "ClassDeclaration" || statement.declaration.type === "FunctionDeclaration") {
        statements[length++] = statement.declaration;
      }
    } else if (statement.type === "ExportNamedDeclaration") {
      if (statement.declaration !== null) {
        statements[length++] = statement.declaration;
      }
    }
  }
  return variables;
};
