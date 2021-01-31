"use strict";

const global_Object_assign = global.Object.assign;
const global_Array_isArray = global.Array.isArray;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Query = require("../query");
const Intrinsic = require("../intrinsic.js");
const Completion = require("../completion.js");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const get_consequent = (node) => node.consequent;

const extend_completion = (completion, nodes, offset) => {
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query.getValuation(nodes[index]);
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
exports.visitClosureBody = (scope, node, context, _dynamic) => (
  context = global_Object_assign(
    {bindings: []},
    context),
  Scope.makeBodyClosureBlock(
    scope,
    (
      !Scope.isStrict(scope) &&
      Query.hasDirectEvalCall(node)),
    (
      node.type === "BlockStatement" ?
      ArrayLite.concat(
        ArrayLite.flatMap(node.body, Query.getDeepHoisting),
        ArrayLite.flatMap(node.body, Query.getShallowHoisting)) :
      []),
    (scope) => Tree.ListStatement(
      [
        Tree.ListStatement(
          ArrayLite.map(
            context.bindings,
            (binding) => Tree.ExpressionStatement(
              Scope.makeWriteExpression(
                scope,
                binding.identifier,
                Scope.makeOpenExpression(scope, binding.box))))),
        (
          node.type === "BlockStatement" ?
          Tree.ListStatement(
            [
              Tree.ListStatement(
                ArrayLite.map(
                node.body,
                (node) => Visit.visitHoistedStatement(scope, node, null))),
              Tree.ListStatement(
                ArrayLite.map(
                  node.body,
                  (node) => Visit.visitStatement(scope, node, null)))]) :
          Tree.ReturnStatement(
            Visit.visitExpression(scope, node, null))),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(void 0))])));

exports.visitBlock = (scope, node, context, _nodes) => (
  context = global_Object_assign(
    {completion: Completion.Empty()},
    context),
  _nodes = node.type === "BlockStatement" ? node.body : [node],
  Scope.makeNormalBlock(
    scope,
    ArrayLite.flatMap(_nodes, Query.getShallowHoisting),
    (scope) => Tree.ListStatement(
      [
        Tree.ListStatement(
          ArrayLite.map(
            _nodes,
            (node) => Visit.visitHoistedStatement(scope, node, null))),
        (
          (
            context.reset &&
            Completion.isLast(context.completion)) ?
          Tree.ExpressionStatement(
            Scope.makeCloseCompletionExpression(
              scope,
              Tree.PrimitiveExpression(void 0))) :
          Tree.ListStatement([])),
        Tree.ListStatement(
          ArrayLite.map(
            _nodes,
            (node, index, nodes) => Visit.visitStatement(
              scope,
              node,
              {completion: extend_completion(context.completion, nodes, index)}))),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(void 0))])));

// interface Context = {
//   completion : Completion,
//   discriminant: Box,
//   matched: Box
// }
exports.visitSwitch = (scope, node, context, _nodes, _offset) => (
  Throw.assert(node.type === "SwitchStatement", null, `Invalid Switch node`),
  context = global_Object_assign(
    {
      completion: Completion.Empty(),
      discriminant: void 0,
      matched: void 0},
    context),
  _nodes = ArrayLite.flatMap(node.cases, get_consequent),
  _offset = 0,
  Scope.makeNormalBlock(
    scope,
    ArrayLite.flatMap(_nodes, Query.getShallowHoisting),
    (scope) => Tree.ListStatement(
      [
        Tree.ListStatement(
          ArrayLite.map(
            _nodes,
            (node) => Visit.visitHoistedStatement(scope, node, null))),
        Tree.ListStatement(
          ArrayLite.map(
            node.cases,
            (node) => [
              Visit.visitCase(
                scope,
                node,
                {
                  completion: context.completion,
                  matched: context.matched,
                  discriminant: context.discriminant,
                  nodes: _nodes,
                  offset: _offset}),
              _offset += node.consequent.length][0])),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(void 0))])));

