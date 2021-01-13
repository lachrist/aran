"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Query = require("../query");
const Intrinsic = require("../intrinsic.js");
const Completion = require("../completion.js");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const nameof = {
  __proto__: null,
  "eval": "EVAL",
  "script": "SCRIPT",
  "module": "MODULE"};

const get_consequent = (node) => node.consequent;

const extend_completion = (completion, nodes, offset) => {
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query._get_valuation(nodes[index]);
    if (valuation !== false) {
      // console.assert(valuation === null || valuation === true || typeof valuation === "string");
      return Completion.anticipateValuation(completion, valuation);
    }
  }
  return completion;
};

// interface Context = {
//   bindings: [{
//     identifier: Identifier,
//     box: Box
//   }]
// }
exports.CLOSURE_BODY = (scope, node, context, _dynamic) => (
  context = global_Object_assign(
    {bindings: []},
    context),
  Scope.CLOSURE_BODY(
    scope,
    (
      !Scope._is_strict(scope) &&
      Query._has_direct_eval_call(node)),
    (
      node.type === "BlockStatement" ?
      ArrayLite.concat(
        ArrayLite.flatMap(node.body, Query._get_deep_hoisting),
        ArrayLite.flatMap(node.body, Query._get_shallow_hoisting)) :
      []),
    (scope) => Tree.BundleStatement(
      [
        Tree.BundleStatement(
          ArrayLite.map(
            context.bindings,
            (binding) => Tree.ExpressionStatement(
              Scope.write(
                scope,
                binding.identifier,
                Scope.get(scope, binding.box))))),
        (
          node.type === "BlockStatement" ?
          Tree.BundleStatement(
            [
              Tree.BundleStatement(
                ArrayLite.map(
                node.body,
                (node) => Visit.HoistedStatement(scope, node, null))),
              Tree.BundleStatement(
                ArrayLite.map(
                  node.body,
                  (node) => Visit.Statement(scope, node, null)))]) :
          Tree.ReturnStatement(
            Visit.expression(scope, node, null)))])));

exports.Block = (scope, node, context, _nodes) => (
  context = global_Object_assign(
    {
      completion: Completion.Empty(),
      labels: []},
    context),
  _nodes = node.type === "BlockStatement" ? node.body : [node],
  Scope.Block(
    scope,
    context.labels,
    ArrayLite.flatMap(_nodes, Query._get_shallow_hoisting),
    (scope) => Tree.BundleStatement(
      [
        Tree.BundleStatement(
          ArrayLite.map(
            _nodes,
            (node) => Visit.HoistedStatement(scope, node, null))),
        (
          (
            context.reset &&
            Completion.isLast(context.completion)) ?
          Tree.ExpressionStatement(
            Scope.set_completion(
              scope,
              Tree.PrimitiveExpression(void 0))) :
          Tree.BundleStatement([])),
        Tree.BundleStatement(
          ArrayLite.map(
            _nodes,
            (node, index, nodes) => Visit.Statement(
              scope,
              node,
              {completion: extend_completion(context.completion, nodes, index)})))])));

