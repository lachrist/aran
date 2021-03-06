"use strict";

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Visit = require("./index.js");

exports.visitHoistedStatement = (scope, node, context) => (
  node.type in visitors ?
  visitors[node.type](scope, node, context) :
  Tree.ListStatement([]));

const visitors = {__proto__:null};

visitors.LabeledStatement = (scope, node, context) => Visit.visitHoistedStatement(scope, node.body, null);

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration === null ?
  Tree.ListStatement([]) :
  Visit.visitHoistedStatement(scope, node.declaration, null));

visitors.ExportDefaultDeclaration = (scope, node, context) => Visit.visitHoistedStatement(scope, node.declaration, null);

visitors.FunctionDeclaration = (scope, node, context) => (
  node.id === null ?
  Tree.ListStatement([]) :
  Scope.makeInitializeStatement(
    scope,
    "function",
    node.id.name,
    Visit.visitClosure(scope, node, null)));
