"use strict";

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const State = require("../state.js");
const Builtin = require("../builtin.js");
const Scope = require("../scope");
const Visit = require("./visit.js");

exports.HoistedStatement = (scope, node, context) => visitors[node.type](scope, node, context);

const visitors = {__proto__:null};

visitors.FunctionDeclaration = (scope, node, context) => Tree.Lift(
  Scope.initialize(
    scope,
    "function",
    node.id.name,
    Visit.closure(
      scope,
      node,
      null)));

visitors.ImportDeclaration = (scope, node, context) => (
  (
    node.specifiers.length === 1 &&
    node.specifiers[0].type === "ImportNamespaceSpecifier") ?
  Visit.StraightImportSpecifier(scope, node.specifiers[0], null) :
  Scope.ImportBox(
    scope,
    node.source.value,
    (box) => Tree.Bundle(
      ArrayLite.map(
        node.specifiers,
        (node) => Visit.ImportSpecifier(scope, node, {module:box})))));

exports.ImportSpecifier = (scope, node, context) => (
  Throws.assert(
    (
      node.type === "ImportSpecifier" ||
      node.type === "ImportNamespaceSpecifier" ||
      node.type === "ImportDefaultSpecifier"),
    null,
    `Invalid ImportSpecifier node`),
  Tree.Lift(
    Scope.initialize(
      scope,
      "import",
      node.local.name,
      (
        node.type === "ImportNamespaceSpecifier" ?
        Scope.get(scope, context.module) :
        Builtin.get(
          Scope.get(scope, context.module),
          (
            node.type === "ImportSpecifier" ?
            Visit.key(scope, node.imported, {computed:false}) :
            Tree.primitive("default")))))));

exports.StraightImportSpecifier = (scope, node, context) => (
  Throw.assert(
    node.type === "ImportNamespaceSpecifier",
    null,
    `Invalid StraightImportSpecifier node`),
  Scope.ImportInitialize(
    scope,
    node.local.name,
    node.source.value));
