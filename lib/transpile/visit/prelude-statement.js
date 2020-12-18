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
    Tree._import(null, node.source.value)] :
  ArrayLite.map(
    node.specifiers,
    (specifier) => Visit._import_specifier(scope, specifier, {source:node.source.value})));

exports._import_specifier = (scope, node, context) => /* Prelude */ (
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
        node.imported.name)),
    context.source));

visitors.ExportDefaultDeclaration = (scope, node, context) => [
  Tree._export("default")];

visitors.ExportAllDeclaration = (scope, node, context) => [
  Tree._aggregate(null, node.source.value, null)];

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration === null ?
  ArrayLite.map(
    node.specifiers,
    (specifier) => Visit._export_specifier(
      scope,
      specifier,
      {source: node.source === null ? null : node.source.value})) :
  (
    (
      node.declaration.type === "FunctionDeclaration" ||
      node.declaration.type === "ClassDeclaration") ?
    [
      Tree._export(node.declaration.id.name)] :
    ArrayLite.map(
      ArrayLite.flatMap(
        node.declaration.declarations,
        (node) => Query._get_pattern_identifier_array(node.id)),
      (identifier) => Tree._export(identifier))));

exports._export_specifier = (scope, node, context) => /* Prelude */ (
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
