"use strict";

// type Expression = estree.Expression
// type Statement = estree.Statement
// type Pattern = estree.Pattern

const global_Reflect_apply = global.Reflect.apply;
const global_Array_prototype_slice = global.Array.prototype.slice;

const is_direct_eval_call = (expression) => {
  if (expression.type !== "CallExpression") {
    return false;
  }
  if (expression.callee.type !== "Identifier") {
    return false;
  }
  if (expression.callee.name !== "eval") {
    return false;
  }
  if (expression.arguments.length === 0) {
    return false;
  }
  // Eval calls with a spread element is not a direct eval call:
  // ((function () {
  //   eval("var x = 123;", ...[]);
  //   console.assert(global.x === 123);
  // }) ());
  for (let index = 0; index < expression.arguments.length; index++) {
    if (expression.arguments[index].type === "SpreadElement") {
      return false;
    }
  }
  return true;
};

exports._is_direct_eval_call = is_direct_eval_call;

// Direct eval calls cannot declare variables in arguments position:
// ((function (x = eval("var y = 123; 'qux'")) {
//   console.assert(x === "qux"); // prints: qux
//   console.assert(typeof y === "undefined");
// }) ());
exports._has_direct_eval_call = (statements) => {
  statements = global_Reflect_apply(global_Array_prototype_slice, statements, []);
  const expressions = [];
  const patterns = [];
  let length1 = 1;
  let length2 = 0; 
  let length3 = 0;
  while (length1 > 0 || length2 > 0 || length3 > 0) {
    if (length1 > 0) {
      const statement = statements[--length1];
      const type = statement.type;
      if (type === "ExpressionStatement") {
        expressions[length2++] = statement.expression;
      } else if (type === "ReturnStatement") {
        if (statement.argument !== null) {
          expressions[length2++] = statement.argument;
        }
      } else if (type === "ThrowStatement") {
        expressions[length2++] = statement.argument;
      } else if (type === "BlockStatement") {
        for (let index = 0; index < statement.body.length; index++) {
          statements[length1++] = statement.body[index];
        }
      } else if (type === "LabeledStatement") {
        statements[length1++] = statement.body;
      } else if (type === "WithStatement") {
        expressions[length2++] = statement.object;
        statements[length1++] = statement.body;
      } else if (type === "IfStatement") {
        expressions[length2++] = statement.test;
        statements[length1++] = statement.consequent;
        if (statement.alternate !== null) {
          statements[length1++] = statement.alternate;
        }
      } else if (type === "WhileStatement" || type === "DoWhileStatement") {
        expressions[length2++] = statement.test;
        statements[length1++] = statement.body;
      } else if (type === "ForStatement") {
        if (statement.init !== null) {
          if (statement.init.type === "VariableDeclaration") {
            statements[length1++] = statement.init;
          } else {
            expressions[length2++] = statement.init;
          }
        }
        if (statement.test !== null) {
          expressions[length2++] = statement.test;
        }
        if (statement.update !== null) {
          expressions[length2++] = statement.update;
        }
        statements[length1++] = statement.body;
      } else if (type === "ForInStatement" || type === "ForOfStatement") {
        if (statement.left.type === "VariableDeclaration") {
          statements[length1++] = statement.left;
        } else if (statement.left.type === "MemberExpression") {
          expressions[length2++] = statement.left;
        } else {
          // Direct eval calls can declare variable in left hand side of for-in statements:
          // ((function  () {
          //   let o = {foo:"bar"};
          //   for (let [x1, x2, x3, x4=eval("var y = 123; 'qux';")] in o) {
          //     console.assert(x1 + x2 + x3 + x4 === "fooqux");
          //   }
          //   console.assert(y === 123);
          // }) ());
          patterns[length3++] = statement.left;
        }
        expressions[length2++] = statement.right;
        statements[length1++] = statement.body;
      } else if (type === "TryStatement") {
        statements[length1++] = statement.block;
        if (statement.handler !== null) {
          // Direct eval calls can declare variables inside catch parameter:
          // ((function () {
          //   try {
          //     throw [undefined];
          //   } catch ([x = eval("var y = 123; 'qux'")]) {
          //     console.assert(x === "qux");
          //   }
          //   console.assert(y === 123);
          // }) ());
          if (statement.handler.param !== null) {
            patterns[length3++] = statement.handler.param;
          }
          statements[length1++] = statement.handler.body;
        }
        if (statement.finalizer !== null) {
          statements[length1++] = statement.finalizer;
        }
      } else if (type === "VariableDeclaration") {
        for (let index = 0; index < statement.declarations.length; index++) {
          patterns[length3++] = statement.declarations[index].id;
          if (statement.declarations[index].init !== null) {
            expressions[length2++] = statement.declarations[index].init;
          }
        }
      } else {
        // console.assert(type === "FunctionDeclaration" || type === "ClassDeclaration" || type === "BreakStatement" || type === "ContinueStatement" || type === "EmptyStatement" || type === "DebuggerStatement");
        // Direct eval calls cannot declare variables inside class declarations:
        // ((function () {
        //   class C extends eval("var x = 123; (function F () {});") {
        //     [eval("var y = 456; 'qux'")] () {}
        //   }
        //   console.assert(Reflect.getPrototypeOf(C.prototype).constructor.name === "F");
        //   console.assert("qux" in C.prototype);
        //   console.assert(typeof x === "undefined");
        //   console.assert(typeof y === "undefined");
        // }) ())
      }
    }
    if (length2 > 0) {
      const expression = expressions[--length2];
      if (is_direct_eval_call(expression)) {
        return true;
      }
      const type = expression.type;
      if (type === "UpdateExpression") {
        if (expression.argument.type === "MemberExpression") {
          expressions[length2++] = expression.argument;
        } else {
          // console.assert(expression.argument.type === "Identifier");
        }
      } else if (expression.type ===  "AssignmentExpression") {
        if (expression.left.type === "MemberExpression") {
          expressions[length2++] = expression.left;
        } else {
          patterns[length3++] = expression.left;
        }
        expressions[length2++] = expression.right;
      } else if (expression.type ===  "SequenceExpression" || expression.type === "TemplateLiteral") {
        for (let index = 0; index < expression.expressions.length; index++) {
          expressions[length2++] = expression.expressions[index];
        }
      } else if (expression.type === "ConditionalExpression") {
        expressions[length2++] = expression.test;
        expressions[length2++] = expression.consequent;
        expressions[length2++] = expression.alternate;
      } else if (expression.type === "LogicalExpression" || expression.type === "BinaryExpression") {
        expressions[length2++] = expression.left;
        expressions[length2++] = expression.right;
      } else if (expression.type === "YieldExpression" || expression.type === "AwaitExpression" || expression.type === "UnaryExpression") {
        expressions[length2++] = expression.argument;
      } else if (expression.type === "MemberExpression") {
        expressions[length2++] = expression.object;
        if (expression.computed) {
          expressions[length2++] = expression.property;
        }
      } else if (expression.type === "TaggedTemplateExpression") {
        expressions[length2++] = expression.tag;
        expressions[length2++] = expression.quasi;
      } else if (expression.type === "ArrayExpression") {
        for (let index = 0; index < expression.elements.length; index++) {
          if (expression.elements[index] !== null) {
            if (expression.elements[index].type === "SpreadElement") {
              expressions[length2++] = expression.elements[index].argument;
            } else {
              expressions[length2++] = expression.elements[index];
            }
          }
        }
      } else if (expression.type === "ObjectExpression") {
        for (let index = 0; index < expression.properties.length; index++) {
          if (expression.properties[index].type === "SpreadElement") {
            expressions[length2++] = expression.properties[index].argument;
          } else {
            if (expression.properties[index].computed) {
              expressions[length2++] = expression.properties[index].key;
            }
            expressions[length2++] = expression.properties[index].value;
          }
        }
      } else if (expression.type === "NewExpression" || expression.type === "CallExpression") {
        expressions[length2++] = expression.callee;
        for (let index = 0; index < expression.arguments.length; index++) {
          if (expression.arguments[index].type === "SpreadElement") {
            expressions[length2++] = expression.arguments[index].argument;
          } else {
            expressions[length2++] = expression.arguments[index];
          }
        }
      } else {
        // console.assert(type === "Literal" || type === "Identifier" || type === "ThisExpression" || type === "MetaProperty" || type === "ImportExpression" || type === "ClassExpression" || type === "FunctionExpression");
        // Direct eval calls cannot declare variables inside class expressions:
        // ((function () {
        //   let C = class extends eval("var x = 123; (function F () {});") {
        //     [eval("var y = 456; 'qux'")] () {}
        //   }
        //   console.assert(Reflect.getPrototypeOf(C.prototype).constructor.name === "F");
        //   console.assert("qux" in C.prototype);
        //   console.assert(typeof x === "undefined");
        //   console.assert(typeof y === "undefined");
        // }) ())
      }
    }
    if (length3 > 0) {
      const pattern = patterns[--length3];
      const type = pattern.type;
      if (type === "AssignmentPattern") {
        expressions[length2++] = pattern.right;
      } else if (type === "ArrayPattern") {
        for (let index = 0; index < pattern.elements.length; index++) {
          if (pattern.elements[index] !== null) {
            if (pattern.elements[index].type === "RestElement") {
              patterns[length3++] = pattern.elements[index].argument;
            } else {
              patterns[length3++] = pattern.elements[index];
            }
          }
        }
      } else if (type === "ObjectPattern") {
        for (let index = 0; index < pattern.properties.length; index++) {
          if (pattern.properties[index].type === "RestElement") {
            patterns[length3++] = pattern.properties[index].argument;
          } else {
            if (pattern.properties[index].computed) {
              expressions[length2++] = pattern.properties[index].key;
            }
            patterns[length3++] = pattern.properties[index].value;
          }
        }
      }
    } else {
      // console.assert(type === "Identifier");
    }
  }
  return false;
};
