"use strict";

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const State = require("../state.js");
const Builtin = require("../builtin.js");
const Scope = require("../scope");
const Common = require("./common");
const Expression = require("./expression.js");

const empty = (scope, node, context) => Tree.Bundle([]);

const declare_function = (scope, node, context) => Tree.Lift(
  Scope.initialize(
    scope,
    "function",
    node.id.name,
    Common.closure(
      scope,
      node,
      Expression._default_context)));

exports._default_context = null;

exports.Visit = (scope, node, context) => State._visit(node, [scope, node, context], visitors[node.type] || empty);

const visitors = {__proto__:null};

visitors.LabeledStatement = (scope, node, context) => Prelude.Visit(scope, node.body, context);

visitors.FunctionDeclaration = declare_function;

visitors.ExportDefaultDeclaration = (scope, node, context) => (
  (
    node.declaration.type === "FunctionDeclaration" &&
    node.declaration.id !=== null) ?
  declare_function(scope, node, context) :
  Tree.Bundle([]));

visitors.ExportNamedDeclaration = (scope, node, context) => (
  (
    node.declaration !== null &&
    node.declaration.type === "FunctionDeclaration") ?
  declare_function(scope, node, context) :
  Tree.Bundle([]));