// interface Context = {
//   completion : Completion,
//   discriminant: Box,
//   matched: Box
// }
exports.SWITCH = (scope, node, context, _nodes, _offset) => (
  Throw.assert(node.type === "SwitchStatement", null, `Invalid SWITCH node`),
  context = global_Object_assign(
    {
      completion: Completion.Empty(),
      discriminant: void 0,
      matched: void 0,
      labels: []},
    context),
  _nodes = ArrayLite.flatMap(node.cases, get_consequent),
  _offset = 0,
  Scope.Block(
    scope,
    context.labels,
    ArrayLite.flatMap(_nodes, Query._get_shallow_hoisting),
    (scope) => Tree.BundleStatement(
      [
        Tree.BundleStatement(
          ArrayLite.map(
            _nodes,
            (node) => Visit.HoistedStatement(scope, node, null))),
        Tree.BundleStatement(
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

// interface Context = {
//   discriminant: Box,
//   matched: Box,
//   nodes: [estree.Node],
//   offset: number,
//   completion: Completion
// }
exports.Case = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid SwitchCase node`),
  (
    node.test === null ?
    Tree.BundleStatement(
      [
        Tree.ExpressionStatement(
          Scope.set(
            scope,
            context.matched,
            Tree.PrimitiveExpression(true))),
        // This lone block could go away but it is kept for consistency reasons...
        // #performance-is-not-an-issue
        Tree.BlockStatement(
          Visit.CASE(scope, node, context))]) :
    // NB1: The test expression is not evaluated if previous match:
    // > switch (123) { case 123: console.log("foo"); case console.log("bar"): console.log("qux"); }
    // foo
    // bar
    // NB2: `===` is used and not `Object.is`:
    // > switch (-0) { case +0: console.log("foo"); }
    // foo
    Tree.IfStatement(
      Tree.ConditionalExpression(
        Scope.get(scope, context.matched),
        Tree.PrimitiveExpression(true),
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Scope.get(scope, context.discriminant),
            Visit.expression(scope, node.test, null)),
          Tree.SequenceExpression(
            Scope.set(
              scope,
              context.matched,
              Tree.PrimitiveExpression(true)),
            Tree.PrimitiveExpression(true)),
          Tree.PrimitiveExpression(false))),
      Visit.CASE(scope, node, context),
      Scope.CASE(
        scope,
        (scope) => Tree.BundleStatement([])))));

// interface Context = {
//   nodes: [estree.Node],
//   offset: number,
//   completion: Completion
// }
exports.CASE = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid CASE node`),
  Scope.CASE(
    scope,
    (scope) => Tree.BundleStatement(
      ArrayLite.map(
        node.consequent,
        (node, index) => Visit.Statement(
          scope,
          node,
          {
            completion: extend_completion(
              context.completion,
              context.nodes,
              context.offset + index)})))));

// interface Context = {
//   source: "eval" | "module" | "script",
//   local: (Variable, boolean) => undefined,
//   global: (Variable) => undefined
// }
exports._program = (scope, node, context, _variables) => (
  Throw.assert(node.type === "Program", null, `Invalid PROGRAM node`),
  Tree.Program(
    ArrayLite.flatMap(
      node.body,
      (node) => Visit._prelude_statement(scope, node, null)),
    Scope[nameof[context.source]](
      scope,
      (
        _variables = ArrayLite.concat(
          (
            context.local ?
            [] :
            [{kind:"param", name:"this", ghost:false, exports:[]}]),
          ArrayLite.flatMap(node.body, Query._get_deep_hoisting),
          ArrayLite.flatMap(node.body, Query._get_shallow_hoisting)),
        ArrayLite.forEach(
          node.body,
          (node) => Query._completeExportLinks(node, _variables)),
        _variables),
      (scope) => (
        (
          (closure) => (
            (
              context.source === "module" ||
              node.body.length === 0 ||
              node.body[node.body.length - 1].type === "ExpressionStatement") ?
            closure(scope) :
            Scope.Box(
              scope,
              true,
              "BlockProgramCompletion",
              Tree.PrimitiveExpression(void 0),
              (box) => closure(
                Scope._extend_completion(scope, box)))))
        (
          (scope) => Tree.BundleStatement(
            [
              (
                context.local ?
                Tree.BundleStatement([]) :
                Scope.Initialize(
                  scope,
                  "param",
                  "this",
                  Intrinsic.grab("aran.globalObjectRecord"))),
              Tree.BundleStatement(
                ArrayLite.map(
                  node.body,
                  (node) => Visit.HoistedStatement(scope, node, null))),
              (
                context.source === "module" ?
                Tree.BundleStatement(
                  ArrayLite.map(
                    node.body,
                    (node) => Visit.Statement(scope, node, null))) :
                (
                  node.body.length === 0 ?
                  Tree.ReturnStatement(
                    Tree.PrimitiveExpression(void 0)) :
                  Tree.BundleStatement(
                    [
                      Tree.BundleStatement(
                        ArrayLite.map(
                          node.body,
                          (node, index, nodes) => Visit.Statement(
                            scope,
                            node,
                            {completion: extend_completion(Completion.Full(), nodes, index)}))),
                      (
                        Scope._has_completion(scope) ?
                        Tree.ReturnStatement(
                          Scope.get_completion(scope)) :
                        Tree.BundleStatement([]))])))]))))));
