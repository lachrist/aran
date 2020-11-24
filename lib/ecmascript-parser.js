const Acorn = require()

const script_option_object = {
  __proto__: null,
  ecmaVersion: 2021,
  sourceType: "script"
};

const module_option_object = {
  __proto__: null,
  ecmaVersion: 2021,
  sourceType: "module"
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
    }
  }
  return false;
};

const parse_eval = {
  __proto__: null,
  program: (code, options) => {
    if (options.strict) {
      code = `"use strict"; { ${code} }`;
    }
    const node = Acorn.parse(code, script_option_object);
    if (options.strict) {
      node.body = node.body[1].body;
    }
    return node;
  },
  constructor: (code, options) => {
    if (options.derived) {
      code = `(class extends Object { constructor () { ${code} } });`;
    } else {
      code = `(class { constructor () { ${code} } });`
    }
    const node = Acorn.parse(code, script_option_object);
    node.body = node.body[0].expression.methods[0].value.body.body;
    return node;
  },
  method: (code, options) => {
    if (options.strict) {
      code = `"use strict"; ({name () { ${code} }});`
    } else {
      code = `({name () { ${code} }});`
    }
    const node = Acorn.parse(code, script_option_object);
    node.body = node.body[options.strict ? 1 : 0].expression.properties[0].value.body.body;
    return node;
  },
  function: (code, options) => {
    if (options.strict) {
      code = `"use strict"; (function () { ${code} });`;
    } else {
      code = `(function () { ${code} });`;
    }
    const node = Acorn.parse(code, script_option_object);
    node.body = node.body[options.strict ? 1 : 0].expression.body.body;
    return node;
  },
  arrow: (code, strict) => {
    if (options.strict) {
      code = `"use strict"; (() => { ${code} });`;
    } else {
      code = `(() => { ${code} });`;
    }
    const node = Acorn.parse(code, script_option_object);
    node.body = node.body[options.strict ? 1 : 0].expression.body.body;
    return node;
  }
};

exports.script = (code) => Acorn.parse(code, script_option_object);

exports.module = (code) => Acorn.parse(code, module_option_object);

exports.eval = (code, sort, options) => {
  const node = parse_eval[sort](code, options);
  if (has_return_statement(node.body)) {
    throw new global_Error("Illegal return statement");
  }
  return node;
};
