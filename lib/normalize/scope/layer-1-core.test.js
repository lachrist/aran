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
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.deepEqual(Core._get_depth(scope), 1);
    return Tree.Bundle([
      Tree.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
        Assert.deepEqual(Core._get_depth(scope), 2);
        Assert.deepEqual(Core._get_depth(Core._extend_binding(scope, "foo", "bar")), 2);
        return Tree.Bundle([]);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{{}}`), Assert);
  // uninitialized //
  // Assert.throws(() => Core.EXTEND_STATIC(Core._make_root(), (scope) => {
  //   Assert.deepEqual(Core._declare(scope, "x", "tag"), undefined);
  //   return Tree.Bundle([]);
  // }), new Error("Uninitialized identifier"));
  // _declare //
  Assert.throws(() => Core._declare(Core._make_root(), "x", "tag"), new Error("Missing binding scope frame for variable declaration"));
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    Assert.deepEqual(Core._declare(scope, "x", "tag"), false);
    Assert.deepEqual(Core._declare(Core._extend_dynamic(scope, "dyn")), "dyn");
    // Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Duplicate declaration"));
    return Tree.Lone([], Core.EXTEND_EMPTY(scope, (scope) => {
      Assert.deepEqual(Core._declare(scope, "x", "tag"), false);
      Assert.deepEqual(Core._declare(Core._extend_dynamic(scope, "dyn")), "dyn");
      return Tree.Lift(Tree.primitive(123));
    }));
  }), Lang.PARSE_BLOCK(`{
    let $x;
    {123;}
  }`), Assert);
  // _get_tag //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.throws(() => Core._get_tag(scope, "x"), new global.Error("Missing binding static scope frame for tag query"));
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    Assert.deepEqual(Core._get_tag(Core._extend_binding(scope, "foo", "bar"), "x"), "tag");
    return Tree.Lift(Tree.primitive(123));
  }), Lang.PARSE_BLOCK(`{
    let $x;
    123;
  }`), Assert);
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
  // initialize //
  Assert.throws(() => Core._initialize(Core._make_root(), "x"), new global.Error("Missing binding scope frame for variable initialization"));
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    Assert.deepEqual(Core._declare(scope, "y", "tag"), true);
    const result1 = Core._initialize(Core._extend_binding(scope, "foo", "bar"), "x", Tree.primitive(123));
    Assert.deepEqual(result1.done, true);
    const aran_expression = result1.value;
    Assert.throws(() => Core._initialize(scope, "x", Tree.primitive(456)), new global.Error("Duplicate variable initialization"));
    Assert.throws(() => Core._initialize(scope, "z", Tree.primitive(456)), new global.Error("Missing variable declaration for variable initialization"));
    const result2 = Core._initialize(Core._extend_dynamic(scope, "dynamic"), "t", Tree.primitive(789));
    Assert.deepEqual(result2.done, false);
    Assert.deepEqual(result2.value, "dynamic");
    return Tree.Bundle([
      Tree.Lift(aran_expression),
      Tree.Lone([], Core.EXTEND_EMPTY(scope, (scope) => {
        return Tree.Lift(Core._initialize(scope, "y", Tree.primitive(0)).value);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _y, $y;
    _y = false;
    $x = 123;
    {
      (
        $y = 0,
        _y = true);
    }
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
  // lookup-live //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    return Tree.Bundle([
      Tree.Lift(Core._initialize(scope, "x", Tree.primitive(123)).value),
      Tree.Lift(Core.lookup(Core._extend_binding(scope, "foo", "bar"), "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, tag, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(tag, "tag");
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
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    return Tree.Bundle([
      Tree.Lift(Core.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(tag, "tag");
          return Tree.primitive(456);
        },
        on_live_hit: () => Assert.fail()
      })),
      Tree.Lift(Core._initialize(scope, "x", Tree.primitive(123)).value)
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x;
    456;
    $x = 123;
  }`), Assert);
  // lookup-hit-dead-dynamic //
  Lang._match_block(Core.EXTEND_STATIC(false, (scope1) => {
    Assert.deepEqual(Core._declare(scope1, "x", "tag"), true);
    const scope2 = Core._extend_closure(scope1);
    return Tree.Bundle([
      Tree.Lift(Core.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(tag, "tag");
          return Tree.primitive(456);
        },
        on_live_hit: (context, tag, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(tag, "tag");
          return access(null);
        }
      })),
      Tree.Lift(Core.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(tag, "tag");
          return Tree.primitive(789);
        },
        on_live_hit: (context, tag, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(tag, "tag");
          return access(null);
        }
      })),
      Tree.Lift(Core._initialize(scope1, "x", Tree.primitive(123)).value)
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 456);
    (_x ? $x : 789);
    ($x = 123, _x = true);
  }`), Assert);
  // lookup-dynamic-frame //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    scope = Core._extend_dynamic(scope, "dyn");
    return Tree.Bundle([
      Tree.Lift(Core.lookup(scope, "x", "ctx", {
        on_miss: (context) => {
          Assert.deepEqual(context, "ctx");
          return Tree.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: (context, dynamic, aran_expression) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(dynamic, "dyn");
          return Tree.sequence(aran_expression, Tree.primitive(456))
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (123, 456);
  }`), Assert);
  // horizon //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    scope = Core._extend_binding(scope, "foo", "bar");
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    Assert.deepEqual(Core._declare(scope, "y", "tag"), true);
    Assert.throws(() => Core._get_foreground(scope), new global.Error("Missing horizon scope frame for foreground query"));
    Assert.throws(() => Core._get_background(scope), new global.Error("Missing horizon scope frame for background query"));
    scope = Core._extend_horizon(scope);
    return Tree.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
      scope = Core._extend_binding(scope, "foo", "qux");
      Assert.deepEqual(Core._declare(scope, "z", "tag"), true);
      Assert.deepEqual(Core._declare(scope, "t", "tag"), true);
      Assert.deepEqual(Core._get_foreground(scope), ["z", "t"]);
      Assert.deepEqual(Core._get_binding(Core._get_background(scope), "foo"), "bar");
      return Tree.Lift(Tree.primitive(123));
    }));
  }), Lang.PARSE_BLOCK(`{
    let $x, $y;
    {
      let $z, $t;
      123;
    }
  }`), Assert);
  // eval //
  Lang._match_block(Core.EXTEND_STATIC(Core._make_root(), (scope) => {
    Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
    Assert.deepEqual(Core._declare(scope, "y", "tag"), true);
    return Tree.Lone([], Core.EXTEND_STATIC(Core._extend_closure(Core._extend_binding(scope, "foo", "bar")), (scope) => {
      Assert.deepEqual(Core._declare(scope, "x", "tag"), true);
      Assert.deepEqual(Core._declare(scope, "z", "tag"), true);
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
