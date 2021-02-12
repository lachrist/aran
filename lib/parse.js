"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Object_assign = global.Object.assign;
const global_SyntaxError = global.SyntaxError;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");


data Source
  = ModuleSource
  | ScriptSource {
      variables :: [Variable] }
  | EvalSource {
      mode :: Mode,
      function :: Function,
      variables :: [Variable] }

// interface Options: {
//   parser: null | {
//     script: closure,
//     module: closure
//   },
//   source: "script" | "module" | "eval",
//   parserOptions: *,
//   context: null | {
//     "strict": boolean,
//     "function": "program" | "function" | "constructor" | "derived-constructor" | "method",
//     
//    },
//    serial: null | number
//    scopes: null | {{context}}
// };

const declare = (variable) => `${variable.kind} ${variable.name} = null;`

const parse = (code) => {
  const 
}

function f () {
  "foo"
  // foo
  /* foo */ ;
  "use strict";
  // ;
  // /* foo */
  // // foo
  // "use strict";
  delete foo;
}
'\
'
/^(\#\!.\n)?(\s|\/\/.*\n|||)*(\"use strict\"|\'use strict\')/






module.exports = (code, parse, source) => {
  let hashbang = "";
  {
    const parts = global_Reflect_apply(global_RegExp_prototype_exec, /^(\#\!.*\n)([\s\S]*)$/, [code]);
    if (parts !== null) {
      hashbang = parts[1];
      code = parts[2];
    }
  }
  let directive = "";
  {
    const parts = 
  
  
  if (code[0] === "#" && code[1] === "!") {
    const index = global_Reflect_apply(global_String_prototype_indexOf, code, ["\n"]);
  }
  if (options.source.type === "module") {
    return parse("module", code);
  }
  if (options.source.type === "script") {
    code = ArrayLite.join(ArrayLite.map(options.variables, declare), "\n") + code
    const node = parse("script", code);
    node.body = ArrayLite.slice(node.body, options.variables.length, node.body.length);
    return node;
  }
  const directive = source.strict ? `"use strict";` : `""`
  parse("script", )
  
  
  
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

visitors.Identifier = (node) => [node.name];
visitors.MemberExpression = (node) => [];

const combine = {
  
};

const visitors = {__proto__:null};



visitors.VariableDeclaration = (node) => [{}];
visitors.ClassDeclaration = (node) => [{
  type: "variable",
  kind: "class",
  name: node.id.name
}];
visitors.FunctionDeclaration = (node) => [{
  type: "variable",
  kind: "function",
  name: node.id.name
}];

visitors.EmptyStatement = (node) => [];
visitors.ExpressionStatement = (node, variables) => [node.expression];
visitors.ReturnStatement = (node, variables) => Throw.abrupt(Throw.SyntaxError, `Illegal return statement`);
visitors.BreakStatement = (node, variables) => [];
visitors.ContinueStatement = (node, variables) => [];
visitors.DebuggerStatement = (node, variables) => [];
visitors.ThrowStatement = (node, variables) => [];
visitors.IfStatement = (node, variables) => ArrayLite.concat(
  [node.test],
  visit(node.consequent, variables),
  visit(node.)
  visitors[node.conseq]
  visit(node.test, variables)
visitors.BlockStatement = (node, variables) => (
  variablesArrayLite.flatMap(
  node.body,
  (node) => visit(node, variables)

