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
  "eval": "EVAL",
  "script": "SCRIPT",
  "module": "MODULE"};

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

// interface Context = {
//   bindings: [{
//     identifier: Identifier,
//     box: Box
//   }]
// }
exports.CLOSURE_BODY = (scope, node, context, _dynamic) => (
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
                node.body,
                (node) => Visit.HoistedStatement(scope, node, null))),
              Tree.Bundle(
                ArrayLite.map(
                  node.body,
                  (node) => Visit.Statement(scope, node, null)))]) :
          Tree.Return(
            Visit.expression(scope, node, null)))])));

exports.BLOCK = (scope, node, context, _nodes) => (
  context = global_Object_assign(
    {completion: Completion._make_empty()},
    context),
  _nodes = node.type === "BlockStatement" ? node.body : [node],
  Scope.BLOCK(
    scope,
    ArrayLite.flatMap(_nodes, Query._get_shallow_hoisting),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            _nodes,
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
  _nodes = ArrayLite.flatMap(node.cases, get_consequent),
  _offset = 0,
  Scope.BLOCK(
    scope,
    ArrayLite.flatMap(_nodes, Query._get_shallow_hoisting),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            _nodes,
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

// interface Context = {
//   nodes: [estree.Node],
//   offset: number,
//   completion: Completion
// }
exports.CASE = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid CASE node`),
  Scope.CASE(
    scope,
    (scope) => Tree.Bundle(
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
  Tree._program(
    ArrayLite.flatMap(
      node.body,
      (node) => Visit._prelude_statement(scope, node, null)),
    Scope[nameof[context.source]](
      scope,
      (
        _variables = ArrayLite.concat(
          ArrayLite.flatMap(node.body, Query._get_deep_hoisting),
          ArrayLite.flatMap(node.body, Query._get_shallow_hoisting)),
        ArrayLite.forEach(
          node.body,
          (node) => Query._complete_exports(node, _variables)),
        _variables),
      (scope) => (
        (
          (closure) => (
            (
              context.source === "module" ||
              node.body[node.body.length - 1].type === "ExpressionStatement") ?
            closure(scope) :
            Scope.Box(
              scope,
              true,
              "BlockProgramCompletion",
              Tree.primitive(void 0),
              (box) => closure(
                Scope._extend_completion(scope, box)))))
        (
          (scope) => Tree.Bundle(
            [
              Tree.Bundle(
                ArrayLite.map(
                  node.body,
                  (node) => Visit.HoistedStatement(scope, node, null))),
              (
                context.source === "module" ?
                Tree.Bundle(
                  ArrayLite.map(
                    node.body,
                    (node) => Visit.Statement(scope, node, null))) :
                Tree.Bundle(
                  [
                    Tree.Bundle(
                      ArrayLite.map(
                        node.body,
                        (node, index, nodes) => Visit.Statement(
                          scope,
                          node,
                          {completion: extend_completion(Completion._make_full(), nodes, index)}))),
                    (
                      Scope._has_completion(scope) ?
                      Tree.Return(
                        Scope.get_completion(scope)) :
                      Tree.Bundle([]))]))]))))));
