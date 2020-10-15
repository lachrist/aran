"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Inner = require("./inner.js");

const scopes = {__proto__:null};

State._run_session({nodes:[], serials:new Map(), scopes}, [], () => {
  // // _is_root //
  // Assert.deepEqual(Inner._is_root(Inner._make_root()), true);
  // Assert.deepEqual(Inner._is_root(Inner._extend_use_strict(Inner._make_root())), false);
  // _is_strict //
  Assert.deepEqual(Inner._is_strict(Inner._make_root()), false);
  Assert.deepEqual(Inner._is_strict(Inner._extend_use_strict(Inner._make_root())), true);
  Assert.deepEqual(Inner._is_strict(Inner._extend_closure(Inner._extend_use_strict(Inner._make_root()))), true);
  // _get_depth //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._get_depth(scope), 1);
    return Tree.Bundle([
      Tree.Lone([], Inner.EXTEND_STATIC(scope, (scope) => {
        Assert.equal(Inner._get_depth(scope), 2);
        Assert.equal(Inner._get_depth(Inner._extend_use_strict(scope)), 2);
        return Tree.Bundle([]);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{{}}`), Assert);
  // uninitialized //
  // Assert.throws(() => Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
  //   Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
  //   return Tree.Bundle([]);
  // }), new Error("Uninitialized identifier"));
  // _declare //
  Assert.throws(() => Inner._declare(Inner._make_root(), "x", "tag"), new Error("Missing static scope frame for declaration"));
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    Assert.throws(() => Inner._declare(scope, "x", "tag"), new Error("Duplicate declaration"));
    return Tree.Bundle([
      Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(123)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    $x = 123;
  }`), Assert);
  // _is_declared && _get_tag //
  Assert.throws(() => Inner._is_declared(Inner._make_root(), "x"), new Error("Missing static scope frame for declaration query"));
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._is_declared(scope, "x"), false);
    Assert.equal(Inner._declare(Inner._extend_use_strict(scope), "x", "tag"), undefined);
    Assert.equal(Inner._is_declared(scope, "x"), true);
    Assert.equal(Inner._is_declared(Inner._extend_use_strict(scope), "x"), true);
    Assert.equal(Inner._get_tag(scope, "x"), "tag");
    Assert.equal(Inner._get_tag(Inner._extend_use_strict(scope), "x"), "tag");
    Assert.throws(() => Inner._get_tag(scope, "y"), new Error("Missing tag"));
    return Tree.Bundle([
      Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(123)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    $x = 123;
  }`), Assert);
  // _extend_binding && _get_binding //
  Assert.deepEqual(
    Inner._get_binding(
      Inner._extend_binding(
        Inner._extend_binding(
          Inner._make_root(),
          "foo",
          123),
        "bar",
        456),
      "foo"),
    123);
  Assert.throws(
    () => Inner._get_binding(Inner._make_root(), "foo"),
    new global.Error("Binding not found"));
  // initialize //
  Assert.throws(() => Inner.initialize(Inner._make_root(), "x"), new Error("Missing matching static scope frame for initialization"));
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.throws(() => Inner.initialize(scope, "x", Tree.primitive(123)), new Error("Missing matching static scope frame for initialization"));
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    Assert.equal(Inner._declare(scope, "y", "tag"), undefined);
    const aran_expression = Inner.initialize(scope, "x", Tree.primitive(456));
    Assert.throws(() => Inner.initialize(scope, "x", Tree.primitive(789)), new Error("Duplicate initialization"));
    return Tree.Bundle([
      Tree.Lift(aran_expression),
      Tree.Lone([], Inner.EXTEND_STATIC(scope, (scope) => {
        return Tree.Bundle([
          Tree.Lift(Inner.initialize(Inner._extend_use_strict(scope), "y", Tree.primitive(0)))
        ]);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _y, $y;
    _y = false;
    $x = 456;
    {
      (
        $y = 0,
        _y = true);
    }
  }`), Assert);
  // parameter //
  Lang._match_expression(Inner.parameter(Inner._make_root(), "this"), Lang.parse_expression("this"), Assert);
  // lookup-miss && shadowing //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    const aran_expression_1 = Inner.lookup(scope, "x", "ctx", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Tree.primitive(12);
      },
      on_dynamic_frame: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    });
    const aran_expression_2 = Inner.lookup(scope, "x", "ctx", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Tree.primitive(34);
      },
      on_dynamic_frame: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    });
    Assert.throws(() => Inner._declare(scope, "x", "tag"), new Error("Late shadowing"));
    Assert.throws(() => Inner.initialize(scope, "x", Tree.primitive(56)), new Error("Shadowed initialization"));
    Assert.equal(Inner._declare(scope, "y", "tag"), undefined);
    return Tree.Bundle([
      Tree.Lift(aran_expression_1),
      Tree.Lift(aran_expression_2),
      Tree.Lift(Inner.initialize(scope, "y", Tree.primitive(78)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $y;
    12;
    34;
    $y = 78;
  }`), Assert);
  // lookup-live //
  Lang._match_block(Inner.EXTEND_STATIC(false, (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    return Tree.Bundle([
      Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(123))),
      Tree.Lift(Inner.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Tree.sequence(access(null), access(Tree.primitive(456)));
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    $x = 123;
    ($x, $x = 456);
  }`), Assert);
  // lookup-hit-dead-static //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    return Tree.Bundle([
      Tree.Lift(Inner.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Tree.primitive(456);
        },
        on_live_hit: () => Assert.fail()
      })),
      Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(123)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    456;
    $x = 123;
  }`), Assert);
  // lookup-hit-dead-dynamic //
  Lang._match_block(Inner.EXTEND_STATIC(false, (scope1) => {
    Assert.equal(Inner._declare(scope1, "x", "tag"), undefined);
    const scope2 = Inner._extend_closure(scope1);
    return Tree.Bundle([
      Tree.Lift(Inner.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Tree.primitive(456);
        },
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return access(null);
        }
      })),
      Tree.Lift(Inner.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Tree.primitive(789);
        },
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return access(null);
        }
      })),
      Tree.Lift(Inner.initialize(scope1, "x", Tree.primitive(123)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 456);
    (_x ? $x : 789);
    ($x = 123, _x = true);
  }`), Assert);
  // lookup-dynamic-frame //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    scope = Inner._extend_dynamic(scope, "dyn");
    return Tree.Bundle([
      Tree.Lift(Inner.lookup(scope, "x", "ctx", {
        on_miss: (context) => {
          Assert.equal(context, "ctx");
          return Tree.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: (context, dynamic, aran_expression) => {
          Assert.equal(context, "ctx");
          Assert.equal(dynamic, "dyn");
          return Tree.sequence(aran_expression, Tree.primitive(456))
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (123, 456);
  }`), Assert);
  // eval //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._extend_use_strict(Inner._extend_dynamic(Inner._extend_closure(Inner._make_root()), "dyn")), (scope) => {
    Inner._declare(scope, "x", "tag");
    return Tree.Bundle([
      // To create a shadow binding
      Tree.Lift(Inner.lookup(scope, "z", "ctx", {
        on_miss: (context) => {
          Assert.equal(context, "ctx");
          return Tree.primitive(12);
        },
        on_dynamic_frame: (context, dynamic_frame, expression) => {
          Assert.equal(context, "ctx");
          Assert.equal(dynamic_frame, "dyn");
          return Tree.sequence(expression, Tree.primitive(3));
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail()
      })),
      Tree.Lift(Inner.eval(scope, Tree.primitive(456))),
      Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(789)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    (12, 3);
    eval(456);
    ($x = 789);
  }`), Assert);
  // _make_eval //
  [scopes.null, JSON.parse(JSON.stringify(scopes.null))].forEach((scope) => {
    Lang._match_block(Inner.EXTEND_STATIC(scope, (scope) => {
      Assert.equal(Inner._is_strict(scope), true);
      Assert.equal(Inner._get_depth(scope), 2);
      return Tree.Bundle([
        Tree.Lift(
          Inner.eval(scope, Tree.primitive("foo"))),
        Tree.Lift(Inner.lookup(scope, "x", "ctx", {
          on_miss: () => Assert.fail(),
          on_dynamic_frame: () => Assert.fail(),
          on_live_hit: () => Assert.fail(),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Tree.primitive(123);
          }
        })),
        Tree.Lift(Inner.lookup(scope, "y", "ctx", {
          on_miss: (context) => {
            Assert.equal(context, "ctx");
            return Tree.primitive(456);
          },
          on_dynamic_frame: (context, dynamic, aran_expression) => {
            Assert.equal(context, "ctx");
            Assert.deepEqual(dynamic, "dyn");
            Assert.deepEqual(aran_expression, Lang.parse_expression("456"));
            return Tree.primitive(789);
          },
          on_live_hit: () => Assert.fail(),
          on_dead_hit: () => Assert.fail()
        }))
      ]);
    }), Lang.PARSE_BLOCK(`{
      eval("foo");
      123;
      789;
    }`), Assert);
  });
  // eval-escaped //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope1) => {
    Inner._declare(scope1, "x", "tag");
    const scope2 = Inner._extend_closure(scope1);
    return Tree.Bundle([
      Tree.Lift(Inner.eval(scope2, Tree.primitive(123))),
      Tree.Lift(Inner.initialize(scope1, "x", Tree.primitive(456)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _x;
    _x = false;
    eval(123);
    ($x = 456, _x = true);
  }`), Assert);
  // eval-duplicate //
  Lang._match_block(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Inner._declare(scope, "x", "tag");
    Inner._declare(scope, "y", "tag");
    return Tree.Bundle([
      Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(12))),
      Tree.Lift(Inner.initialize(scope, "y", Tree.primitive(34))),
      Tree.Lone([], Inner.EXTEND_STATIC(scope, (scope) => {
        Inner._declare(scope, "x", "tag");
        return Tree.Bundle([
          Tree.Lift(Inner.initialize(scope, "x", Tree.primitive(56))),
          Tree.Lift(Inner.eval(scope, Tree.primitive(78)))
        ]);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, $y;
    $x = 12;
    $y = 34;
    {
      let $x;
      $x = 56;
      eval(78);
    }
  }`), Assert);
});