// interface Context = {
//   discriminant: Box,
//   matched: Box,
//   nodes: [estree.Node],
//   offset: number,
//   completion: Completion
// }
exports.visitCase = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid Case node`),
  (
    node.test === null ?
    Tree.ListStatement(
      [
        Tree.ExpressionStatement(
          Scope.makeCloseExpression(
            scope,
            context.matched,
            Tree.PrimitiveExpression(true))),
        // This lone block could go away but it is kept for consistency reasons...
        // #performance-is-not-an-issue
        Tree.BranchStatement(
          Tree.Branch(
            [],
            Visit.visitCaseConsequent(scope, node, context)))]) :
    // NB1: The test expression is not evaluated if previous match:
    // > switch (123) { case 123: console.log("foo"); case console.log("bar"): console.log("qux"); }
    // foo
    // bar
    // NB2: `===` is used and not `Object.is`:
    // > switch (-0) { case +0: console.log("foo"); }
    // foo
    Tree.IfStatement(
      Tree.ConditionalExpression(
        Scope.makeOpenExpression(scope, context.matched),
        Tree.PrimitiveExpression(true),
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Scope.makeOpenExpression(scope, context.discriminant),
            Visit.visitExpression(scope, node.test, null)),
          Tree.SequenceExpression(
            Scope.makeCloseExpression(
              scope,
              context.matched,
              Tree.PrimitiveExpression(true)),
            Tree.PrimitiveExpression(true)),
          Tree.PrimitiveExpression(false))),
      Tree.Branch(
        [],
        Visit.visitCaseConsequent(scope, node, context)),
      Tree.Branch(
        [],
        Scope.makeCaseBlock(
          scope,
          (scope) => Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0)))))));

// interface Context = {
//   nodes: [estree.Node],
//   offset: number,
//   completion: Completion
// }
Visit.visitCaseConsequent = (scope, node, context) => (
  Throw.assert(node.type === "SwitchCase", null, `Invalid CaseConsequent node`),
  Scope.makeCaseBlock(
    scope,
    (scope) => Tree.ListStatement(
      [
        Tree.ListStatement(
          ArrayLite.map(
            node.consequent,
            (node, index) => Visit.visitStatement(
              scope,
              node,
              {
                completion: extend_completion(
                  context.completion,
                  context.nodes,
                  context.offset + index)}))),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(void 0))])));

// interface Context = {
//   source: "module" | "script" | [Identifier] | null,
// }
exports.visitProgram = (scope, node, context, _variables, _closure1, _closure2) => (
  Throw.assert(node.type === "Program", null, `Invalid Program node`),
  _variables = ArrayLite.concat(
    (
      global_Array_isArray(context.source) ?
      [] :
      [{kind:"param", name:"this", ghost:false, exports:[]}]),
    ArrayLite.flatMap(node.body, Query.getDeepHoisting),
    ArrayLite.flatMap(node.body, Query.getShallowHoisting)),
  // Should only have effects on modules
  ArrayLite.forEach(
    node.body,
    (node) => Query.setVariableExports(node, _variables)),
  _closure1 = (scope, completion) => Tree.ListStatement(
    [
      (
        global_Array_isArray(context.source) ?
        Tree.ListStatement([]) :
        Scope.makeInitializeStatement(
          scope,
          "param",
          "this",
          Intrinsic.makeGrabExpression("aran.globalObjectRecord"))),
      Tree.ListStatement(
        ArrayLite.map(
          node.body,
          (node) => Visit.visitHoistedStatement(scope, node, null))),
      Tree.ListStatement(
        ArrayLite.map(
          node.body,
          (node, index, nodes) => Visit.visitStatement(
            scope,
            node,
            {
              completion: extend_completion(completion, nodes, index)})))]),
  _closure2 = (
    context.source === "module" ?
    (scope) => Tree.ListStatement(
      [
        _closure1(
          scope,
          Completion.Empty()),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(void 0))]) :
    (scope) => Scope.makeBoxStatement(
      scope,
      true,
      "BlockProgramCompletion",
      Tree.PrimitiveExpression(void 0),
      (box) => Tree.ListStatement(
        [
          _closure1(
            Scope.CompletionBindingScope(scope, box),
            Completion.Full()),
          Tree.CompletionStatement(
            Scope.makeOpenExpression(scope, box))]))),
  (
    context.source === "module" ?
    Tree.ModuleProgram(
      ArrayLite.flatMap(
        node.body,
        (node) => Visit.visitLinkStatement(scope, node, null)),
      Scope.makeModuleBlock(scope, _variables, _closure2)) :
    (
      context.source === "script" ?
      Tree.ScriptProgram(
        Scope.makeScriptBlock(scope, _variables, _closure2)) :
      Tree.EvalProgram(
        (
          context.source === null ?
          [] :
          context.source),
        Scope.makeEvalBlock(scope, _variables, _closure2)))));
