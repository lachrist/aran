"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Builtin = require("../builtin.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const is_import_namespace_specifier_node = (node) => node.type === "ImportNamespaceSpecifier";

exports._prelude_statement = (scope, node, context) => visitors[node.type](scope, node, context);

const visitors = {__proto__:null};

visitors.ExportNamedDeclaration = (scope, node, context) => 123;

visitors.ExportDefaultDeclaration = (scope, node, context) => (
  node.declaration 

visitors.ExportAllDeclaration = (scope);

visitors.ImportDeclaration = (scope, node, context, _index) => (
  node.specifiers.length === 0 ?
  Tree.Lift(
    Tree.import(node.source.value)) :
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
    Scope.Box(
      scope,
      false,
      "HoistedStatementImportDeclarationModule",
      Tree.import(node.source.value),
      (box) => Tree.Bundle(
        ArrayLite.map(
          node.specifiers,
          (node) => Visit.ImportRegularSpecifier(
            scope,
            node,
            {
              module: (scope) => Scope.get(scope, box)}))))));

exports._import_specifier = (scope, node, context) => (
  Throw.assert(
    (
      node.type === "ImportSpecifier" ||
      node.type === "ImportNamespaceSpecifier" ||
      node.type === "ImportDefaultSpecifier"),
    null,
    `Invalid ImportSpecifier node`),
  Tree._import(
    (
      node.type === "ImportNamespaceSpecifier" ?
      null :
      (
        node.type === "ImportDefaultSpecifier" ?
        "default" :
        node.imported.name))));

exports._export_specifier = (scope, node, context) => (
  Throw.assert(
    node.type === "ExportSpecifier",
    null,
    `Invalid ExportSpecifier node`),
  (
    context.source === null ?
    Tree._export(node.exported.name) :
    Tree._aggregate(
      node.local.name,
      context.source,
      node.exported.name)));




exports.ImportSpecifier = (scope, node, context) => (
  Throw.assert(node.type === "ImportSpecifier", null, `Invalid ImportSpecifier node`),
  Tree._import("default", context.source));

exports.ImportNamespaceSpecifier = (scope, node, context) => (
  Throw.assert(node.type === "ImportNamespaceSpecifier", null, `Invalid ImportNamespaceSpecifier node`),
  Tree._import("default")

exports.ImportRegularSpecifier = (scope, node, context) => (
  Throw.assert(
    (
      node.type === "ImportSpecifier" ||
      node.type === "ImportDefaultSpecifier"),
    null,
    `Invalid ImportRegularSpecifier node`),
  Tree._import(
    (
      node.type === "ImportDefaultSpecifier" ?


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
  Tree.Lift(
    Scope.initialize(
      scope,
      "import",
      node.local.name,
      Tree.import(context.source))));
