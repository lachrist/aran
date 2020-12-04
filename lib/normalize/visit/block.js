"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Query = require("../query");
const Completion = require("../completion.js");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const nameof = {
  __proto__: null,
  "script": "SCRIPT",
  "module": "MODULE",
  "eval": "EVAL"};

const get_consequent = (node) => node.consequent;

const extend_completion = (completion, nodes, offset) => {
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query._get_valuation(nodes[index]);
    if (valuation !== false) {
      // console.assert(valuation === null || valuation === true || typeof valuation === "string");
      return Completion._anticipate(completion, valuation);
    }
  }
  return completion;
};

const hoisted = (node) => (
  node.type === "FunctionDeclaration" ||
  node.type === "ImportDeclaration");

const hoist = (node) => (
  (
    node.type === "FunctionDeclaration" ||
    node.type === "ImportDeclaration") ?
  [node] :
  (
    node.type === "LabeledStatement" ?
    hoist(node.body) :
    (
      (
        (
          node.type === "ExportDefaultDeclaration" ||
          node.type === "ExportNamedDeclaration") &&
        node.declaration !== null &&
        node.declaration.type === "FunctionDeclaration" &&
        node.declaration.id !== null) ?
      [node.declaration] :
      [])));

exports.CLOSURE_BODY = (scope, node, context, _dynamic) => (
  context = global_Object_assign(
    {bindings:[]},
    context),
  Scope.CLOSURE_BODY(
    scope,
    (
      !Scope._is_strict(scope) &&
      Query._has_direct_eval_call(node.type === "BlockStatement" ? node.body : [node])),
    (
      node.type === "BlockStatement" ?
      ArrayLite.concat(
        Query._get_closure_hoisting(node.body),
        Query._get_block_hoisting(node.body)) :
      []),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            context.bindings,
            (binding) => Tree.Lift(
              Scope.write(
                scope,
                binding.identifier,
                Scope.get(scope, binding.box))))),
        (
          node.type === "BlockStatement" ?
          Tree.Bundle(
            [
              Tree.Bundle(
                ArrayLite.map(
                ArrayLite.flatMap(node.body, hoist),
                (node) => Visit.HoistedStatement(scope, node, null))),
              Tree.Bundle(
                ArrayLite.map(
                  ArrayLite.filterOut(node.body, hoisted),
                  (node) => Visit.Statement(scope, node, null)))]) :
          Tree.Return(
            Visit.expression(scope, node, null)))])));

exports.BLOCK = (scope, node, context) => (
  context = global_Object_assign(
    {
      completion: Completion._make_empty(),
      with: null },
    context),
  _nodes = (
    node.type === "BlockStatement" ?
    node.body :
    [node]),
  Scope.BLOCK(
    scope,
    context.with,
    Query._get_block_hoisting(_nodes),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.flatMap(_nodes, hoist),
            (node) => Visit.HoistedStatement(scope, node, null))),
        (
          (
            context.reset &&
            Completion._is_last(context.completion)) ?
          Tree.Lift(
            Scope.set_completion(
              scope,
              Tree.primitive(void 0))) :
          Tree.Bundle([])),
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.filterOut(_nodes, hoisted),
            (node, index, nodes) => Visit.Statement(
              scope,
              node,
              {completion: extend_completion(completion, nodes, index)})))])));

exports.SWITCH = (scope, node, context, _nodes, _offset) => (
  Throw.assert(node.type === "SwitchStatement", null, `Invalid SWITCH node`),
  context = global_Object_assign(
    {
      discriminant: null,
      matched: null},
    context),
  _nodes = ArrayLite.flatMap(node.cases, get_consequent),
  _offset = 0,
  Scope.BLOCK(
    scope,
    null,
    Query._get_block_hoisting(_nodes),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.flatMap(_nodes, hoist),
            (node) => Visit.HoistedStatement(scope, node, null))),
        Tree.Bundle(
          ArrayLite.map(
            node.cases,
            (node) => [
              Visit.Case(
                scope,
                node,
                {
                  completion: context.completion,
                  matched: context.matched,
                  discriminant: context.discriminant,
                  nodes: _nodes,
                  offset: _offset}),
              _offset += node.consequent.length][0]))])));

exports.Case = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid SwitchCase node`),
  (
    node.test === null ?
    Tree.Bundle(
      [
        Tree.Lift(
          Scope.set(
            scope,
            context.matched,
            Tree.primitive(true))),
        // This lone block could go away but it is kept for consistency reasons...
        // #performance-is-not-an-issue
        Tree.Lone(
          [],
          Visit.CASE(scope, node, context))]) :
    // NB1: The test expression is not evaluated if previous match:
    // > switch (123) { case 123: console.log("foo"); case console.log("bar"): console.log("qux"); }
    // foo
    // bar
    // NB2: `===` is used and not `Object.is`:
    // > switch (-0) { case +0: console.log("foo"); }
    // foo
    Tree.If(
      [],
      Tree.conditional(
        Scope.get(scope, context.matched),
        Tree.primitive(true),
        Tree.conditional(
          Tree.binary(
            "===",
            Scope.get(scope, context.discriminant),
            Visit.expression(scope, node.test, null)),
          Tree.sequence(
            Scope.set(
              scope,
              context.matched,
              Tree.primitive(true)),
            Tree.primitive(true)),
          Tree.primitive(false))),
      Visit.CASE(scope, node, context),
      Scope.CASE(
        scope,
        (scope) => Tree.Bundle([])))));

exports.CASE = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid CASE node`),
  Scope.CASE(
    scope,
    (scope) => Tree.Bundle(
      ArrayLite.map(
        node.consequent,
        (node, index) => (
          hoisted(node) ?
          Tree.Bundle([]) :
          Visit.Statement(
            scope,
            node,
            {
              completion: extend_completion(
                context.completion,
                context.nodes,
                context.offset + index)}))))));

exports.PROGRAM = (scope, node, context) => (
  Throw.assert(node.type === "Program", null, `Invalid PROGRAM node`),
  context = global_Object_assign(
    {
      source: "script"},
    context),
  scope = (
    (
      context.source === "module" ||
      Query._has_use_strict_directive(node.body)) ?
    Scope._use_strict(scope) :
    scope),
  Scope[nameof[context.source]](
    scope,
    (
      context.source !== "module" &&
      node.body[node.body.length - 1].type !== "ExpressionStatement"),
    ArrayLite.concat(
      Query._get_closure_hoisting(node.body),
      Query._get_block_hoisting(node.body)),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.flatMap(node.body, hoist),
            (node) => Visit.HoistedStatement(scope, node, null))),
        (
          context.source === "module" ?
          Tree.Bundle(
            ArrayLite.map(
              ArrayLite.filterOut(node.body, hoisted),
              (node) => Visit.Statement(scope, node, null))) :
          (
            node.body[node.body.length - 1].type !== "ExpressionStatement") ?
            Tree.Bundle(
              [
                Tree.Bundle(
                  ArrayLite.map(
                    ArrayLite.filterOut(node.body, hoisted),
                    (node, index, nodes) => Visit.Statement(
                      scope,
                      node,
                      {
                        completion: extend_completion(Completion._make_full(), nodes, index)}))),
                Tree.Return(
                  Scope.get_completion(scope))]) :
            Tree.Bundle(
              ArrayLite.map(
                ArrayLite.filterOut(node.body, hoisted),
                (node, index, nodes) => (
                  index === nodes.length - 1 ?
                  // console.assert(node.type === "ExpressionStatement")
                  Tree.Return(
                    Visit.expression(scope, node.expression, null)) :
                  Visit.Statement(scope, node, null)))))])));
