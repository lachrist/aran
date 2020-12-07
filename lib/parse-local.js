"use strict";

const global_Object_assign = global.Object.assign;
const global_SyntaxError = global.SyntaxError;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");

// interface Options: {
//   "strict-mode": boolean,
//   "super-call": boolean,
//   "super-property": boolean,
//   "new-target": boolean
// };
module.exports = (code, options, parse) => {
  options = global_Object_assign({
    ["strict-mode"]: false,
    ["super-call"]: false,
    ["super-property"]: false,
    ["new-target"]: false
  }, options);
  Throw.assert(!options["super-call"] || options["strict-mode"], null, `Violation of super-call => strict-mode`);
  Throw.assert(!options["super-call"] || options["super-property"], null, `Violation of super-call => super-property`);
  Throw.assert(!options["super-property"] || options["new-target"], null, `Violation of super-propety => new-target`);
  const directive = options["strict-mode"] ? `"use strict";` : `"use normal";`;
  let node = null;
  if (options["super-call"]) {
    node = parse.script(`${directive} (class extends Object { constructor () { ${code} } });`);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (options["super-property"]) {
    node = parse.script(`${directive} ({name () { ${code} }});`);
    node.body = node.body[1].expression.properties[0].value.body.body;
  } else if (options["new-target"]) {
    node = parse.script(`${directive} (function () { ${code} });`);
    node.body = node.body[1].expression.body.body;
  } else {
    node = parse.script(`${directive} (() => { ${code} });`);
    node.body = node.body[1].expression.body.body;
  }
  if (has_return_statement(node.body)) {
    throw new global_SyntaxError("Illegal return statement");
  }
  return node;
};

const has_return_statement = (statements) => {
  statements = ArrayLite.reverse(statements);
  let length = statements.length;
  while (length > 0) {
    const statement = statements[--length];
    if (statement.type === "ReturnStatement") {
      return true;
    }
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
      // if (statement.init && statement.init.type === "VariableDeclaration") {
      //   statements[length++] = statement.init;
      // }
    } else if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
      statements[length++] = statement.body;
      // if (statement.left.type === "VariableDeclaration") {
      //   statements[length++] = statement.left;
      // }
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
    }
  }
  return false;
};
