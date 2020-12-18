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
//   source: "script" | "module" | "local-eval" | "global-eval",
//   context: null | {
//     "strict-mode": boolean,
//     "super-call": boolean,
//     "super-property": boolean,
//     "new-target": boolean
//   },
//   serial: null | number,
//   scopes: null | {Scope},
//   parserOption: *
// };

module.exports = (code, options) => {
  Throw.assert(options.parser !== null, Throw.InvalidOptionsAranError, `Missing external parser`);
  if (options.source === "script") {
    return options.parser.script(code, options.parserOptions);
  }
  if (options.source === "module") {
    return options.parser.module(code, options.parserOptions);
  }
  // console.assert(source === "eval");
  const context = {
    ["strict-mode"]: false,
    ["super-call"]: false,
    ["super-property"]: false,
    ["new-target"]: false
  };
  if (options.context !== null) {
    global_Object_assign(context, options.context);
  } else if (options.serial !== null) {
    Throw.assert(options.scopes !== null, Throw.InvalidOptionsAranError, `Missing options.scopes`);
    Throw.assert(global_Reflect_getOwnPropertyDescriptor(options.scopes, options.serial) !== void 0, Throw.InvalidOptionsAranError, `Missing options.scopes[options.serial]`);
    global_Object_assign(context, options.scopes[options.serial].context);
  }
  Throw.assert(!context["super-call"] || context["strict-mode"], Throw.InvalidOptionsAranError, `Violation of super-call => strict-mode`);
  Throw.assert(!context["super-call"] || context["super-property"], Throw.InvalidOptionsAranError, `Violation of super-call => super-property`);
  Throw.assert(!context["super-property"] || context["new-target"], Throw.InvalidOptionsAranError, `Violation of super-propety => new-target`);
  const directive = context["strict-mode"] ? `"use strict";` : `"use normal";`;
  let node = null;
  if (context["super-call"]) {
    node = options.parser.script(`${directive} (class extends Object { constructor () { ${code} } });`, options.parserOptions);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (context["super-property"]) {
    node = options.parser.script(`${directive} ({name () { ${code} }});`, options.parserOptions);
    node.body = node.body[1].expression.properties[0].value.body.body;
  } else if (context["new-target"]) {
    node = options.parser.script(`${directive} (function () { ${code} });`, options.parserOptions);
    node.body = node.body[1].expression.body.body;
  } else {
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
