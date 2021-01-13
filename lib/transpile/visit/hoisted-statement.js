"use strict";

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Visit = require("./index.js");

exports.HoistedStatement = (scope, node, context) => (
  node.type in visitors ?
  visitors[node.type](scope, node, context) :
  Tree.BundleStatement([]));

const visitors = {__proto__:null};

visitors.LabeledStatement = (scope, node, context) => Visit.HoistedStatement(scope, node.body, null);

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration === null ?
  Tree.BundleStatement([]) :
  Visit.HoistedStatement(scope, node.declaration, null));

visitors.ExportDefaultDeclaration = (scope, node, context) => (
  node.declaration.type === "FunctionDeclaration" ?
  Visit.HoistedStatement(scope, node.declaration, null) :
  Tree.BundleStatement([]));

visitors.FunctionDeclaration = (scope, node, context) => (
  node.id === null ?
  Tree.BundleStatement([]) :
  Scope.makeInitializeStatement(
    scope,
    "function",
    node.id.name,
    Visit.closure(scope, node, null)));
