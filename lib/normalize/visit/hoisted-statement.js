"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Builtin = require("../builtin.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const is_import_namespace_specifier_node = (node) => node.type === "ImportNamespaceSpecifier";

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

visitors.ImportDeclaration = (scope, node, context, _index) => (
  Throw.assert(node.type === "ImportDeclaration", null, `Invalid ImportDeclaration node`),
  (
    ArrayLite.some(node.specifiers, is_import_namespace_specifier_node) ?
    Tree.Bundle(
      [
        Visit.ImportNamespaceSpecifier(
          scope,
          ArrayLite.find(node.specifiers, is_import_namespace_specifier_node),
          {source:node.source.value}),
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.filterOut(node.specifiers, is_import_namespace_specifier_node),
            (child) => Visit.ImportRegularSpecifier(
              scope,
              child,
              {
                module: (scope) => Scope.read(
                  scope,
                  ArrayLite.find(node.specifiers, is_import_namespace_specifier_node).local.name)})))]) :
    Scope.ImportBox(
      scope,
      "HoistedStatementImportDeclarationModule",
      node.source.value,
      (box) => Tree.Bundle(
        ArrayLite.map(
          node.specifiers,
          (node) => Visit.ImportRegularSpecifier(
            scope,
            node,
            {
              module: (scope) => Scope.get(scope, box)}))))));

exports.ImportRegularSpecifier = (scope, node, context) => (
  Throw.assert(
    (
      node.type === "ImportSpecifier" ||
      node.type === "ImportDefaultSpecifier"),
    null,
    `Invalid ImportRegularSpecifier node`),
  Tree.Lift(
    Scope.initialize(
      scope,
      "import",
      node.local.name,
      Builtin.get(
        context.module(scope),
        (
          node.type === "ImportSpecifier" ?
          Visit.key(scope, node.imported, {computed:false}) :
          Tree.primitive("default")),
        null))));

exports.ImportNamespaceSpecifier = (scope, node, context) => (
  Throw.assert(
    node.type === "ImportNamespaceSpecifier",
    null,
    `Invalid ImportNamespaceSpecifier node`),
  Scope.ImportInitialize(
    scope,
    node.local.name,
    context.source));
