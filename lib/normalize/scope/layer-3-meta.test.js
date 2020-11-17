"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Meta = require("./layer-3-meta.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // _primitive_box //
  Lang._match_expression(
    Meta.get(
      Meta._make_root(),
      Meta._primitive_box(123)),
    Lang.parse_expression(`123`),
    Assert);
  // _builtin_box //
  Lang._match_expression(
    Meta.get(
      Meta._make_root(),
      Meta._builtin_box("eval")),
    Lang.parse_expression(`#eval`),
    Assert);
  // // _box //
  // Assert.throws(
  //   () => Meta._box(Meta._make_root(), "foo", true, Tree.primitive(123)),
  //   new Error("Scope._box cannot create writable boxes"));
  // Assert.throws(
  //   () => Meta._box(Meta._make_root(), "foo", false, Tree.sequence(Tree.primitive(123), Tree.primitive(456))),
  //   new Error("Scope._box can only box primitive expressions or builtin expressions"));
  // Assert.deepEqual(
  //   Meta.get(
  //     Meta._make_root(),
  //     Meta._box(Meta._make_root(), "foo", false, Tree.primitive(123))),
  //   Lang.parse_expression(`123`));
  // Assert.deepEqual(
  //   Meta.get(
  //     Meta._make_root(),
  //     Meta._box(Meta._make_root(), "foo", false, Tree.builtin("global"))),
  //   Lang.parse_expression(`#global`));
  //////////////
  // Writable //
  //////////////
  // Box //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Meta.Box(scope, true, "x", Tree.primitive(123), (box) => {
      return Tree.Bundle([
        Tree.Lift(Meta.get(scope, box)),
        Tree.Lift(Meta.set(scope, box, Tree.primitive(456)))
      ]);
    });
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    $_x_1_1 = 123;
    $_x_1_1;
    $_x_1_1 = 456;
  }`), Assert);
  // box //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, true, "x", Tree.primitive(123), (box) => {
        return Tree.sequence(Meta.get(scope, box), Meta.set(scope, box, Tree.primitive(456)));
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`), Assert);
  // dynamic //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, true, "x", Tree.primitive(123), (box) => {
        return Meta.get(Meta._extend_dynamic(scope, [], null), box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    ($_x_1_1 = 123, $_x_1_1);
  }`), Assert);
  // duplicate //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, true, "x", Tree.primitive(123), (box) => Meta.get(scope, box))),
      Tree.Lift(Meta.box(scope, true, "x", Tree.primitive(456), (box) => Meta.get(scope, box))),
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1, $_x_1_2;
    ($_x_1_1 = 123, $_x_1_1);
    ($_x_1_2 = 456, $_x_1_2);
  }`), Assert);
  ////////////////
  // Unwritable //
  ////////////////
  // Cannot be inlined (sequence) //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, false, "x", Tree.sequence(Tree.primitive(123), Tree.binary("+", Tree.primitive(456), Tree.primitive(789))), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(0)), new Error("Cannot set a constant meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    (
      (
        123,
        $_x_1_1 = (456 + 789)),
      $_x_1_1);
  }`), Assert);
  // Builtin //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, false, "x", Tree.builtin("eval"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(123)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    #eval;
  }`), Assert);
  // String Primitive //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, false, "x", Tree.primitive("foo"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive("bar")), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    "foo";
  }`), Assert);
  // Other Primitive //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, false, "x", Tree.primitive(123), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(456)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    123;
  }`), Assert);
  // Throw //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, false, "x", Tree.throw(Tree.primitive(123)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(456)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (throw 123, "dummy-primitive-box");
  }`), Assert);
  // Sequence //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, false, "x", Tree.sequence(Tree.primitive(123), Tree.primitive(456)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (123, 456);
  }`), Assert);
  // Write //
  Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), ["kind"], (scope) => {
    Meta._declare(scope, "kind", "y", true);
    return Tree.Bundle([
      Tree.Lift(Meta._initialize(scope, "kind", "y", Tree.primitive(123)).value),
      Tree.Lift(Meta.box(scope, false, "x", Meta.lookup(scope, "y", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (kind, access) => access(Tree.primitive(456)),
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y;
    $$y = 123;
    ($$y = 456, void 0);
  }`), Assert);
  // // Read Writable //
  // Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
  //   Meta._declare_base(scope, "let", "y");
  //   return Tree.Bundle([
  //     Tree.Lift(Meta._initialize_base(scope, "y", Tree.primitive(123)).value),
  //     Meta.Box(scope, "x", false, Meta.lookup_base(scope, "y", "ctx", {
  //       on_miss: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_live_hit: (context, writable, access) => {
  //         Assert.deepEqual(context, "ctx");
  //         Assert.deepEqual(writable, true);
  //         return access(null);
  //       },
  //       on_dynamic_frame: () => Assert.fail()
  //     }), (box) => {
  //       Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant meta box"));
  //       return Tree.Lift(Meta.get(scope, box));
  //     })
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $$y, $_x;
  //   $$y = 123;
  //   $_x = $$y;
  //   $_x;
  // }`), Assert);
  // // Read Base Unwritable //
  // Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), (scope) => {
  //   Meta._declare_base(scope, "y", false);
  //   return Tree.Bundle([
  //     Tree.Lift(Meta._initialize_base(scope, "y", Tree.primitive(123)).value),
  //     Tree.Lift(Meta.box(scope, "x", false, Meta.lookup_base(scope, "y", "ctx", {
  //       on_miss: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_live_hit: (context, writable, access) => {
  //         Assert.deepEqual(context, "ctx");
  //         Assert.deepEqual(writable, false);
  //         return access(null);
  //       },
  //       on_dynamic_frame: () => Assert.fail()
  //     }), (box) => {
  //       Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a non-meta box"));
  //       return Meta.get(scope, box);
  //     }))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $$y;
  //   $$y = 123;
  //   $$y;
  // }`), Assert);
  // // Read Meta Unwritable //
  // Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), (scope) => {
  //   return Meta.Box(scope, "x", false, Tree.unary("!", Tree.primitive(123)), (box) => {
  //     return Meta.Box(scope, "y", false, Meta.get(scope, box), (box) => {
  //       return Tree.Lift(Meta.get(scope, box));
  //     });
  //   });
  // }), Lang.PARSE_BLOCK(`{
  //   let $_x;
  //   $_x = !123;
  //   $_x;
  // }`), Assert);
});
