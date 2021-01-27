"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Core = require("./layer-1-core.js");

const scopes = {__proto__:null};

State.runSession({nodes:[], serials:new Map(), scopes}, () => {
  // _extend_binding && _fetch_binding //
  Assert.deepEqual(
    Core.fetchBinding(
      Core.BindingScope(
        Core.BindingScope(
          Core.RootScope(),
          "foo",
          123),
        "bar",
        456),
      "foo"),
    123);
  Assert.throws(
    () => Core.fetchBinding(Core.RootScope(), "foo"),
    new global.Error("Binding not found"));
  // _get_depth //
  Assert.deepEqual(
    Core.getDepth(
      Core.BindingScope(
        Core.RootScope(),
        "foo",
        "bar")),
    1);
  // _declare //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind"], (scope) => {
    Assert.deepEqual(Core.declare(scope, {kind:"other-kind", ghost:false, data:null, name:"x"}), {type:"enclave"});
    Assert.deepEqual(Core.declare(scope, {kind:"kind", ghost:false, data:"foo", name:"x"}), {type:"static", conflict:null});
    Assert.deepEqual(Core.declare(scope, {kind:"kind", ghost:false, data:"bar", name:"x"}), {type:"static", conflict:{kind:"kind", ghost:false, data:"foo", name:"x"}});
    Assert.deepEqual(Core.declare(Core.DynamicScope(scope, ["kind"], "dynamic-frame"), {kind:"kind", ghost:false, data:null, name:"x"}), {type:"dynamic", frame:"dynamic-frame"});
    return Tree.ListStatement([
      Tree.ExpressionStatement(
        Core.initialize(
          scope,
          "kind",
          "x",
          false).initialize(Tree.PrimitiveExpression(123))),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
    ]);
  }), Lang.parseBlock(`{
    let $x;
    $x = 123;
    completion "completion";
  }`), Assert);
  // _initialize //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind1", "kind2"], (scope) => {
    Assert.deepEqual(Core.initialize(scope, "kind3", "x", false), {type:"enclave"});
    Assert.throws(() => Core.initialize(scope, "kind1", "x", false), new global.Error("Missing variable for initialization"));
    Core.declare(scope, {kind:"kind1", ghost:false, data:null, name:"x"});
    Assert.throws(() => Core.initialize(scope, "kind2", "x", false), new global.Error("Kind mismatch during variable initialization"));
    const result1 = Core.initialize(scope, "kind1", "x", false);
    Assert.deepEqual(result1.type, "static");
    Assert.deepEqual(result1.variable, {kind:"kind1", name:"x", ghost:false, data:null});
    Core.declare(scope, {kind:"kind1", ghost:false, data:null, name:"y"});
    Assert.throws(() => Core.initialize(scope, "kind1", "x"), new global.Error("Duplicate variable initialization"));
    const result2 = Core.initialize(scope, "kind1", "y", true);
    Assert.deepEqual(result2.type, "static");
    Assert.deepEqual(result2.variable, {kind:"kind1", name:"y", ghost:false, data:null});
    Assert.deepEqual(Core.initialize(Core.DynamicScope(scope, ["kind1"], "dynamic-frame"), "kind1", "z"), {
      type: "dynamic",
      frame: "dynamic-frame"
    });
    return Tree.ListStatement([
      Tree.ExpressionStatement(result1.initialize(Tree.PrimitiveExpression(3))),
      Tree.ExpressionStatement(result2.initialize(Tree.PrimitiveExpression(5))),
      Tree.ExpressionStatement(result1.read()),
      Tree.ExpressionStatement(result2.read()),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
    ]);
  }), Lang.parseBlock(`{
    let $x, _y, $y;
    _y = false;
    $x = 3;
    _y = (
      $y = 5,
      true);
    $x;
    $y;
    completion "completion";
  }`), Assert);
  // parameter //
  Lang.match(
    Core.makeInputExpression(
      Core.RootScope(),
      "this"),
    Lang.parseExpression(`#Reflect.get(input, "this")`),
    Assert);
  // _is_available //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind1"], (scope) => {
    Core.declare(scope, {kind:"kind1", ghost:true, data:null, name:"x"});
    scope = Core.DynamicScope(scope, ["kind2"], "dynamic-frame");
    scope = Core.BindingScope(scope, "foo", "bar");
    Assert.deepEqual(Core.isAvailable(scope, "kind3", "x", {
      dynamic: () => true,
      static: () => true
    }), ["dynamic-frame"]);
    Assert.deepEqual(Core.isAvailable(scope, "kind1", "x", {
      foo: "bar",
      static: function (variable) {
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(variable, {kind: "kind1", ghost:true, data:null, name:"x"});
        return true;
      }
    }), ["dynamic-frame"]);
    Assert.deepEqual(Core.isAvailable(scope, "kind1", "x", {
      static: () => false
    }), null);
    Assert.deepEqual(Core.isAvailable(scope, "kind1", "y", {
      static: () => Assert.fail()
    }), ["dynamic-frame"]);
    return Tree.CompletionStatement(Tree.PrimitiveExpression(123));
  }), Lang.parseBlock(`{
    completion 123;
  }`), Assert);
  // lookup-live //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind"], (scope) => {
    Core.declare(scope, {kind:"kind", ghost:true, data:"data", name:"y"});
    Core.declare(scope, {kind:"kind", ghost:false, data:"data", name:"x"});
    return Tree.ListStatement([
      Tree.ExpressionStatement(Core.initialize(scope, "kind", "x").initialize(Tree.PrimitiveExpression(123))),
      Tree.ExpressionStatement(Core.makeLookupExpression(Core.BindingScope(scope, "foo", "bar"), "x", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_static_dead_hit: () => Assert.fail(),
        on_static_live_hit: (variable, read, write) => {
          Assert.deepEqual(variable, {kind:"kind", ghost:false, data:"data", name:"x"});
          return Tree.SequenceExpression(write(Tree.PrimitiveExpression(456)), read());
        }
      })),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
    ]);
  }), Lang.parseBlock(`{
    let $x;
    $x = 123;
    ($x = 456, $x);
    completion "completion";
  }`), Assert);
  // lookup-hit-dead-static //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind"], (scope) => {
    Core.declare(scope, {kind:"kind", ghost:true, data:null, name:"x"});
    return Tree.ListStatement([
      Tree.ExpressionStatement(Core.makeLookupExpression(scope, "x", {
        foo: "bar",
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_static_dead_hit: function (variable) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind", ghost:true, data:null, name:"x"});
          return Tree.PrimitiveExpression(123);
        },
        on_static_live_hit: () => Assert.fail()
      })),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
    ]);
  }), Lang.parseBlock(`{
    123;
    completion "completion";
  }`), Assert);
  // lookup-hit-dead-maybe //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind"], (scope) => {
    Core.declare(scope, {kind:"kind", ghost:false, data:"data", name:"x"});
    return Tree.ListStatement([
      Tree.ExpressionStatement(Core.initialize(scope, "kind", "x", true).initialize(Tree.PrimitiveExpression(123))),
      Tree.ExpressionStatement(Core.makeLookupExpression(Core.ClosureScope(scope), "x", {
        foo: "bar",
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_static_dead_hit: function (variable) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind", ghost:false, data:"data", name:"x"});
          return Tree.PrimitiveExpression(456);
        },
        on_static_live_hit: function (variable, read, write) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind", ghost:false, data:"data", name:"x"});
          return read();
        }
      })),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion")),
    ]);
  }), Lang.parseBlock(`{
    let $x, _x;
    _x = false;
    _x = (
      $x = 123,
      true);
    (_x ? $x : 456);
    completion "completion";
  }`), Assert);
  // lookup-hit-dead-closure //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind"], (scope) => {
    Core.declare(scope, {kind:"kind", ghost:false, data:"data", name:"x"});
    return Tree.ListStatement([
      Tree.ExpressionStatement(Core.makeLookupExpression(Core.ClosureScope(scope), "x", {
        foo: "bar",
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_static_dead_hit: function (variable) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind", ghost:false, data:"data", name:"x"});
          return Tree.PrimitiveExpression(123);
        },
        on_static_live_hit: function (variable, read, write) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind", ghost:false, data:"data", name:"x"});
          return read();
        }
      })),
      Tree.ExpressionStatement(Core.initialize(scope, "kind", "x").initialize(Tree.PrimitiveExpression(456))),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
    ]);
  }), Lang.parseBlock(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 123);
    _x = (
      $x = 456,
      true);
    completion "completion";
  }`), Assert);
  // lookup-dynamic-frame //
  Lang.match(Core.makeBlock(Core.RootScope(), [], (scope) => {
    scope = Core.DynamicScope(scope, [], "dynamic-frame");
    return Tree.ListStatement([
      Tree.ExpressionStatement(Core.makeLookupExpression(scope, "x", {
        foo: "bar",
        on_miss: () => Tree.PrimitiveExpression(123),
        on_static_live_hit: () => Assert.fail(),
        on_static_dead_hit: () => Assert.fail(),
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.SequenceExpression(expression, Tree.PrimitiveExpression(456))
        }
      })),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))
    ]);
  }), Lang.parseBlock(`{
    (123, 456);
    completion "completion";
  }`), Assert);
  // eval //
  Lang.match(Core.makeBlock(Core.RootScope(), ["kind"], (scope) => {
    Core.declare(scope, {kind:"kind", ghost:false, data:null, name:"x"});
    Core.declare(scope, {kind:"kind", ghost:false, data:null, name:"y"});
    return Tree.ListStatement([
      Tree.BranchStatement(Tree.Branch([], Core.makeBlock(Core.BindingScope(Core.ClosureScope(scope), "foo", "bar"), ["kind"], (scope) => {
        Core.declare(scope, {kind:"kind", ghost:false, data:null, name:"x"});
        Core.declare(scope, {kind:"kind", ghost:false, data:null, name:"z"});
        return Tree.ListStatement([
          Tree.ExpressionStatement(Core.makeEvalExpression(scope, Tree.PrimitiveExpression(12))),
          Tree.ExpressionStatement(Core.initialize(scope, "kind", "x", false).initialize(Tree.PrimitiveExpression(34))),
          Tree.ExpressionStatement(Core.initialize(scope, "kind", "z", false).initialize(Tree.PrimitiveExpression(56))),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion1"))
        ]);
      }))),
      Tree.ExpressionStatement(Core.initialize(scope, "kind", "x", false).initialize(Tree.PrimitiveExpression(78))),
      Tree.ExpressionStatement(Core.initialize(scope, "kind", "y", false).initialize(Tree.PrimitiveExpression(90))),
      Tree.CompletionStatement(Tree.PrimitiveExpression("completion2"))
    ]);
  }), Lang.parseBlock(`{
    let $x, $y, _y;
    _y = false;
    {
      let $x, $z;
      eval(12);
      $x = 34;
      $z = 56;
      completion "completion1";
    }
    $x = 78;
    _y = (
      $y = 90,
      true);
    completion "completion2";
  }`), Assert);
}, []);
