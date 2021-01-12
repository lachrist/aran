"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Core = require("./layer-1-core.js");

const scopes = {__proto__:null};

State._run_session({nodes:[], serials:new Map(), scopes}, () => {
  // _extend_binding && _fetch_binding //
  Assert.deepEqual(
    Core._fetch_binding(
      Core._extend_binding(
        Core._extend_binding(
          Core._make_root(),
          "foo",
          123),
        "bar",
        456),
      "foo"),
    123);
  Assert.throws(
    () => Core._fetch_binding(Core._make_root(), "foo"),
    new global.Error("Binding not found"));
  // _get_depth //
  Assert.deepEqual(
    Core._get_depth(
      Core._extend_binding(
        Core._make_root(),
        "foo",
        "bar")),
    1);
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], (scope) => {
  //   Assert.deepEqual(Core._get_depth(scope), 1);
  //   return Tree.BundleStatement([
  //     Tree.BlockStatement([], Core.EXTEND_STATIC(scope, (scope) => {
  //       Assert.deepEqual(Core._get_depth(scope), 2);
  //       Assert.deepEqual(Core._get_depth(Core._extend_binding(scope, "foo", "bar")), 2);
  //       return Tree.BundleStatement([]);
  //     }))
  //   ]);
  // }), Lang.parseBlock(`{{}}`), Assert);
  // uninitialized //
  // Assert.throws(() => Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), undefined);
  //   return Tree.BundleStatement([]);
  // }), new Error("Uninitialized identifier"));
  // _declare //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind"], (scope) => {
    Assert.deepEqual(Core._declare(scope, {kind:"other-kind", ghost:false, data:null, name:"x"}), {type:"enclave"});
    Assert.deepEqual(Core._declare(scope, {kind:"kind", ghost:false, data:"foo", name:"x"}), {type:"static", conflict:null});
    Assert.deepEqual(Core._declare(scope, {kind:"kind", ghost:false, data:"bar", name:"x"}), {type:"static", conflict:{kind:"kind", ghost:false, data:"foo", name:"x"}});
    Assert.deepEqual(Core._declare(Core._extend_dynamic(scope, ["kind"], "dynamic-frame"), {kind:"kind", ghost:false, data:null, name:"x"}), {type:"dynamic", frame:"dynamic-frame"});
    return Tree.ExpressionStatement(
      Core._initialize(
        scope,
        "kind",
        "x",
        false).initialize(Tree.PrimitiveExpression(123)));
    // Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Duplicate declaration"));
    // return Tree.BlockStatement([], Core.EXTEND_EMPTY(scope, (scope) => {
    //   Assert.deepEqual(Core._declare(scope, "kind", "x"), false);
    //   Assert.deepEqual(Core._declare(Core._extend_dynamic(scope, "dyn")), "dyn");
    //   return Tree.ExpressionStatement(Tree.PrimitiveExpression(123));
    // }));
  }), Lang.parseBlock(`{
    let $x;
    $x = 123;
  }`), Assert);
  // // _get_tag //
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), [""], (scope) => {
  //   Assert.throws(() => Core._get_tag(scope, "x"), new global.Error("Missing binding static scope frame for tag query"));
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
  //   Assert.deepEqual(Core._get_tag(Core._extend_binding(scope, "foo", "bar"), "x"), "tag");
  //   return Tree.ExpressionStatement(Tree.PrimitiveExpression(123));
  // }), Lang.parseBlock(`{
  //   let $x;
  //   123;
  // }`), Assert);
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   return [
  //     Tree.ExpressionStatement(Core.lookup(scope, "x", "ctx", {
  //       on_miss: (context) => {
  //         Assert.deepEqual(context, "ctx");
  //         return Tree.PrimitiveExpression(123);
  //       },
  //       on_dynamic_frame: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_live_hit: () => Assert.fail()
  //     })),
  //     Assert.throws(() => Core._get_tag(scope, "x"), new Error("Missing tag"))
  //   ][0];
  // }), Lang.parseBlock(`{123;}`), Assert);
  // _initialize //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind1", "kind2"], (scope) => {
    Assert.deepEqual(Core._initialize(scope, "kind3", "x", false), {type:"enclave"});
    Assert.throws(() => Core._initialize(scope, "kind1", "x", false), new global.Error("Missing variable for initialization"));
    Core._declare(scope, {kind:"kind1", ghost:false, data:null, name:"x"});
    Assert.throws(() => Core._initialize(scope, "kind2", "x", false), new global.Error("Kind mismatch during variable initialization"));
    const result1 = Core._initialize(scope, "kind1", "x", false);
    Assert.deepEqual(result1.type, "static");
    Assert.deepEqual(result1.variable, {kind:"kind1", name:"x", ghost:false, data:null});
    Core._declare(scope, {kind:"kind1", ghost:false, data:null, name:"y"});
    Assert.throws(() => Core._initialize(scope, "kind1", "x"), new global.Error("Duplicate variable initialization"));
    const result2 = Core._initialize(scope, "kind1", "y", true);
    Assert.deepEqual(result2.type, "static");
    Assert.deepEqual(result2.variable, {kind:"kind1", name:"y", ghost:false, data:null});
    Assert.deepEqual(Core._initialize(Core._extend_dynamic(scope, ["kind1"], "dynamic-frame"), "kind1", "z"), {
      type: "dynamic",
      frame: "dynamic-frame"
    });
    return Tree.BundleStatement([
      Tree.ExpressionStatement(result1.initialize(Tree.PrimitiveExpression(3))),
      Tree.ExpressionStatement(result2.initialize(Tree.PrimitiveExpression(5))),
      Tree.ExpressionStatement(result1.read()),
      Tree.ExpressionStatement(result2.read())
    ]);
  }), Lang.parseBlock(`{
    let $x, _y, $y;
    _y = false;
    $x = 3;
    (
      $y = 5,
      _y = true);
    $x;
    $y;
  }`), Assert);
  // ImportInitialize //
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
  //   Core._declare(scope, "kind", "x");
  //   Core._declare(scope, "kind", "y");
  //   Core._declare(scope, "kind", "z");
  //   Assert.throws(
  //     () => Core.ImportInitialize(Core._extend_dynamic(scope, ["kind"], "frame"), "kind", "x", "foo", false),
  //     new global.Error("Cannot import variable on dynamic frame"));
  //   return Tree.BundleStatement([
  //     Core.ImportInitialize(scope, "kind", "y", "bar", false),
  //     Core.ImportInitialize(scope, "kind", "z", "qux", true)
  //   ]);
  // }), Lang.parseBlock(`{
  //   let $x, $y, $z, _z;
  //   _z = false;
  //   import * as $y from "bar";
  //   import * as $z from "qux";
  //   _z = true;
  // }`), Assert);
  // parameter //
  Lang._match(
    Core.input(
      Core._make_root(),
      "this"),
    Lang.parseExpression(`#Reflect.get(input, "this")`),
    Assert);
  // // lookup-miss && shadowing //
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   const aran_expression_1 = Core.lookup(scope, "x", "ctx", {
  //     on_miss: (context) => {
  //       Assert.deepEqual(context, "ctx");
  //       return Tree.PrimitiveExpression(12);
  //     },
  //     on_dynamic_frame: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail()
  //   });
  //   const aran_expression_2 = Core.lookup(scope, "x", "ctx", {
  //     on_miss: (context) => {
  //       Assert.deepEqual(context, "ctx");
  //       return Tree.PrimitiveExpression(34);
  //     },
  //     on_dynamic_frame: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail()
  //   });
  //   Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Late shadowing"));
  //   Assert.throws(() => Core.initialize(scope, "x", Tree.PrimitiveExpression(56)), new Error("Shadowed initialization"));
  //   Assert.deepEqual(Core._declare(scope, "y", "tag"), undefined);
  //   return Tree.BundleStatement([
  //     Tree.ExpressionStatement(aran_expression_1),
  //     Tree.ExpressionStatement(aran_expression_2),
  //     Tree.ExpressionStatement(Core.initialize(scope, "y", Tree.PrimitiveExpression(78)))
  //   ]);
  // }), Lang.parseBlock(`{
  //   let $y;
  //   12;
  //   34;
  //   $y = 78;
  // }`), Assert);
  // _is_available //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind1"], (scope) => {
    Core._declare(scope, {kind:"kind1", ghost:true, data:null, name:"x"});
    scope = Core._extend_dynamic(scope, ["kind2"], "dynamic-frame");
    scope = Core._extend_binding(scope, "foo", "bar");
    Assert.deepEqual(Core._is_available(scope, "kind3", "x", {
      dynamic: () => true,
      static: () => true
    }), ["dynamic-frame"]);
    Assert.deepEqual(Core._is_available(scope, "kind1", "x", {
      foo: "bar",
      static: function (variable) {
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(variable, {kind: "kind1", ghost:true, data:null, name:"x"});
        return true;
      }
    }), ["dynamic-frame"]);
    Assert.deepEqual(Core._is_available(scope, "kind1", "x", {
      static: () => false
    }), null);
    Assert.deepEqual(Core._is_available(scope, "kind1", "y", {
      static: () => Assert.fail()
    }), ["dynamic-frame"]);
    return Tree.ExpressionStatement(Tree.PrimitiveExpression(123));
  }), Lang.parseBlock(`{
    123;
  }`), Assert);
  // lookup-live //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind"], (scope) => {
    Core._declare(scope, {kind:"kind", ghost:true, data:"data", name:"y"});
    Core._declare(scope, {kind:"kind", ghost:false, data:"data", name:"x"});
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Core._initialize(scope, "kind", "x").initialize(Tree.PrimitiveExpression(123))),
      Tree.ExpressionStatement(Core.lookup(Core._extend_binding(scope, "foo", "bar"), "x", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_static_dead_hit: () => Assert.fail(),
        on_static_live_hit: (variable, read, write) => {
          Assert.deepEqual(variable, {kind:"kind", ghost:false, data:"data", name:"x"});
          return Tree.SequenceExpression(read(), write(Tree.PrimitiveExpression(456)));
        }
      }))
    ]);
  }), Lang.parseBlock(`{
    let $x;
    $x = 123;
    ($x, $x = 456);
  }`), Assert);
  // lookup-hit-dead-static //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind"], (scope) => {
    Core._declare(scope, {kind:"kind", ghost:true, data:null, name:"x"});
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Core.lookup(scope, "x", {
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
    ]);
  }), Lang.parseBlock(`{
    123;
  }`), Assert);
  // lookup-hit-dead-maybe //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind"], (scope) => {
    Core._declare(scope, {kind:"kind", ghost:false, data:"data", name:"x"});
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Core._initialize(scope, "kind", "x", true).initialize(Tree.PrimitiveExpression(123))),
      Tree.ExpressionStatement(Core.lookup(Core._extend_closure(scope), "x", {
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
    ]);
  }), Lang.parseBlock(`{
    let $x, _x;
    _x = false;
    (
      $x = 123,
      _x = true);
    (_x ? $x : 456);
  }`), Assert);
  // lookup-hit-dead-closure //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind"], (scope) => {
    Core._declare(scope, {kind:"kind", ghost:false, data:"data", name:"x"});
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Core.lookup(Core._extend_closure(scope), "x", {
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
      Tree.ExpressionStatement(Core._initialize(scope, "kind", "x").initialize(Tree.PrimitiveExpression(456)))
    ]);
  }), Lang.parseBlock(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 123);
    ($x = 456, _x = true);
  }`), Assert);
  // lookup-dynamic-frame //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], [], (scope) => {
    scope = Core._extend_dynamic(scope, [], "dynamic-frame");
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Core.lookup(scope, "x", {
        foo: "bar",
        on_miss: () => Tree.PrimitiveExpression(123),
        on_static_live_hit: () => Assert.fail(),
        on_static_dead_hit: () => Assert.fail(),
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.SequenceExpression(expression, Tree.PrimitiveExpression(456))
        }
      }))
    ]);
  }), Lang.parseBlock(`{
    (123, 456);
  }`), Assert);
  // // horizon //
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], (scope) => {
  //   scope = Core._extend_binding(scope, "foo", "bar");
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
  //   Assert.deepEqual(Core._declare(scope, "y", "tag"), true);
  //   Assert.throws(() => Core._get_foreground(scope), new global.Error("Missing horizon scope frame for foreground query"));
  //   Assert.throws(() => Core._get_background(scope), new global.Error("Missing horizon scope frame for background query"));
  //   scope = Core._extend_horizon(scope);
  //   return Tree.BlockStatement([], Core.EXTEND_STATIC(scope, (scope) => {
  //     scope = Core._extend_binding(scope, "foo", "qux");
  //     Assert.deepEqual(Core._declare(scope, "z", "tag"), true);
  //     Assert.deepEqual(Core._declare(scope, "t", "tag"), true);
  //     Assert.deepEqual(Core._get_foreground(scope), ["z", "t"]);
  //     Assert.deepEqual(Core._fetch_binding(Core._get_background(scope), "foo"), "bar");
  //     return Tree.ExpressionStatement(Tree.PrimitiveExpression(123));
  //   }));
  // }), Lang.parseBlock(`{
  //   let $x, $y;
  //   {
  //     let $z, $t;
  //     123;
  //   }
  // }`), Assert);
  // eval //
  Lang._match(Core.EXTEND_STATIC(Core._make_root(), [], ["kind"], (scope) => {
    Core._declare(scope, {kind:"kind", ghost:false, data:null, name:"x"});
    Core._declare(scope, {kind:"kind", ghost:false, data:null, name:"y"});
    return Tree.BundleStatement([
      Tree.BlockStatement(Core.EXTEND_STATIC(Core._extend_binding(Core._extend_closure(scope), "foo", "bar"), [], ["kind"], (scope) => {
        Core._declare(scope, {kind:"kind", ghost:false, data:null, name:"x"});
        Core._declare(scope, {kind:"kind", ghost:false, data:null, name:"z"});
        return Tree.BundleStatement([
          Tree.ExpressionStatement(Core.eval(scope, Tree.PrimitiveExpression(12))),
          Tree.ExpressionStatement(Core._initialize(scope, "kind", "x", false).initialize(Tree.PrimitiveExpression(34))),
          Tree.ExpressionStatement(Core._initialize(scope, "kind", "z", false).initialize(Tree.PrimitiveExpression(56)))
        ]);
      })),
      Tree.ExpressionStatement(Core._initialize(scope, "kind", "x", false).initialize(Tree.PrimitiveExpression(78))),
      Tree.ExpressionStatement(Core._initialize(scope, "kind", "y", false).initialize(Tree.PrimitiveExpression(90)))
    ]);
  }), Lang.parseBlock(`{
    let $x, $y, _y;
    _y = false;
    {
      let $x, $z;
      eval(12);
      $x = 34;
      $z = 56;
    }
    $x = 78;
    ($y = 90, _y = true);
  }`), Assert);
  // Assert.deepEqual(Core._fetch_binding(global.JSON.parse(scopes.null), "foo"), "bar");
  // [scopes.null, JSON.parse(JSON.stringify(scopes.null))].forEach((scope) => {
  //   Lang._match(Core.EXTEND_STATIC(scope, (scope) => {
  //     Assert.deepEqual(Core._is_strict(scope), true);
  //     Assert.deepEqual(Core._get_depth(scope), 2);
  //     return Tree.BundleStatement([
  //       Tree.ExpressionStatement(
  //         Core.eval(scope, Tree.PrimitiveExpression("foo"))),
  //       Tree.ExpressionStatement(Core.lookup(scope, "x", "ctx", {
  //         on_miss: () => Assert.fail(),
  //         on_dynamic_frame: () => Assert.fail(),
  //         on_live_hit: () => Assert.fail(),
  //         on_dead_hit: (context, tag) => {
  //           Assert.deepEqual(context, "ctx");
  //           Assert.deepEqual(tag, "tag");
  //           return Tree.PrimitiveExpression(123);
  //         }
  //       })),
  //       Tree.ExpressionStatement(Core.lookup(scope, "y", "ctx", {
  //         on_miss: (context) => {
  //           Assert.deepEqual(context, "ctx");
  //           return Tree.PrimitiveExpression(456);
  //         },
  //         on_dynamic_frame: (context, dynamic, aran_expression) => {
  //           Assert.deepEqual(context, "ctx");
  //           Assert.deepEqual(dynamic, "dyn");
  //           Assert.deepEqual(aran_expression, Lang.parseExpression("456"));
  //           return Tree.PrimitiveExpression(789);
  //         },
  //         on_live_hit: () => Assert.fail(),
  //         on_dead_hit: () => Assert.fail()
  //       }))
  //     ]);
  //   }), Lang.parseBlock(`{
  //     eval("foo");
  //     123;
  //     789;
  //   }`), Assert);
  // });
  // eval-escaped //
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), (scope1) => {
  //   Core._declare(scope1, "x", "tag");
  //   const scope2 = Core._extend_closure(scope1);
  //   return Tree.BundleStatement([
  //     Tree.ExpressionStatement(Core.eval(scope2, Tree.PrimitiveExpression(123))),
  //     Tree.ExpressionStatement(Core.initialize(scope1, "x", Tree.PrimitiveExpression(456)))
  //   ]);
  // }), Lang.parseBlock(`{
  //   let $x, _x;
  //   _x = false;
  //   eval(123);
  //   ($x = 456, _x = true);
  // }`), Assert);
  // // eval-duplicate //
  // Lang._match(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   Core._declare(scope, "x", "tag");
  //   Core._declare(scope, "y", "tag");
  //   return Tree.BundleStatement([
  //     Tree.ExpressionStatement(Core.initialize(scope, "x", Tree.PrimitiveExpression(12))),
  //     Tree.ExpressionStatement(Core.initialize(scope, "y", Tree.PrimitiveExpression(34))),
  //     Tree.BlockStatement([], Core.EXTEND_STATIC(scope, (scope) => {
  //       Core._declare(scope, "x", "tag");
  //       return Tree.BundleStatement([
  //         Tree.ExpressionStatement(Core.initialize(scope, "x", Tree.PrimitiveExpression(56))),
  //         Tree.ExpressionStatement(Core.eval(scope, Tree.PrimitiveExpression(78)))
  //       ]);
  //     }))
  //   ]);
  // }), Lang.parseBlock(`{
  //   let $x, $y;
  //   $x = 12;
  //   $y = 34;
  //   {
  //     let $x;
  //     $x = 56;
  //     eval(78);
  //   }
  // }`), Assert);
}, []);
