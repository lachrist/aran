"use strict";

const getLocalName = (specifier) => specifier.local.name;

const getId = (declaration) => declaration.id;

const isIdentifier = (pattern) => pattern.type === "Identifier";

const visit = (node) => (node.type in visitors ? visitors[node.type](node) : []);

const visitors = {
  __proto__:null,
  LabeledStatement: (node) => visit(node.body),
  ClassDeclaration: (node) => (
    node.id !== null ?
    [Variable.Class(node.id.name)] :
    []),
  FunctionDeclaration: (node) => (
    node.id.name !== null ?
    Variable.Function(node.id.name)
  VariableDeclaration: (node) => (
    node.kind === "var" ?
    [] :
    ArrayLite.flatMap(
      ArrayLite.map(node.declarations, getId),
      Pattern.collect)),
  ImportDeclaration: (node) => ArrayLite.map(node.specifiers, getLocaLName),
  ExportDefaultDeclaration: (node) => visit(node.declaration),
  ExportNamedDeclaration: (node) => (
    node.declaration !== null ?
    visit(node.declaration) :
    [])};

module.exports = visit;

// exports.scopeStatement = visit;

// 
// exports.scopeParameters = (patterns) => (
//   ArrayLite.every(pattern, isIdentifier) ?
//   [] :
//   ArrayLite.flatMap(patterns, Pattern.collect));
