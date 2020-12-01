"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../../tree.js")._toggle_debug_mode();

const Parse = require("../../../parse.js");
const Tree = require("../../../tree.js");
const Lang = require("../../../lang");
const State = require("../../state.js");
const Completion = require("../../completion.js");
const Scope = require("../../scope");
const Body = require("./body.js");

// (
//   node.type === "LabeledStatement" ?
//   Statement.Visit(
//     scope,
//     node.body,
//     {
//       __proto__: context,
//       completion: Completion._register_label(context.completion)}) :
//   (
//     node.type === "BlockStatement" ?
//     Tree.Lone(
//       [],
//       Scope.BLOCK(
//         scope,
//         null,
//         [],
//         (scope) => Common.Body(scope, nodes, context.completion))) :
//     (
//       node.type === "EmptyStatement" ?
//       Tree.Bundle([]) :
//       Assert.fail()))

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  const Statement = {
    _hoisted_context: {
      type: "hoisted",
      completion: Completion._make_empty()},
    _default_context: {
      type: "default",
      completion: Completion._make_empty()},
    Visit: (scope, node, context) => (
      node.type === "EmptyStatement" ?
      Tree.Lift(
        Tree.primitive("*empty*")) :
      (
        Assert.deepEqual(node.type, "ExpressionStatement"),
        Assert.deepEqual(node.expression.type, "Literal"),
        Assert.deepEqual(typeof node.expression.value, "string"),
        Tree.Lift(
          Tree.primitive(
            (
              context.type +
              (
                Completion._is_last(context.completion) ?
                "!" :
                ".") +
              node.expression.value)))))};
  Body._resolve_circular_dependencies(Statement);
  Lang._match_block(
    Scope.MODULE(
      false,
      [],
      (scope) => Body.Body(
        scope,
        Parse.script(`"foo"; "bar"; ; ;`).body,
        Completion._make_full())),
    Lang.PARSE_BLOCK(`{
      "hoisted.foo";
      "hoisted.bar";
      "*empty*";
      "*empty*";
      "default.foo";
      "default!bar";
      "*empty*";
      "*empty*"; }`),
    Assert);
  Lang._match_block(
    Scope.MODULE(
      false,
      [],
      (scope) => Body.Switch(
        scope,
        Parse.script(`
          switch (123) {
            case 456: "foo";
            case 789: "bar"; }`).body[0].cases,
        Completion._make_full(),
        (scope, node, callback) => callback(scope))),
    Lang.PARSE_BLOCK(`{
      "hoisted.foo";
      "hoisted.bar";
      "default.foo";
      "default!bar"; }`),
    Assert);

}, []);
