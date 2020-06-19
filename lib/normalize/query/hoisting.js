"use strict";

// type Hoisting = Map Identifier Writable
// type Writable = Boolean
// type Pattern = estree.Pattern
// type Length = Int

const ArrayLite = require("array-lite");
// const global_Reflect_apply = global.Reflect.apply;
// const global_Array_prototype_slice = global.Array.prototype.slice;

const collect = (hoisting, pattern, writable) => {
  const patterns = [pattern];
  let length = 1;
  while (length > 0) {
    const pattern = patterns[--length];
    if (pattern.type === "AssignmentPattern") {
      patterns[length++] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index = pattern.elements.length - 1; index >= 0; index--) {
        if (pattern.elements[index] !== null) {
          if (pattern.elements[index].type === "RestElement") {
            patterns[length++] = pattern.elements[index].argument;
          } else {
            patterns[length++] = pattern.elements[index];
          }
        }
      }
    } else if (pattern.type === "ObjectPattern") {
      for (let index = pattern.properties.length - 1; index >= 0; index--) {
        if (pattern.properties[index].type === "RestElement") {
          patterns[length++] = pattern.properties[index].argument;
        } else {
          patterns[length++] = pattern.properties[index].value;
        }
      }
    } else {
      // console.assert(pattern.type === "Identifier");
      hoisting[pattern.name] = writable;
    }
  }
  return hoisting;
};

exports._get_parameter_hoisting = (pattern, writable) => collect({__proto__:null}, pattern, writable);

exports._get_shallow_hoisting = (statements) => {
  const hoisting = {__proto__:null};
  for (let index1 = 0; index1 < statements.length; index1++) {
    if (statements[index1].type === "VariableDeclaration" && statements[index1].kind !== "var") {
      for (let index2 = 0; index2 < statements[index1].declarations.length; index2++) {
        collect(hoisting, statements[index1].declarations[index2].id, statements[index1].kind === "let");
      }
    } else if (statements[index1].type === "ClassDeclaration") {
      hoisting[statements[index1].id.name] = true;
    }
  }
  return hoisting;
};

exports._get_deep_hoisting = (statements) => {
  const hoisting = {__proto__:null};
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
        for (let index = statement.declarations.length - 1; index >= 0; index--) {
          collect(hoisting, statement.declarations[index].id, true);
        }
      }
    } else if (statement.type === "FunctionDeclaration") {
      hoisting[statement.id.name] = true;
    }
  }
  return hoisting;
};
