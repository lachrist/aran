"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Object_assign = global.Object.assign;
const global_SyntaxError = global.SyntaxError;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");

// interface Options: {
//   parser: null | {
//     script: closure,
//     module: closure
//   },
//   source: "script" | "module" | "eval",
//   context: null | {
//     "strict-mode": boolean,
//     "function-sort": "program" | "function" | "constructor" | "derived-constructor" | "method"
//    },
//   parserOptions: *
// };

module.exports = (code, options) => {
  options = global_Object_assign({
    source: "script",
    parser: null,
    context: null,
    parserOptions: null
  }, options);
  Throw.assert((options.source === "eval") || (options.context === null), Throw.InvalidOptionsAranError, `script/module source cannot have a context`);
  Throw.assert(options.parser !== null, Throw.InvalidOptionsAranError, `Missing external parser`);
  if (options.source === "module") {
    return options.parser.module(code, options.parserOptions);
  }
  if (options.source === "script" || options.context === null) {
    return options.parser.script(code, options.parserOptions);
  }
  const directive = options.context.strict ? `"use strict";` : `"use normal";`;
  let node = null;
  if (options.context.sort === "derived-constructor") {
    node = options.parser.script(`${directive} (class extends Object { constructor () { ${code} } });`, options.parserOptions);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (options.context.sort === "constructor") {
    node = options.parser.script(`${directive} (class { constructor () { ${code} } });`, options.parserOptions);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (options.context.sort === "method") {
    node = options.parser.script(`${directive} ({ method () { ${code} } });`, options.parserOptions);
    node.body = node.body[1].expression.properties[0].value.body.body;
  } else if (options.context.sort === "function") {
    node = options.parser.script(`${directive} (function () { ${code} });`, options.parserOptions);
    node.body = node.body[1].expression.body.body;
  } else {
    // console.assert(context.sort === "program")
    node = options.parser.script(`${directive} (() => { ${code} });`, options.parserOptions);
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
    } else if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
      statements[length++] = statement.body;
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
