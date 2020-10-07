"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Outer = require("./outer.js");
const Meta = require("./meta.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // _box //
  Assert.throws(
    () => Meta._box(Outer._make_root(), "foo", true, Tree.primitive(123)),
    new Error("Scope._box cannot create writable boxes"));
  Assert.throws(
    () => Meta._box(Outer._make_root(), "foo", false, Tree.sequence(Tree.primitive(123), Tree.primitive(456))),
    new Error("Scope._box can only box primitive expressions or builtin expressions"));
  Assert.deepEqual(
    Meta.get(
      Outer._make_root(),
      Meta._box(Outer._make_root(), "foo", false, Tree.primitive(123))),
    Lang.parse_expression(`123`));
  Assert.deepEqual(
    Meta.get(
      Outer._make_root(),
      Meta._box(Outer._make_root(), "foo", false, Tree.builtin("global"))),
    Lang.parse_expression(`#global`));
  //////////////
  // Writable //
  //////////////
  // Box //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Meta.Box(scope, "x", true, Tree.primitive(123), (box) => {
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
  }`));
  // box //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", true, Tree.primitive(123), (box) => {
        return Tree.sequence(Meta.get(scope, box), Meta.set(scope, box, Tree.primitive(456)));
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`));
  // dynamic //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", true, Tree.primitive(123), (box) => {
        return Meta.get(Outer._extend_dynamic(scope, null), box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    ($_x_1_1 = 123, $_x_1_1);
  }`));
  // duplicate //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", true, Tree.primitive(123), (box) => Meta.get(scope, box))),
      Tree.Lift(Meta.box(scope, "x", true, Tree.primitive(456), (box) => Meta.get(scope, box))),
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1, $_x_1_2;
    ($_x_1_1 = 123, $_x_1_1);
    ($_x_1_2 = 456, $_x_1_2);
  }`));
  ////////////////
  // Unwritable //
  ////////////////
  // Cannot be inlined (sequence) //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", false, Tree.sequence(Tree.primitive(123), Tree.binary("+", Tree.primitive(456), Tree.primitive(789))), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(0)), new Error("Cannot set a constant box"));
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
  }`));
  // Builtin //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", false, Tree.builtin("global"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(123)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    #global;
  }`));
  // String Primitive //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", false, Tree.primitive("foo"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive("bar")), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    "foo";
  }`));
  // Other Primitive //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", false, Tree.primitive(123), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(456)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    123;
  }`));
  // Throw //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", false, Tree.throw(Tree.primitive(123)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(456)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (throw 123, "dummy-primitive-box");
  }`));
  // Sequence //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(Meta.box(scope, "x", false, Tree.sequence(Tree.primitive(123), Tree.primitive(456)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (123, 456);
  }`));
  // Write //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Outer._declare_base(scope, "y", true);
    return Tree.Bundle([
      Tree.Lift(Outer.initialize_base(scope, "y", Tree.primitive(123))),
      Tree.Lift(Meta.box(scope, "x", false, Outer.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(Tree.primitive(456));
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y;
    $$y = 123;
    ($$y = 456, void 0);
  }`));
  // Read Writable //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Outer._declare_base(scope, "y", true);
    return Tree.Bundle([
      Tree.Lift(Outer.initialize_base(scope, "y", Tree.primitive(123))),
      Tree.Lift(Meta.box(scope, "x", false, Outer.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y, $_x_1_1;
    $$y = 123;
    ($_x_1_1 = $$y, $_x_1_1);
  }`));
  // Read Base Unwritable //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Outer._declare_base(scope, "y", false);
    return Tree.Bundle([
      Tree.Lift(Outer.initialize_base(scope, "y", Tree.primitive(123))),
      Tree.Lift(Meta.box(scope, "x", false, Outer.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, false);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y;
    $$y = 123;
    $$y;
  }`));
  // Read Meta Unwritable //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    const identifier = Outer._declare_meta(scope, "y", false);
    return Tree.Bundle([
      Tree.Lift(Outer.initialize_meta(scope, identifier, Tree.primitive(123))),
      Tree.Lift(Meta.box(scope, "x", false, Outer.lookup_meta(scope, identifier, "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, false);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_y_1_1;
    $_y_1_1 = 123;
    $_y_1_1;
  }`));
});
