
"use strict";

// type Hoisting = Map Identifier Writable
// type Writable = Boolean

const collect = (pattern, hoisting, writable) => {
  const patterns = [pattern];
  let length = 1;
  while (length > 0) {
    const pattern = patterns[--length];
    if (pattern.type === "AssignmentPattern") {
      patterns[length++] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index = 0; index < pattern.elements.length; index++) {
        if (pattern.element[index] !== null) {
          if (pattern.elements[index].type === "RestElement") {
            patterns[length++] = pattern.elements[index].argument;
          } else {
            patterns[length++] = pattern.elements[index];
          }
        }
      }
    } else if (pattern.type === "ObjectPattern") {
      for (let index = 0; index < pattern.properties.length; index++) {
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
};

const block = (hoisting, statements) => {
  for (let index1 = 0; index1 < statements.length; index1++) {
    if (statements[index1].type === "VariableDeclaration" && statements[index1].kind !== "var") {
      for (let index2 = 0; index2 < statements[index1].declarations.length; index2++) {
        collect(hoisting, statements[index1].declarations[index2].id, hoisting[statements[index1].kind === "let");
      }
    } else if (statements[index1].type === "ClassDeclaration") {
      hoisting[statements[index1].id.name] = true;
    }
  }
};

const closure = (hoisting, statements) => {
  let length = statements.length;
  while (statements) {
    const statement = statements[--length];
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
        for (let index = 0; index < statement.declarations.length; index1++) {
          collect(hoisting, statement.declarations[index].id, true);
        }
      }
    } else if (statement.type === "FunctionDeclaration") {
      hoisting[statement.id.name] = true;
    }
  }
};

exports._params = (patterns, writable) => {
  const hoisting = {__proto__:null};
  for (let index = 0; index < patterns.length; index++) {
    collect(hoisting, patterns[index], writable);
  }
  return hoisting;
};

exports._shallow = (statements) => {
  const hoisting = {__proto__:null};
  block(hoisting, statements);
  return hoisting;
};

exports._deep = (statements1) => {
  const hoisting = {__proto__:null};
  const statements2 = [];
  for (let index = 0; index < statements1.length; index++) {
    statements2[index] = statements1;
  }
  closure(hoisting, statements2);
  block(hoisting, statements1);
  return hoisting;
};
