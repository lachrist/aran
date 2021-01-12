"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Query = require("../query");
const Intrinsic = require("../intrinsic.js");
const Scope = require("../scope");
const Visit = require("./index.js");

exports._prelude_statement = (scope, node, context) => /* [Prelude] */ (
  node.type in visitors ?
  visitors[node.type](scope, node, context) :
  []);

const visitors = {__proto__:null};

visitors.ImportDeclaration = (scope, node, context, _index) => (
  node.specifiers.length === 0 ?
  [
    Tree.ImportLink(null, node.source.value)] :
  ArrayLite.map(
    node.specifiers,
    (specifier) => Visit.ImportLink_specifier(scope, specifier, {source:node.source.value})));

exports.ImportLink_specifier = (scope, node, context) => /* Prelude */ (
  Throw.assert(
    (
      node.type === "ImportSpecifier" ||
      node.type === "ImportNamespaceSpecifier" ||
      node.type === "ImportDefaultSpecifier"),
    null,
    `Invalid ImportSpecifier node`),
  Tree.ImportLink(
    (
      node.type === "ImportNamespaceSpecifier" ?
      null :
      (
        node.type === "ImportDefaultSpecifier" ?
        "default" :
        node.imported.name)),
    context.source));

visitors.ExportDefaultDeclaration = (scope, node, context) => [
  Tree.ExportLink("default")];

visitors.ExportAllDeclaration = (scope, node, context) => [
  Tree.AggregateLink(null, node.source.value, null)];

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration === null ?
  ArrayLite.map(
    node.specifiers,
    (specifier) => Visit.ExportLink_specifier(
      scope,
      specifier,
      {source: node.source === null ? null : node.source.value})) :
  (
    (
      node.declaration.type === "FunctionDeclaration" ||
      node.declaration.type === "ClassDeclaration") ?
    [
      Tree.ExportLink(node.declaration.id.name)] :
    ArrayLite.map(
      ArrayLite.flatMap(
        node.declaration.declarations,
        (node) => Query._get_pattern_identifier_array(node.id)),
      (identifier) => Tree.ExportLink(identifier))));

exports.ExportLink_specifier = (scope, node, context) => /* Prelude */ (
  Throw.assert(
    node.type === "ExportSpecifier",
    null,
    `Invalid ExportSpecifier node`),
  (
    context.source === null ?
    Tree.ExportLink(node.exported.name) :
    Tree.AggregateLink(
      node.local.name,
      context.source,
      node.exported.name)));
