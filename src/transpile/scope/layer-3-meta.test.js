"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Meta = require("./layer-3-meta.js");

const visitor = State.makeRootVisitor(
  "Program",
  () => {
    // Test //
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
    // Primitive //
    Lang.match(
      Meta.makeOpenExpression(
        Meta.RootScope(),
        Meta.PrimitiveBox(123)),
      Lang.parseExpression(`123`),
      Assert);
    // Intrinsic //
    Lang.match(
      Meta.makeOpenExpression(
        Meta.RootScope(),
        Meta.IntrinsicBox("eval")),
      Lang.parseExpression(`#eval`),
      Assert);
    // Local //
    Lang.match(
      Meta.makeBlock(
        Meta.RootScope(),
        (scope) => Tree.CompletionStatement(
          Meta.makeBoxExpression(
            scope,
            "foo",
            true,
            Tree.PrimitiveExpression(123),
            (box) => Tree.SequenceExpression(
              Meta.makeCloseExpression(
                Meta.DynamicScope(scope, "frame"),
                box,
                Tree.PrimitiveExpression(456)),
              Meta.makeOpenExpression(scope, box))))),
      Lang.parseBlock(`{
        let _foo;
        completion (
          _foo = 123,
          (
            _foo = 456,
            _foo)); }`),
      Assert);
    // Global //
    Lang.match(
      Meta.makeBoxStatement(
        Meta.RootScope(),
        true,
        "foo",
        Tree.PrimitiveExpression(123),
        (box) => Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Meta.makeCloseExpression(
                Meta.RootScope(),
                box,
                Tree.PrimitiveExpression(456))),
            Tree.ExpressionStatement(
              Meta.makeOpenExpression(
                Meta.RootScope(),
                box))])),
      Lang.parseStatement(`
        #Reflect.set(#aran.globalRecord, "foo2", 123);
        #Reflect.set(#aran.globalRecord, "foo2", 456);
        #Reflect.get(#aran.globalRecord, "foo2");`),
      Assert); });

visitor(
  {
    type: "Program",
    body: []},
  {
    counter: 0,
    locations: [],
    serials: new global.Map(),
    annotations: new global.Map()},
  "context");
