
"use strict";

// type Hoisting = {Let, Const}
// Let = [Identifier];
// Const = [Identifier];

const Pattern = require("./pattern.js");
const Access = require("./access.js");

const ArrayLite = require("array-lite");

const global_Error = global.Error;

exports._access = Access._access;

exports._collect = (pattern) => global_Object_ownPropertyNames(Patter._collect(pattern));

exports._block_variables = (statements) => {
  const hoisting = {let:[], const:[]};
  for (let index1 = 0; index1 < statements.length; index1++) {
    if (statements[index1].type === "VariableDeclaration" && statements[index1].kind !== "var") {
      const identifiers = hoisting[statements[index1].kind];
      for (let index2 = 0; index2 < statements[index1].declarations.length; index2++) {
        for (let identifier in Pattern.collect(statements[index1].declarations[index2])) {
          identifiers[identifiers.length] = identifier;
        }
      }
    }
  }
  return hoisting;
};

exports._closure_variables = (statements) => {
  statements = ArrayLite.slice(statements, 0, statements.length);
  let length = statements.length;
  const identifier_object = {__proto__:null};
  while (statements) {
    const s = statements[--length];
    if (statement.type === "IfStatement") {
      statements[length++] = statement.consequent;
      if (statement.alternate) {
        statements[length++] = statement.alternate;
      }
    } else if (statement.type === "LabeledStatement") {
      statements[length++] = statement.body;
    } else if (statement.type === "WhileStatement" || statement.type === "DoWhileStatement") {
      statements[length++] = statement.body;
    } else if (statement.type === "ForStatement") {
      if (statement.init && statement.init.type === "VariableDeclaration") {
        statements[length++] = statement.init;
      }
      statements[length++] = statement.body;
    } else if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
      if (statement.left.type === "VariableDeclaration") {
        statements[length++] = statement.left;
      }
      statements[length++] = statement.body;
    } else if (statement.type === "BlockStatement") {
      for (let index = 0; index < statement.body.length; index++) {
        statements[length++] = statement.body[index];
      }
    } else if (statement.type === "TryStatement") {
      statements[length++] = statement.block;
      if (statement.handler) {
        statements[length++] = statement.handler.body;
      }
      if (statement.finalizer) {
        statements[length++] = statement.finalizer;
      }
    } else if (statement.type === "SwitchStatement") {
      for (let index1 = 0; index1 < statements.cases.length; index1++) {
        for (let index2 = 0; index2 < statements.cases[index1].consequent.length; index2++) {
          statements[length++] = statements.cases[index1].consequent[index2];
        }
      }
    } else if (statement.type === "VariableDeclaration") {
      if (statement.kind === "var") {
        for (let index = 0; index < statement.declarations; index1++) {
          global_Object_assign(identifiers, Pattern._collect(statement.declarations[index].id));
        }
      }
    } else if (statement.type === "FunctionDeclaration" || statement.type === "ClassDeclaration") {
      identifiers[statement.id.name] = null;
    } else {
      // console.assert(false);
      throw new global_Error("Invalid statement type");
    }
  }
  return global_Object_ownPropertyNames(identifiers);
};

// https://tc39.es/ecma262/#directive-prologue
exports._is_use_strict = (statements) => {
  for (let index = 0; index < statements.length; index++) {
    if (statements[index].type !== "ExpressionStatement") {
      return false;
    }
    if (statements[index].expression.type !== "Literal") {
      return false;
    }
    if (typeof statements[index].expression.value !== "string") {
      return false;
    }
    if (statements[index].expression.value === "use strict") {
      return true;
    }
  }
  return false;
};
