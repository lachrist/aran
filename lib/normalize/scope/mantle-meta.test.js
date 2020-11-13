"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const OuterCore = require("./outer-core.js");
const MantleMeta = require("./mantle-meta.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // _primitive_box //
  Assert.deepEqual(
    MantleMeta.get(
      OuterCore._make_root(),
      MantleMeta._primitive_box(123)),
    Lang.parse_expression(`123`));
  // _builtin_box //
  Assert.deepEqual(
    MantleMeta.get(
      OuterCore._make_root(),
      MantleMeta._builtin_box("eval")),
    Lang.parse_expression(`#eval`));
  // // _box //
  // Assert.throws(
  //   () => MantleMeta._box(OuterCore._make_root(), "foo", true, Tree.primitive(123)),
  //   new Error("Scope._box cannot create writable boxes"));
  // Assert.throws(
  //   () => MantleMeta._box(OuterCore._make_root(), "foo", false, Tree.sequence(Tree.primitive(123), Tree.primitive(456))),
  //   new Error("Scope._box can only box primitive expressions or builtin expressions"));
  // Assert.deepEqual(
  //   MantleMeta.get(
  //     OuterCore._make_root(),
  //     MantleMeta._box(OuterCore._make_root(), "foo", false, Tree.primitive(123))),
  //   Lang.parse_expression(`123`));
  // Assert.deepEqual(
  //   MantleMeta.get(
  //     OuterCore._make_root(),
  //     MantleMeta._box(OuterCore._make_root(), "foo", false, Tree.builtin("global"))),
  //   Lang.parse_expression(`#global`));
  //////////////
  // Writable //
  //////////////
  // Box //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return MantleMeta.Box(scope, "x", true, Tree.primitive(123), (box) => {
      return Tree.Bundle([
        Tree.Lift(MantleMeta.get(scope, box)),
        Tree.Lift(MantleMeta.set(scope, box, Tree.primitive(456)))
      ]);
    });
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    $_x_1_1 = 123;
    $_x_1_1;
    $_x_1_1 = 456;
  }`));
  // box //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", true, Tree.primitive(123), (box) => {
        return Tree.sequence(MantleMeta.get(scope, box), MantleMeta.set(scope, box, Tree.primitive(456)));
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`));
  // dynamic //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", true, Tree.primitive(123), (box) => {
        return MantleMeta.get(OuterCore._extend_dynamic(scope, null), box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_x_1_1;
    ($_x_1_1 = 123, $_x_1_1);
  }`));
  // duplicate //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", true, Tree.primitive(123), (box) => MantleMeta.get(scope, box))),
      Tree.Lift(MantleMeta.box(scope, "x", true, Tree.primitive(456), (box) => MantleMeta.get(scope, box))),
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
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", false, Tree.sequence(Tree.primitive(123), Tree.binary("+", Tree.primitive(456), Tree.primitive(789))), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(0)), new Error("Cannot set a constant box"));
        return MantleMeta.get(scope, box);
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
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", false, Tree.builtin("eval"), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(123)), new Error("Cannot set a primitive/builtin box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    #eval;
  }`));
  // String Primitive //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", false, Tree.primitive("foo"), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive("bar")), new Error("Cannot set a primitive/builtin box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    "foo";
  }`));
  // Other Primitive //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", false, Tree.primitive(123), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(456)), new Error("Cannot set a primitive/builtin box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    123;
  }`));
  // Throw //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", false, Tree.throw(Tree.primitive(123)), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(456)), new Error("Cannot set a primitive/builtin box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (throw 123, "dummy-primitive-box");
  }`));
  // Sequence //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    return Tree.Bundle([
      Tree.Lift(MantleMeta.box(scope, "x", false, Tree.sequence(Tree.primitive(123), Tree.primitive(456)), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a primitive/builtin box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    (123, 456);
  }`));
  // Write //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    OuterCore._declare_base(scope, "y", true);
    return Tree.Bundle([
      Tree.Lift(OuterCore.initialize_base(scope, "y", Tree.primitive(123))),
      Tree.Lift(MantleMeta.box(scope, "x", false, OuterCore.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(Tree.primitive(456));
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a primitive/builtin box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y;
    $$y = 123;
    ($$y = 456, void 0);
  }`));
  // Read Writable //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    OuterCore._declare_base(scope, "y", true);
    return Tree.Bundle([
      Tree.Lift(OuterCore.initialize_base(scope, "y", Tree.primitive(123))),
      Tree.Lift(MantleMeta.box(scope, "x", false, OuterCore.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y, $_x_1_1;
    $$y = 123;
    ($_x_1_1 = $$y, $_x_1_1);
  }`));
  // // Read Base Unwritable //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    OuterCore._declare_base(scope, "y", false);
    return Tree.Bundle([
      Tree.Lift(OuterCore.initialize_base(scope, "y", Tree.primitive(123))),
      Tree.Lift(MantleMeta.box(scope, "x", false, OuterCore.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, false);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$y, $_x_1_1;
    $$y = 123;
    (
      $_x_1_1 = $$y,
      $_x_1_1);
  }`));
  // Read MantleMeta Unwritable //
  Assert.deepEqual(OuterCore.EXTEND_STATIC(OuterCore._make_root(), (scope) => {
    const identifier = OuterCore._declare_meta(scope, "y", false);
    return Tree.Bundle([
      Tree.Lift(OuterCore.initialize_meta(scope, identifier, Tree.primitive(123))),
      Tree.Lift(MantleMeta.box(scope, "x", false, OuterCore.lookup_meta(scope, identifier, "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, false);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => MantleMeta.set(scope, box, Tree.primitive(789)), new Error("Cannot set a constant box"));
        return MantleMeta.get(scope, box);
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $_y_1_1, $_x_1_1;
    $_y_1_1 = 123;
    (
      $_x_1_1 = $_y_1_1,
      $_x_1_1);
  }`));
});
