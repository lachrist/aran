"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Meta = require("./layer-3-meta.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // _test_box //
  Lang._match(
    Meta.get(
      Meta._make_root(),
      Meta._test_box("foo")),
    Lang.parseExpression(`foo`),
    Assert);
  Lang._match(
    Meta.set(
      Meta._make_root(),
      Meta._test_box("foo"),
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`foo = 123`),
    Assert);
  // _primitive_box //
  Lang._match(
    Meta.get(
      Meta._make_root(),
      Meta._primitive_box(123)),
    Lang.parseExpression(`123`),
    Assert);
  // _intrinsic_box //
  Lang._match(
    Meta.get(
      Meta._make_root(),
      Meta._intrinsic_box("eval")),
    Lang.parseExpression(`#eval`),
    Assert);
  // // _box //
  // Assert.throws(
  //   () => Meta._box(Meta._make_root(), "foo", true, Tree.PrimitiveExpression(123)),
  //   new Error("Scope._box cannot create writable boxes"));
  // Assert.throws(
  //   () => Meta._box(Meta._make_root(), "foo", false, Tree.SequenceExpression(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456))),
  //   new Error("Scope._box can only box primitive expressions or intrinsic expressions"));
  // Assert.deepEqual(
  //   Meta.get(
  //     Meta._make_root(),
  //     Meta._box(Meta._make_root(), "foo", false, Tree.PrimitiveExpression(123))),
  //   Lang.parseExpression(`123`));
  // Assert.deepEqual(
  //   Meta.get(
  //     Meta._make_root(),
  //     Meta._box(Meta._make_root(), "foo", false, Tree.IntrinsicExpression("global"))),
  //   Lang.parseExpression(`#global`));
  ////////////
  // Import //
  ////////////
  // Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
  //   return Meta.ImportBox(scope, "x", "foobar", (box) => {
  //     Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(123)), new global.Error("Cannot set a constant meta box"));
  //     return Tree.ExpressionStatement(Meta.get(scope, box));
  //   });
  // }), Lang.parseBlock(`{
  //   let $_x_1_1;
  //   import * as $_x_1_1 from "foobar";
  //   $_x_1_1;
  // }`), Assert);
  //////////////
  // Writable //
  //////////////
  // Box //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Meta.Box(scope, true, "x", Tree.PrimitiveExpression(123), (box) => {
      return Tree.BundleStatement([
        Tree.ExpressionStatement(Meta.get(scope, box)),
        Tree.ExpressionStatement(Meta.set(scope, box, Tree.PrimitiveExpression(456)))
      ]);
    });
  }), Lang.parseBlock(`{
    let $_x_1_1;
    $_x_1_1 = 123;
    $_x_1_1;
    $_x_1_1 = 456;
  }`), Assert);
  // box //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, true, "x", Tree.PrimitiveExpression(123), (box) => {
        return Tree.SequenceExpression(Meta.get(scope, box), Meta.set(scope, box, Tree.PrimitiveExpression(456)));
      }))
    ]);
  }), Lang.parseBlock(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`), Assert);
  // dynamic //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, true, "x", Tree.PrimitiveExpression(123), (box) => {
        return Meta.get(Meta._extend_dynamic(scope, [], null), box);
      }))
    ]);
  }), Lang.parseBlock(`{
    let $_x_1_1;
    ($_x_1_1 = 123, $_x_1_1);
  }`), Assert);
  // duplicate //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, true, "x", Tree.PrimitiveExpression(123), (box) => Meta.get(scope, box))),
      Tree.ExpressionStatement(Meta.box(scope, true, "x", Tree.PrimitiveExpression(456), (box) => Meta.get(scope, box))),
    ]);
  }), Lang.parseBlock(`{
    let $_x_1_1, $_x_1_2;
    ($_x_1_1 = 123, $_x_1_1);
    ($_x_1_2 = 456, $_x_1_2);
  }`), Assert);
  ////////////////
  // Unwritable //
  ////////////////
  // Cannot be inlined (sequence) //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Tree.SequenceExpression(Tree.PrimitiveExpression(123), Tree.BinaryExpression("+", Tree.PrimitiveExpression(456), Tree.PrimitiveExpression(789))), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(0)), new Error("Cannot set a constant meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    let $_x_1_1;
    (
      (
        123,
        $_x_1_1 = (456 + 789)),
      $_x_1_1);
  }`), Assert);
  // Intrinsic //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Tree.IntrinsicExpression("eval"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(123)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    #eval;
  }`), Assert);
  // String Primitive //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Tree.PrimitiveExpression("foo"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression("bar")), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    "foo";
  }`), Assert);
  // Other Primitive //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Tree.PrimitiveExpression(123), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(456)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    123;
  }`), Assert);
  // Throw //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Tree.ThrowExpression(Tree.PrimitiveExpression(123)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(456)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    (throw 123, "dummy-primitive-box");
  }`), Assert);
  // Sequence //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], [], (scope) => {
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Tree.SequenceExpression(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    (123, 456);
  }`), Assert);
  // Write //
  Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], ["kind"], (scope) => {
    Meta._declare(scope, {kind:"kind", ghost:false, name:"y"});
    return Tree.BundleStatement([
      Tree.ExpressionStatement(Meta._initialize(scope, "kind", "y").initialize(Tree.PrimitiveExpression(123))),
      Tree.ExpressionStatement(Meta.box(scope, false, "x", Meta.lookup(scope, "y", {
        on_miss: () => Assert.fail(),
        on_static_dead_hit: () => Assert.fail(),
        on_static_live_hit: (variable, read, write) => write(Tree.PrimitiveExpression(456)),
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a non-meta box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.parseBlock(`{
    let $$y;
    $$y = 123;
    ($$y = 456, void 0);
  }`), Assert);
  // // Read Writable //
  // Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
  //   Meta._declare_base(scope, "let", "y");
  //   return Tree.BundleStatement([
  //     Tree.ExpressionStatement(Meta._initialize_base(scope, "y", Tree.PrimitiveExpression(123)).value),
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
  //       Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a constant meta box"));
  //       return Tree.ExpressionStatement(Meta.get(scope, box));
  //     })
  //   ]);
  // }), Lang.parseBlock(`{
  //   let $$y, $_x;
  //   $$y = 123;
  //   $_x = $$y;
  //   $_x;
  // }`), Assert);
  // // Read Base Unwritable //
  // Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), (scope) => {
  //   Meta._declare_base(scope, "y", false);
  //   return Tree.BundleStatement([
  //     Tree.ExpressionStatement(Meta._initialize_base(scope, "y", Tree.PrimitiveExpression(123)).value),
  //     Tree.ExpressionStatement(Meta.box(scope, "x", false, Meta.lookup_base(scope, "y", "ctx", {
  //       on_miss: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_live_hit: (context, writable, access) => {
  //         Assert.deepEqual(context, "ctx");
  //         Assert.deepEqual(writable, false);
  //         return access(null);
  //       },
  //       on_dynamic_frame: () => Assert.fail()
  //     }), (box) => {
  //       Assert.throws(() => Meta.set(scope, box, Tree.PrimitiveExpression(789)), new Error("Cannot set a non-meta box"));
  //       return Meta.get(scope, box);
  //     }))
  //   ]);
  // }), Lang.parseBlock(`{
  //   let $$y;
  //   $$y = 123;
  //   $$y;
  // }`), Assert);
  // // Read Meta Unwritable //
  // Lang._match(Meta.EXTEND_STATIC(Meta._make_root(), (scope) => {
  //   return Meta.Box(scope, "x", false, Tree.UnaryExpression("!", Tree.PrimitiveExpression(123)), (box) => {
  //     return Meta.Box(scope, "y", false, Meta.get(scope, box), (box) => {
  //       return Tree.ExpressionStatement(Meta.get(scope, box));
  //     });
  //   });
  // }), Lang.parseBlock(`{
  //   let $_x;
  //   $_x = !123;
  //   $_x;
  // }`), Assert);
});
