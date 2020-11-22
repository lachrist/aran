"use strict";

// Super expression of class declaration cannot define variables in surrounding scope:
// function f () {
//   class C extends (eval("var x = 123"), Object) {};
//   return x; // ReferenceError
// }

exports._has_direct_eval_call = (node) => {
  const nodes = [node];
  let length = 1;
  while (length > 0) {
    const node = nodes[--length];
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "eval") {
      return true;
    }
    // Statement //
    if (node.type === "ExpressionStatement") {
      nodes[length++] = node.expression;
    } else if (node.type === "ReturnStatement") {
      if (node.argument !== null) {
        nodes[length++] = node.argument;
      }
    } else if (node.type === "ThrowStatement") {
      nodes[length++] = node.argument;
    } else if (node.type === "BlockStatement" || node.type === "Program") {
      for (let index = 0; index < node.body.length; index++) {
        nodes[length++] = node.body[index];
      }
    } else if (node.type === "LabeledStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "WithStatement") {
      nodes[length++] = node.object;
      nodes[length++] = node.body;
    } else if (node.type === "IfStatement") {
      nodes[length++] = node.test;
      nodes[length++] = node.consequent;
      if (node.alternate !== null) {
        nodes[length++] = node.alternate;
      }
    } else if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      nodes[length++] = node.test;
      nodes[length++] = node.body;
    } else if (node.type === "ForStatement") {
      if (node.init !== null) {
        nodes[length++] = node.init;
      }
      if (node.test !== null) {
        nodes[length++] = node.test;
      }
      if (node.update !== null) {
        nodes[length++] = node.update;
      }
      nodes[length++] = node.body;
    } else if (node.type === "ForInStatement" || node.type === "ForOfStatement") {
      nodes[length++] = node.left;
      nodes[length++] = node.right;
      nodes[length++] = node.body;
    } else if (node.type === "TryStatement") {
      nodes[length++] = node.block;
      if (node.handler !== null) {
        if (node.handler.param !== null) {
          nodes[length++] = node.handler.param;
        }
        nodes[length++] = node.handler.body;
      }
      if (node.finalizer !== null) {
        nodes[length++] = node.finalizer;
      }
    } else if (node.type === "VariableDeclaration") {
      for (let index = 0; index < node.declarations.length; index++) {
        nodes[length++] = node.declarations[index].id;
        if (node.declarations[index].init !== null) {
          nodes[length++] = node.declarations[index].init;
        }
      }
    } else if (node.type ===  "SequenceExpression" || node.type === "TemplateLiteral") {
      for (let index = 0; index < node.expressions.length; index++) {
        nodes[length++] = node.expressions[index];
      }
    } else if (node.type === "ConditionalExpression") {
      nodes[length++] = node.test;
      nodes[length++] = node.consequent;
      nodes[length++] = node.alternate;
    } else if (node.type === "AssignmentExpression" || node.type === "LogicalExpression" || node.type === "BinaryExpression") {
      nodes[length++] = node.left;
      nodes[length++] = node.right;
    } else if (node.type === "YieldExpression" || node.type === "AwaitExpression" || node.type === "UnaryExpression" || node.type === "UpdateExpression") {
      nodes[length++] = node.argument;
    } else if (node.type === "MemberExpression") {
      nodes[length++] = node.object;
      nodes[length++] = node.property;
    } else if (node.type === "TaggedTemplateExpression") {
      nodes[length++] = node.tag;
      nodes[length++] = node.quasi;
    } else if (node.type === "SpreadElement") {
      nodes[length++] = node.argument;
    } else if (node.type === "ArrayExpression") {
      for (let index = 0; index < node.elements.length; index++) {
        if (node.elements[index] !== null) {
          nodes[length++] = node.elements[index];
        }
      }
    } else if (node.type === "ObjectExpression") {
      for (let index = 0; index < node.properties.length; index++) {
        if (node.properties[index].type === "SpreadElement") {
          nodes[length++] = node.properties[index];
        } else {
          nodes[length++] = node.properties[index].key;
          nodes[length++] = node.properties[index].value;
        }
      }
    } else if (node.type === "NewExpression" || node.type === "CallExpression") {
      nodes[length++] = node.callee;
      for (let index = 0; index < node.arguments.length; index++) {
        nodes[length++] = node.arguments[index];
      }
    } else if (node.type === "RestElement") {
      nodes[length++] = node.argument;
    } else if (node.type === "AssignmentPattern") {
      nodes[length++] = node.left;
      nodes[length++] = node.right;
    } else if (node.type === "ArrayPattern") {
      for (let index = 0; index < node.elements.length; index++) {
        if (node.elements[index] !== null) {
          nodes[length++] = node.elements[index];
        }
      }
    } else if (node.type === "ObjectPattern") {
      for (let index = 0; index < node.properties.length; index++) {
        if (node.properties[index].type === "RestElement") {
          nodes[length++] = node.properties[index];
        } else {
          nodes[length++] = node.properties[index].key;
          nodes[length++] = node.properties[index].value;
        }
      }
    }
  }
  return false;
};
