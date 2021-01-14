"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Split = require("./layer-2-split.js");

State.runSession({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  Lang.match(Split.makeBlock(Split.RootScope(), ["kind-base"], ["kind-meta"], (scope) => {
    // Declare //
    Assert.deepEqual(Split.declareBase(scope, {kind:"kind-base", ghost:false, name:"x_base"}), {type:"static", conflict:null});
    Assert.deepEqual(Split.declareMeta(scope, {kind:"kind-meta", ghost:false, name:"x_meta"}), {type:"static", conflict:null});
    // Initialize //
    Assert.deepEqual(
      Split.initializeBase(
        Split.DynamicScope(scope, ["kind-base"], [], "foobar"),
        "kind-base",
        "foo",
        Tree.PrimitiveExpression(123),
        false),
      {
        type: "dynamic",
        frame: "foobar"});
    Assert.deepEqual(
      Split.initializeMeta(
        Split.DynamicScope(scope, [], ["kind-meta"], "foobar"),
        "kind-meta",
        "foo",
        Tree.PrimitiveExpression(123),
        false),
      {
        type: "dynamic",
        frame: "foobar"});
    const result_base = Split.initializeBase(scope, "kind-base", "x_base", false);
    Assert.deepEqual(result_base.type, "static");
    Assert.deepEqual(result_base.variable, {kind:"kind-base", ghost:false, name:"x_base"});
    const result_meta = Split.initializeMeta(scope, "kind-meta", "x_meta", false);
    Assert.deepEqual(result_meta.type, "static");
    Assert.deepEqual(result_meta.variable, {kind:"kind-meta", ghost:false, name:"x_meta"});
    // Availability //
    Assert.deepEqual(Split.isAvailableBase(scope, "kind-base", "x_base", {
      foo: "bar",
      static: function (variable) {
        Assert.deepEqual(this.foo, "bar"),
        Assert.deepEqual(variable, {kind:"kind-base", ghost:false, name:"x_base"});
        return true;
      }
    }), []);
    Assert.deepEqual(Split.isAvailableMeta(scope, "kind-meta", "x_meta", {
      foo: "bar",
      static: function (variable) {
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(variable, {kind:"kind-meta", ghost:false, name:"x_meta"});
        return true;
      }
    }), []);
    // Lookup //
    Assert.deepEqual(Split.declareBase(scope, {kind:"kind-base", ghost:true, data:"foo", name:"y_base"}), {type:"static", conflict:null});
    Assert.deepEqual(Split.declareBase(scope, {kind:"kind-base", ghost:true, data:"bar", name:"y_base"}), {type:"static", conflict:{kind:"kind-base", ghost:true, data:"foo", name:"y_base"}});
    Assert.deepEqual(Split.declareMeta(scope, {kind:"kind-meta", ghost:true, data:"foo", name:"y_meta"}), {type:"static", conflict:null});
    Assert.deepEqual(Split.declareMeta(scope, {kind:"kind-meta", ghost:true, data:"bar", name:"y_meta"}), {type:"static", conflict:{kind:"kind-meta", ghost:true, data:"foo", name:"y_meta"}});
    const lookup_callback_prototype = {
      foo: "bar",
      on_miss: () => Assert.fail(),
      on_static_dead_hit: () => Assert.fail(),
      on_static_live_hit: () => Assert.fail(),
      on_dynamic_frame: () => Assert.fail()
    };
    return Tree.ListStatement([
      // _initialize //
      Tree.ExpressionStatement(result_base.initialize(Tree.PrimitiveExpression("value-base"))),
      Tree.ExpressionStatement(result_meta.initialize(Tree.PrimitiveExpression("value-meta"))),
      // // ImportInitialize //
      // (
      //   Split.declareBase(scope, "kind-base", "import_base"),
      //   Split.ImportInitializeBase(scope, "kind-base", "import_base", "source-base", false)),
      // (
      //   Split.declareMeta(scope, "kind-meta", "import_meta"),
      //   Split.ImportInitializeMeta(scope, "kind-meta", "import_meta", "source-meta", false)),
      // Lookup >> Miss && Dynamic Frame //
      Tree.ExpressionStatement(Split.makeLookupBaseExpression(Split.DynamicScope(scope, [], [], "dynamic-frame"), "z_base", {
        __proto__: lookup_callback_prototype,
        on_miss: function () {
          Assert.deepEqual(this.foo, "bar");
          return Tree.PrimitiveExpression("miss-base");
        },
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.SequenceExpression(Tree.PrimitiveExpression("dynamic-frame-base"), expression);
        }
      })),
      Tree.ExpressionStatement(Split.makeLookupMetaExpression(Split.DynamicScope(scope, [], [], "dynamic-frame"), "z_meta", {
        __proto__: lookup_callback_prototype,
        on_miss: function () {
          Assert.deepEqual(this.foo, "bar");
          return Tree.PrimitiveExpression("miss-meta");
        },
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.SequenceExpression(Tree.PrimitiveExpression("dynamic-frame-meta"), expression);
        }
      })),
      // Lookup >> Dead Hit //
      Tree.ExpressionStatement(Split.makeLookupBaseExpression(scope, "y_base", {
        __proto__: lookup_callback_prototype,
        on_static_dead_hit: function (variable) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind-base", ghost:true, data:"foo", name:"y_base"});
          return Tree.PrimitiveExpression("dead-hit-base");
        }
      })),
      Tree.ExpressionStatement(Split.makeLookupMetaExpression(scope, "y_meta", {
        __proto__: lookup_callback_prototype,
        on_static_dead_hit: function (variable) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind-meta", ghost:true, data:"foo", name:"y_meta"});
          return Tree.PrimitiveExpression("dead-hit-meta");
        }
      })),
      // Lookup >> Live Hit
      Tree.ExpressionStatement(Split.makeLookupBaseExpression(scope, "x_base", {
        __proto__: lookup_callback_prototype,
        on_static_live_hit: function (variable, read, write) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind-base", ghost:false, name:"x_base"});
          return Tree.PrimitiveExpression("live-hit-base");
        }
      })),
      Tree.ExpressionStatement(Split.makeLookupMetaExpression(scope, "x_meta", {
        __proto__: lookup_callback_prototype,
        on_static_live_hit: function (variable, read, write) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(variable, {kind:"kind-meta", ghost:false, name:"x_meta"});
          return Tree.PrimitiveExpression("live-hit-meta");
        }
      }))
    ]);
  }, (scope) => Tree.PrimitiveExpression("completion")), Lang.parseBlock(`{
    let $$x_base, $_x_meta;
    $$x_base = "value-base";
    $_x_meta = "value-meta";
    ("dynamic-frame-base", "miss-base");
    ("dynamic-frame-meta", "miss-meta");
    "dead-hit-base";
    "dead-hit-meta";
    "live-hit-base";
    "live-hit-meta";
    completion "completion";
  }`), Assert);
}, []);
