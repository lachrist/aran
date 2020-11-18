"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Core = require("./layer-1-core.js");

const scopes = {__proto__:null};

State._run_session({nodes:[], serials:new Map(), scopes}, [], () => {
  // _extend_binding && _get_binding //
  Assert.deepEqual(
    Core._get_binding(
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
    () => Core._get_binding(Core._make_root(), "foo"),
    new global.Error("Binding not found"));
  // _get_depth //
  Assert.deepEqual(
    Core._get_depth(
      Core._extend_binding(
        Core._make_root(),
        "foo",
        "bar")),
    1);
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), [], (scope) => {
  //   Assert.deepEqual(Core._get_depth(scope), 1);
  //   return Tree.Bundle([
  //     Tree.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
  //       Assert.deepEqual(Core._get_depth(scope), 2);
  //       Assert.deepEqual(Core._get_depth(Core._extend_binding(scope, "foo", "bar")), 2);
  //       return Tree.Bundle([]);
  //     }))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{{}}`), Assert);
  // uninitialized //
  // Assert.throws(() => Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), undefined);
  //   return Tree.Bundle([]);
  // }), new Error("Uninitialized identifier"));
  // _declare //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
    Assert.throws(() => Core._declare(scope, "other-kind", "x"), new Error("Missing binding scope frame for variable declaration"));
    Assert.deepEqual(Core._declare(scope, "kind", "x"), {static:true, value:null});
    Assert.deepEqual(Core._declare(scope, "kind", "x"), {static:true, value:"kind"});
    Assert.deepEqual(Core._declare(Core._extend_dynamic(scope, ["kind"], "dynamic-frame"), "kind", "x"), {static:false, value:"dynamic-frame"});
    return Tree.Lift(Tree.primitive(123));
    // Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Duplicate declaration"));
    // return Tree.Lone([], Core.EXTEND_EMPTY(scope, (scope) => {
    //   Assert.deepEqual(Core._declare(scope, "kind", "x"), false);
    //   Assert.deepEqual(Core._declare(Core._extend_dynamic(scope, "dyn")), "dyn");
    //   return Tree.Lift(Tree.primitive(123));
    // }));
  }), Lang.PARSE_BLOCK(`{
    let $x;
    123;
  }`), Assert);
  // // _get_tag //
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), [""], (scope) => {
  //   Assert.throws(() => Core._get_tag(scope, "x"), new global.Error("Missing binding static scope frame for tag query"));
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
  //   Assert.deepEqual(Core._get_tag(Core._extend_binding(scope, "foo", "bar"), "x"), "tag");
  //   return Tree.Lift(Tree.primitive(123));
  // }), Lang.PARSE_BLOCK(`{
  //   let $x;
  //   123;
  // }`), Assert);
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   return [
  //     Tree.Lift(Core.lookup(scope, "x", "ctx", {
  //       on_miss: (context) => {
  //         Assert.deepEqual(context, "ctx");
  //         return Tree.primitive(123);
  //       },
  //       on_dynamic_frame: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_live_hit: () => Assert.fail()
  //     })),
  //     Assert.throws(() => Core._get_tag(scope, "x"), new Error("Missing tag"))
  //   ][0];
  // }), Lang.PARSE_BLOCK(`{123;}`), Assert);
  // _initialize //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind1", "kind2"], (scope) => {
    Assert.throws(() => Core._initialize(scope, "kind3", "x", Tree.primitive(1), false), new global.Error("Missing binding scope frame for variable initialization"));
    Assert.throws(() => Core._initialize(scope, "kind1", "x", Tree.primitive(2), false), new global.Error("Missing variable for initialization"));
    Core._declare(scope, "kind1", "x");
    Assert.throws(() => Core._initialize(scope, "kind2", "x", Tree.primitive(2), false), new global.Error("Kind mismatch during variable initialization"));
    const result1 = Core._initialize(scope, "kind1", "x", Tree.primitive(3), false);
    Core._declare(scope, "kind1", "y");
    Assert.deepEqual(result1.static, true);
    Assert.throws(() => Core._initialize(scope, "kind1", "x", Tree.primitive(4)), new global.Error("Duplicate variable initialization"));
    const result2 = Core._initialize(scope, "kind1", "y", Tree.primitive(5), true);
    Assert.deepEqual(result2.static, true);
    Assert.deepEqual(Core._initialize(Core._extend_dynamic(scope, ["kind1"], "dynamic-frame"), "kind1", "z", Tree.primitive(6)), {
      static: false,
      value: "dynamic-frame"
    });
    return Tree.Bundle([
      Tree.Lift(result1.value),
      Tree.Lift(result2.value)
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _y, $y;
    _y = false;
    $x = 3;
    (
      $y = 5,
      _y = true);
  }`), Assert);
  // parameter //
  Lang._match_expression(Core.parameter(Core._make_root(), "this"), Lang.parse_expression("this"), Assert);
  // // lookup-miss && shadowing //
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   const aran_expression_1 = Core.lookup(scope, "x", "ctx", {
  //     on_miss: (context) => {
  //       Assert.deepEqual(context, "ctx");
  //       return Tree.primitive(12);
  //     },
  //     on_dynamic_frame: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail()
  //   });
  //   const aran_expression_2 = Core.lookup(scope, "x", "ctx", {
  //     on_miss: (context) => {
  //       Assert.deepEqual(context, "ctx");
  //       return Tree.primitive(34);
  //     },
  //     on_dynamic_frame: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail()
  //   });
  //   Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Late shadowing"));
  //   Assert.throws(() => Core.initialize(scope, "x", Tree.primitive(56)), new Error("Shadowed initialization"));
  //   Assert.deepEqual(Core._declare(scope, "y", "tag"), undefined);
  //   return Tree.Bundle([
  //     Tree.Lift(aran_expression_1),
  //     Tree.Lift(aran_expression_2),
  //     Tree.Lift(Core.initialize(scope, "y", Tree.primitive(78)))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $y;
  //   12;
  //   34;
  //   $y = 78;
  // }`), Assert);
  // _is_available //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind1"], (scope) => {
    Core._declare(scope, "kind1", "x");
    scope = Core._extend_dynamic(scope, ["kind2"], "dynamic-frame");
    scope = Core._extend_binding(scope, "foo", "bar");
    Assert.throws(() => Core._is_available(scope, "kind3", "x", {
      dynamic: () => true,
      static: () => true
    }), new global.Error("Missing binding frame for availability query"));
    let marker = null;
    Assert.deepEqual(Core._is_available(scope, "kind1", "x", {
      foo: "bar",
      dynamic: function (frame) {
        Assert.deepEqual(marker, null);
        marker = "dynamic";
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(frame, "dynamic-frame");
        return true;
      },
      static: function (kind) {
        Assert.deepEqual(marker, "dynamic");
        marker = "static";
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(kind, "kind1");
        return true;
      }
    }), true);
    Assert.deepEqual(marker, "static");
    Assert.deepEqual(Core._is_available(scope, "kind1", "x", {
      dynamic: () => false,
      static: () => true
    }), false);
    Assert.deepEqual(Core._is_available(scope, "kind1", "x", {
      dynamic: () => true,
      static: () => false
    }), false);
    Assert.deepEqual(Core._is_available(scope, "kind1", "y", {
      dynamic: () => true,
      static: () => false
    }), true);
    return Tree.Lift(Tree.primitive(123));
  }), Lang.PARSE_BLOCK(`{
    let $x;
    123;
  }`), Assert);
  // lookup-live //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
    Core._declare(scope, "kind", "x");
    return Tree.Bundle([
      Tree.Lift(Core._initialize(scope, "kind", "x", Tree.primitive(123)).value),
      Tree.Lift(Core.lookup(Core._extend_binding(scope, "foo", "bar"), "x", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (kind, access) => {
          Assert.deepEqual(kind, "kind");
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
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
    Core._declare(scope, "kind", "x");
    return Tree.Bundle([
      Tree.Lift(Core.lookup(scope, "x", {
        foo: "bar",
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: function (kind) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind");
          return Tree.primitive(123);
        },
        on_live_hit: () => Assert.fail()
      })),
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    123;
  }`), Assert);
  // lookup-hit-dead-maybe //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
    Core._declare(scope, "kind", "x");
    return Tree.Bundle([
      Tree.Lift(Core._initialize(scope, "kind", "x", Tree.primitive(123), true).value),
      Tree.Lift(Core.lookup(Core._extend_closure(scope), "x", {
        foo: "bar",
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: function (kind) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind");
          return Tree.primitive(456);
        },
        on_live_hit: function (kind, access) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind");
          return access(null);
        }
      })),
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _x;
    _x = false;
    (
      $x = 123,
      _x = true);
    (_x ? $x : 456);
  }`), Assert);
  // lookup-hit-dead-closure //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
    Core._declare(scope, "kind", "x");
    return Tree.Bundle([
      Tree.Lift(Core.lookup(Core._extend_closure(scope), "x", {
        foo: "bar",
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: function (kind) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind");
          return Tree.primitive(123);
        },
        on_live_hit: function (kind, access) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind");
          return access(null);
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 123);
  }`), Assert);
  // lookup-dynamic-frame //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), [], (scope) => {
    scope = Core._extend_dynamic(scope, [], "dynamic-frame");
    return Tree.Bundle([
      Tree.Lift(Core.lookup(scope, "x", {
        foo: "bar",
        on_miss: () => Tree.primitive(123),
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.sequence(expression, Tree.primitive(456))
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (123, 456);
  }`), Assert);
  // // horizon //
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), [], (scope) => {
  //   scope = Core._extend_binding(scope, "foo", "bar");
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
  //   Assert.deepEqual(Core._declare(scope, "y", "tag"), true);
  //   Assert.throws(() => Core._get_foreground(scope), new global.Error("Missing horizon scope frame for foreground query"));
  //   Assert.throws(() => Core._get_background(scope), new global.Error("Missing horizon scope frame for background query"));
  //   scope = Core._extend_horizon(scope);
  //   return Tree.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
  //     scope = Core._extend_binding(scope, "foo", "qux");
  //     Assert.deepEqual(Core._declare(scope, "z", "tag"), true);
  //     Assert.deepEqual(Core._declare(scope, "t", "tag"), true);
  //     Assert.deepEqual(Core._get_foreground(scope), ["z", "t"]);
  //     Assert.deepEqual(Core._get_binding(Core._get_background(scope), "foo"), "bar");
  //     return Tree.Lift(Tree.primitive(123));
  //   }));
  // }), Lang.PARSE_BLOCK(`{
  //   let $x, $y;
  //   {
  //     let $z, $t;
  //     123;
  //   }
  // }`), Assert);
  // eval //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), ["kind"], (scope) => {
    Core._declare(scope, "kind", "x",);
    Core._declare(scope, "kind", "y",);
    return Tree.Lone([], Core.EXTEND_STATIC(Core._extend_closure(Core._extend_binding(scope, "foo", "bar")), ["kind"], (scope) => {
      Core._declare(scope, "kind", "x");
      Core._declare(scope, "kind", "z");
      return Tree.Lift(Core.eval(scope, Tree.primitive(123)));
    }));
  }), Lang.PARSE_BLOCK(`{
    let $x, $y, _y;
    _y = false;
    {
      let $x, $z;
      eval(123);}
  }`), Assert);
  Assert.deepEqual(Core._get_binding(global.JSON.parse(scopes.null), "foo"), "bar");
  // [scopes.null, JSON.parse(JSON.stringify(scopes.null))].forEach((scope) => {
  //   Lang._match_block(Core.EXTEND_STATIC(scope, (scope) => {
  //     Assert.deepEqual(Core._is_strict(scope), true);
  //     Assert.deepEqual(Core._get_depth(scope), 2);
  //     return Tree.Bundle([
  //       Tree.Lift(
  //         Core.eval(scope, Tree.primitive("foo"))),
  //       Tree.Lift(Core.lookup(scope, "x", "ctx", {
  //         on_miss: () => Assert.fail(),
  //         on_dynamic_frame: () => Assert.fail(),
  //         on_live_hit: () => Assert.fail(),
  //         on_dead_hit: (context, tag) => {
  //           Assert.deepEqual(context, "ctx");
  //           Assert.deepEqual(tag, "tag");
  //           return Tree.primitive(123);
  //         }
  //       })),
  //       Tree.Lift(Core.lookup(scope, "y", "ctx", {
  //         on_miss: (context) => {
  //           Assert.deepEqual(context, "ctx");
  //           return Tree.primitive(456);
  //         },
  //         on_dynamic_frame: (context, dynamic, aran_expression) => {
  //           Assert.deepEqual(context, "ctx");
  //           Assert.deepEqual(dynamic, "dyn");
  //           Assert.deepEqual(aran_expression, Lang.parse_expression("456"));
  //           return Tree.primitive(789);
  //         },
  //         on_live_hit: () => Assert.fail(),
  //         on_dead_hit: () => Assert.fail()
  //       }))
  //     ]);
  //   }), Lang.PARSE_BLOCK(`{
  //     eval("foo");
  //     123;
  //     789;
  //   }`), Assert);
  // });
  // eval-escaped //
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope1) => {
  //   Core._declare(scope1, "x", "tag");
  //   const scope2 = Core._extend_closure(scope1);
  //   return Tree.Bundle([
  //     Tree.Lift(Core.eval(scope2, Tree.primitive(123))),
  //     Tree.Lift(Core.initialize(scope1, "x", Tree.primitive(456)))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $x, _x;
  //   _x = false;
  //   eval(123);
  //   ($x = 456, _x = true);
  // }`), Assert);
  // // eval-duplicate //
  // Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   Core._declare(scope, "x", "tag");
  //   Core._declare(scope, "y", "tag");
  //   return Tree.Bundle([
  //     Tree.Lift(Core.initialize(scope, "x", Tree.primitive(12))),
  //     Tree.Lift(Core.initialize(scope, "y", Tree.primitive(34))),
  //     Tree.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
  //       Core._declare(scope, "x", "tag");
  //       return Tree.Bundle([
  //         Tree.Lift(Core.initialize(scope, "x", Tree.primitive(56))),
  //         Tree.Lift(Core.eval(scope, Tree.primitive(78)))
  //       ]);
  //     }))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $x, $y;
  //   $x = 12;
  //   $y = 34;
  //   {
  //     let $x;
  //     $x = 56;
  //     eval(78);
  //   }
  // }`), Assert);
});
