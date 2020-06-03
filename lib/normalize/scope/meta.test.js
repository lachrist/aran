"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Meta = require("./meta.js");
const Outer = require("./outer.js");
const State = require("../state.js");
const Lang = require("../lang.js");
const Parser = require("../../../test/parser/index.js");

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  //////////////
  // Writable //
  //////////////
  // Box //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Meta.Box(scope, "x", true, Lang.primitive(123), (box) => {
      return Lang.Bundle([
        Lang.Lift(Meta.get(scope, box)),
        Lang.Lift(Meta.set(scope, box, Lang.primitive(456)))
      ]);
    });
  }), Parser.PARSE(`{
    let $_x_1_1;
    $_x_1_1 = 123;
    $_x_1_1;
    $_x_1_1 = 456;
  }`));
  // box //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", true, Lang.primitive(123), (box) => {
        return Lang.sequence(Meta.get(scope, box), Meta.set(scope, box, Lang.primitive(456)));
      }))
    ]);
  }), Parser.PARSE(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`));
  // dynamic //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", true, Lang.primitive(123), (box) => {
        return Meta.get(Outer._extend_dynamic(scope, null), box);
      }))
    ]);
  }), Parser.PARSE(`{
    let $_x_1_1;
    ($_x_1_1 = 123, $_x_1_1);
  }`));
  // duplicate //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", true, Lang.primitive(123), (box) => Meta.get(scope, box))),
      Lang.Lift(Meta.box(scope, "x", true, Lang.primitive(456), (box) => Meta.get(scope, box))),
    ]);
  }), Parser.PARSE(`{
    let $_x_1_1, $_x_1_2;
    ($_x_1_1 = 123, $_x_1_1);
    ($_x_1_2 = 456, $_x_1_2);
  }`));
  ////////////////
  // Unwritable //
  ////////////////
  // Cannot be inlined (sequence) //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", false, Lang.sequence(Lang.primitive(123), Lang.binary("+", Lang.primitive(456), Lang.primitive(789))), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(0)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    let $_x_1_1;
    ((123, $_x_1_1 = 456 + 789), $_x_1_1);
  }`));
  // Builtin //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", false, Lang.builtin("global"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(123)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    #global;
  }`));
  // String Primitive //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", false, Lang.primitive("foo"), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive("bar")), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    "foo";
  }`));
  // Other Primitive //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", false, Lang.primitive(123), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(456)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    123;
  }`));
  // Throw //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", false, Lang.throw(Lang.primitive(123)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(456)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    (throw 123, void 0);
  }`));
  // Sequence //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    return Lang.Bundle([
      Lang.Lift(Meta.box(scope, "x", false, Lang.sequence(Lang.primitive(123), Lang.primitive(456)), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(789)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    (123, 456);
  }`));
  // Write //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Outer._declare_base(scope, "y", true);
    return Lang.Bundle([
      Lang.Lift(Outer.initialize_base(scope, "y", Lang.primitive(123))),
      Lang.Lift(Meta.box(scope, "x", false, Outer.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(Lang.primitive(456));
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(789)), new Error("Cannot set a primitive/builtin box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    let $$y;
    $$y = 123;
    ($$y = 456, void 0);
  }`));
  // Read Writable //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Outer._declare_base(scope, "y", true);
    return Lang.Bundle([
      Lang.Lift(Outer.initialize_base(scope, "y", Lang.primitive(123))),
      Lang.Lift(Meta.box(scope, "x", false, Outer.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(789)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    let $$y, $_x_1_1;
    $$y = 123;
    ($_x_1_1 = $$y, $_x_1_1);
  }`));
  // Read Base Unwritable //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Outer._declare_base(scope, "y", false);
    return Lang.Bundle([
      Lang.Lift(Outer.initialize_base(scope, "y", Lang.primitive(123))),
      Lang.Lift(Meta.box(scope, "x", false, Outer.lookup_base(scope, "y", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, false);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(789)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    let $$y;
    $$y = 123;
    $$y;
  }`));
  // Read Meta Unwritable //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    const identifier = Outer._declare_meta(scope, "y", false);
    return Lang.Bundle([
      Lang.Lift(Outer.initialize_meta(scope, identifier, Lang.primitive(123))),
      Lang.Lift(Meta.box(scope, "x", false, Outer.lookup_meta(scope, identifier, "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, false);
          return access(null);
        },
        on_dynamic_frame: () => Assert.fail()
      }), (box) => {
        Assert.throws(() => Meta.set(scope, box, Lang.primitive(789)), new Error("Cannot set a constant box"));
        return Meta.get(scope, box);
      }))
    ]);
  }), Parser.PARSE(`{
    let $_y_1_1;
    $_y_1_1 = 123;
    $_y_1_1;
  }`));
});
