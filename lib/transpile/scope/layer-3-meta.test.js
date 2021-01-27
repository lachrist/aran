"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Meta = require("./layer-3-meta.js");

State.runSession({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // _test_box //
  Lang.match(
    Meta.makeOpenExpression(
      Meta.RootScope(),
      Meta.TestBox("foo")),
    Lang.parseExpression(`foo`),
    Assert);
  Lang.match(
    Tree.ExpressionStatement(
      Meta.makeCloseExpression(
        Meta.RootScope(),
        Meta.TestBox("foo"),
        Tree.PrimitiveExpression(123))),
    Lang.parseSingleStatement(`foo = 123;`),
    Assert);
  // _primitive_box //
  Lang.match(
    Meta.makeOpenExpression(
      Meta.RootScope(),
      Meta.PrimitiveBox(123)),
    Lang.parseExpression(`123`),
    Assert);
  // _intrinsic_box //
  Lang.match(
    Meta.makeOpenExpression(
      Meta.RootScope(),
      Meta.IntrinsicBox("eval")),
    Lang.parseExpression(`#eval`),
    Assert);
  //////////////
  // Writable //
  //////////////
  // makeBoxStatement //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Meta.makeBoxStatement(
        scope,
        true,
        "x",
        Tree.PrimitiveExpression(123),
        (box) => Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Meta.makeCloseExpression(
                scope,
                box,
                Tree.PrimitiveExpression(456))),
            Tree.ExpressionStatement(
              Meta.makeOpenExpression(scope, box)),
            Tree.CompletionStatement(
              Tree.PrimitiveExpression("completion"))]))),
    Lang.parseBlock(`{
      let $_x_1_1;
      $_x_1_1 = 123;
      $_x_1_1 = 456;
      $_x_1_1;
      completion "completion"; }`),
    Assert);
  // makeBoxExpression //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              true,
              "x",
              Tree.PrimitiveExpression(123),
              (box) => Tree.SequenceExpression(
                Meta.makeCloseExpression(
                  scope,
                  box,
                  Tree.PrimitiveExpression(456)),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      let $_x_1_1;
      ($_x_1_1 = 123, ($_x_1_1 = 456, $_x_1_1));
      completion "completion"; }`),
    Assert);
  // DynamicScope //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              true,
              "x",
              Tree.PrimitiveExpression(123),
              (box) => Meta.makeOpenExpression(
                Meta.DynamicScope(scope, [], null), box))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      let $_x_1_1;
      ($_x_1_1 = 123, $_x_1_1);
      completion "completion"; }`),
    Assert);
  // duplicate //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              true,
              "x",
              Tree.PrimitiveExpression(123),
              (box) => Meta.makeOpenExpression(scope, box))),
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              true,
              "x",
              Tree.PrimitiveExpression(456),
              (box) => Meta.makeOpenExpression(scope, box))),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      let $_x_1_1, $_x_1_2;
      ($_x_1_1 = 123, $_x_1_1);
      ($_x_1_2 = 456, $_x_1_2);
      completion "completion"; }`),
    Assert);
  ////////////////
  // Unwritable //
  ////////////////
  // Intrinsic //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              false,
              "x",
              Tree.IntrinsicExpression("eval"),
              (box) => (
                Assert.throws(
                  () => Meta.makeCloseExpression(
                    scope,
                    box,
                    Tree.PrimitiveExpression(123)),
                  new Error("Cannot set a Intrinsic box")),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      #eval;
      completion "completion"; }`),
    Assert);
  // Primitive //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              false,
              "x",
              Tree.PrimitiveExpression(123),
              (box) => (
                Assert.throws(
                  () => Meta.makeCloseExpression(
                    scope,
                    box,
                    Tree.PrimitiveExpression(456)),
                  new Error("Cannot set a Primitive box")),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      123;
      completion "completion"; }`),
    Assert);
  // Throw (no prefix) //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              false,
              "x",
              Tree.ThrowExpression(
                Tree.PrimitiveExpression(123)),
              (box) => (
                Assert.throws(
                  () => Meta.makeCloseExpression(
                    scope,
                    box,
                    Tree.PrimitiveExpression(456)),
                  new Error("Cannot set a Primitive box")),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      (throw 123, "dummy-primitive-box-value");
      completion "completion"; }`),
    Assert);
  // Throw (prefix) //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              false,
              "x",
              Tree.SequenceExpression(
                Tree.PrimitiveExpression(123),
                Tree.ThrowExpression(
                  Tree.PrimitiveExpression(456))),
              (box) => (
                Assert.throws(
                  () => Meta.makeCloseExpression(
                    scope,
                    box,
                    Tree.PrimitiveExpression(789)),
                  new Error("Cannot set a Primitive box")),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      (
        (
          123,
          throw 456),
        "dummy-primitive-box-value");
      completion "completion"; }`),
    Assert);
  // Sequence (dynamic, no prefix) //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              false,
              "x",
              Tree.SequenceExpression(
                Tree.PrimitiveExpression(123),
                Tree.UnaryExpression(
                  "!",
                  Tree.PrimitiveExpression(456))),
              (box) => (
                Assert.throws(
                  () => Meta.makeCloseExpression(
                    scope,
                    box,
                    Tree.PrimitiveExpression(789)),
                  new Error("Cannot set a constant meta box")),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      let _x;
      (
        _x = (123, !456),
        _x);
      completion "completion"; }`),
    Assert);
  // Sequence (static, prefix) //
  Lang.match(
    Meta.makeBlock(
      Meta.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Meta.makeBoxExpression(
              scope,
              false,
              "x",
              Tree.SequenceExpression(
                Tree.PrimitiveExpression(123),
                Tree.SequenceExpression(
                  Tree.PrimitiveExpression(456),
                  Tree.PrimitiveExpression(789))),
              (box) => (
                Assert.throws(
                  () => Meta.makeCloseExpression(
                    scope,
                    box,
                    Tree.PrimitiveExpression(789)),
                  new Error("Cannot set a Primitive box")),
                Meta.makeOpenExpression(scope, box)))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      (
        (
          123,
          456),
        789);
      completion "completion"; }`),
    Assert);
});

// Write //
// Lang.match(Meta.makeBlock(Meta.RootScope(), ["kind"], (scope) => {
//   Meta.declare(scope, {kind:"kind", ghost:false, name:"y"});
//   return Tree.ListStatement([
//     Tree.ExpressionStatement(Meta.initialize(scope, "kind", "y").initialize(Tree.PrimitiveExpression(123))),
//     Tree.ExpressionStatement(Meta.makeBoxExpression(scope, false, "x", Meta.makeLookupExpression(scope, "y", {
//       on_miss: () => Assert.fail(),
//       on_static_dead_hit: () => Assert.fail(),
//       on_static_live_hit: (variable, read, write) => write(Tree.PrimitiveExpression(456)),
//       on_dynamic_frame: () => Assert.fail()
//     }), (box) => {
//       Assert.throws(() => Meta.makeCloseExpression(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a Primitive box"));
//       return Meta.makeOpenExpression(scope, box);
//     })),
//     Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
//   ]);
// }), Lang.parseBlock(`{
//   let $$y;
//   $$y = 123;
//   ($$y = 456, void 0);
//   completion "completion";
// }`), Assert);
// // Read Writable //
// Lang.match(Meta.makeBlock(Meta.RootScope(), [], (scope) => {
//   Meta.declare_base(scope, "let", "y");
//   return Tree.ListStatement([
//     Tree.ExpressionStatement(Meta.initialize_base(scope, "y", Tree.PrimitiveExpression(123)).value),
//     Meta.makeBoxStatement(scope, "x", false, Meta.makeLookupExpression_base(scope, "y", "ctx", {
//       on_miss: () => Assert.fail(),
//       on_dead_hit: () => Assert.fail(),
//       on_live_hit: (context, writable, access) => {
//         Assert.deepEqual(context, "ctx");
//         Assert.deepEqual(writable, true);
//         return access(null);
//       },
//       on_dynamic_frame: () => Assert.fail()
//     }), (box) => {
//       Assert.throws(() => Meta.makeCloseExpression(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a constant meta box"));
//       return Tree.ExpressionStatement(Meta.makeOpenExpression(scope, box));
//     })
//   ]);
// }), Lang.parseBlock(`{
//   let $$y, $_x;
//   $$y = 123;
//   $_x = $$y;
//   $_x;
// }`), Assert);
// // Read Base Unwritable //
// Lang.match(Meta.makeBlock(Meta.RootScope(), (scope) => {
//   Meta.declare_base(scope, "y", false);
//   return Tree.ListStatement([
//     Tree.ExpressionStatement(Meta.initialize_base(scope, "y", Tree.PrimitiveExpression(123)).value),
//     Tree.ExpressionStatement(Meta.makeBoxExpression(scope, "x", false, Meta.makeLookupExpression_base(scope, "y", "ctx", {
//       on_miss: () => Assert.fail(),
//       on_dead_hit: () => Assert.fail(),
//       on_live_hit: (context, writable, access) => {
//         Assert.deepEqual(context, "ctx");
//         Assert.deepEqual(writable, false);
//         return access(null);
//       },
//       on_dynamic_frame: () => Assert.fail()
//     }), (box) => {
//       Assert.throws(() => Meta.makeCloseExpression(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a non-meta box"));
//       return Meta.makeOpenExpression(scope, box);
//     }))
//   ]);
// }), Lang.parseBlock(`{
//   let $$y;
//   $$y = 123;
//   $$y;
// }`), Assert);
// // Read Meta Unwritable //
// Lang.match(Meta.makeBlock(Meta.RootScope(), (scope) => {
//   return Meta.makeBoxStatement(scope, "x", false, Tree.UnaryExpression("!", Tree.PrimitiveExpression(123)), (box) => {
//     return Meta.makeBoxStatement(scope, "y", false, Meta.makeOpenExpression(scope, box), (box) => {
//       return Tree.ExpressionStatement(Meta.makeOpenExpression(scope, box));
//     });
//   });
// }), Lang.parseBlock(`{
//   let $_x;
//   $_x = !123;
//   $_x;
// }`), Assert);
