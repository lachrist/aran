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
//   parserOptions: *,
//   context: null | {
//     "strict": boolean,
//     "sort": "program" | "function" | "constructor" | "derived-constructor" | "method"
//    },
//    serial: null | number
//    scopes: null | {{context}}
// };

module.exports = (code, options) => {
  let context = options.context;
  if (options.serial !== null) {
    Throw.assert(options.scopes !== null, Throw.InvalidOptionsAranError, `When options.serial is present, options.scopes must also be present`);
    context = options.scopes[options.serial].context;
  }
  Throw.assert((options.source === "eval") || (context === null), Throw.InvalidOptionsAranError, `script/module source cannot have a context`);
  Throw.assert(options.parser !== null, Throw.InvalidOptionsAranError, `Missing external parser`);
  if (options.source === "module") {
    return options.parser.module(code, options.parserOptions);
  }
  if (options.source === "script" || context === null) {
    return options.parser.script(code, options.parserOptions);
  }
  const directive = context.strict ? `"use strict";` : `"use normal";`;
  let node = null;
  // a newline is append to code to protect against single-line comment
  if (context.sort === "derived-constructor") {
    node = options.parser.script(`${directive} (class extends Object { constructor () { ${code}${"\n"} } });`, options.parserOptions);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (context.sort === "constructor") {
    node = options.parser.script(`${directive} (class { constructor () { ${code}${"\n"} } });`, options.parserOptions);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (context.sort === "method") {
    node = options.parser.script(`${directive} ({ method () { ${code}${"\n"} } });`, options.parserOptions);
    node.body = node.body[1].expression.properties[0].value.body.body;
  } else if (context.sort === "function") {
    node = options.parser.script(`${directive} (function () { ${code}${"\n"} });`, options.parserOptions);
    node.body = node.body[1].expression.body.body;
  } else {
    // console.assert(context.sort === "program")
    node = options.parser.script(`${directive} (() => { ${code}${"\n"} });`, options.parserOptions);
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
