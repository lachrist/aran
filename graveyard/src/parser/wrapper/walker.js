"use strict";

const global_Array_isArray = global.Array.isArray;

const syntax = {
  Program: ["body"],
  ///////////////
  // Statement //
  ///////////////
  // Atomic //
  EmptyStatement: [],
  DebuggerStatement: [],
  ExpressionStatement: ["expression"],
  ThrowStatement: ["argument"],
  ReturnStatement: ["argument"],
  ContinueStatement: ["label"],
  BreakStatement: ["label"],
  // Compound //
  LabeledStatement: ["label", "body"],
  BlockStatement: ["body"],
  IfStatement: ["test", "consequent", "alternate"],
  WhileStatement: ["test", "body"],
  DoWhileStatement: ["body", "test"],
  WithStatement: ["object", "body"],
  ForStatement: ["init", "test", "update", "body"],
  ForInStatement: ["left", "right", "body"],
  ForOfStatement: ["left", "right", "body"],
  SwitchStatement: ["discriminant", "cases"],
  TryStatement: ["block", "handler", "finalizer"],
  // Declaration //
  VariableDeclaration: ["declarations"],
  FunctionDeclaration: ["id", "params", "body"],
  ClassDeclaration: ["id", "superClass", "body"],
  ImportDeclaration: ["specifiers", "source"],
  ExportAllDeclaration: ["source"],
  ExportDefaultDeclaration: ["declaration"],
  ExportNamedDeclaration: ["declaration", "specifiers", "source"],
  // Other //
  VariableDeclarator: ["id", "init"],
  SwitchCase: ["test", "consequent"],
  CatchClause: ["param", "body"],
  ClassBody: ["body"],
  MethodDefinition: ["key", "value"],
  ////////////////
  // Expression //
  ////////////////
  // Environment //
  Identifier: [],
  AssignmentExpression: ["left", "right"],
  UpdateExpression: ["argument"],
  ThisExpression: [],
  MetaProperty: ["meta", "property"],
  // Literal //
  Literal: [],
  TaggedTemplateExpression: ["tag", "quasi"],
  TemplateLiteral: ["quasis", "expressions"],
  ArrowFunctionExpression: ["params", "body"],
  FunctionExpression: ["id", "params", "body"],
  ClassExpression: ["id", "superClass", "body"],
  ArrayExpression: ["elements"],
  ObjectExpression: ["properties"],
  // Control //
  ChainExpression: ["expression"],
  AwaitExpression: ["argument"],
  YieldExpression: ["argument"],
  ImportExpression: ["source"],
  LogicalExpression: ["left", "right"],
  ConditionalExpression: ["test", "consequent", "alternate"],
  SequenceExpression: ["expressions"],
  // Combination //
  MemberExpression: ["object", "property"],
  UnaryExpression: ["argument"],
  BinaryExpression: ["left", "right"],
  NewExpression: ["callee", "arguments"],
  CallExpression: ["callee", "arguments"],
  // Other //
  Super: [],
  TemplateElement: [],
  SpreadElement: ["argument"],
  Property: ["key", "value"],
  /////////////
  // Pattern //
  /////////////
  RestElement: ["argument"],
  AssignmentPattern: ["left", "right"],
  ArrayPattern: ["elements"],
  ObjectPattern: ["properties"]
};

exports.walk = (node, callback, options) => {
  const nodes = [node];
  let length = 1;
  while (length > 0) {
    const node = nodes[--length];
    callback(node, options);
    const keys = syntax[node.type];
    for (let index = keys.length - 1; index >= 0; index--) {
      const any = node[keys[index]];
      if (any !== null) {
        if (global_Array_isArray(any)) {
          for (let index = any.length - 1; index >= 0; index--) {
            if (any[index] !== null) {
              nodes[length++] = any[index];
            }
          }
        } else {
          nodes[length++] = any;
        }
      }
    }
  }
};
