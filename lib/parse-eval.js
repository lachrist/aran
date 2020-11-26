"use strict";

const global_Error = global.Error;
const global_SyntaxError = global.SyntaxError;

const ArrayLite = require("array-lite");

module.exports = (code, sort, options, parse) => {
  if (sort === "program") {
    if (!options.strict) {
      return parse(code);
    }
    const node = parse(`"use strict"; { ${code} }`);
    node.body = node.body[1].body;
    return node;
  }
  let node = null;
  const directive = options.strict ? `"use strict";` : `"use normal";`;
  if (sort === "constructor") {
    node = parse(`${directive} (class ${options.derived ? `extends Object` : ``} { constructor () { ${code} } });`);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (sort === "method") {
    node = parse(`${directive} ({name () { ${code} }});`);
    node.body = node.body[1].expression.properties[0].value.body.body;
  } else if (sort === "function") {
    node = parse(`${directive} (function () { ${code} });`);
    node.body = node.body[1].expression.body.body;
  } else if (sort === "arrow") {
    node = parse(`${directive} (() => { ${code} });`);
    node.body = node.body[1].expression.body.body;
  } else {
    throw new global_Error("Invalid sort");
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
