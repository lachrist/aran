"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Outer = require("./outer.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Lang = require("../../lang/index.js");

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope) => {
    Assert.deepEqual(Outer._declare_base(scope, "x1", true), undefined);
    Assert.deepEqual(Outer._declare_base(scope, "x2", false), undefined);
    Assert.deepEqual(Outer._is_writable_base(scope, "x1"), true);
    Assert.deepEqual(Outer._is_writable_base(scope, "x2"), false);
    const identifier1 = Outer._declare_meta(scope, "y", true);
    const identifier2 = Outer._declare_meta(scope, "y", false);
    const identifier3 = Outer._declare_meta(scope, "new.target", false);
    Assert.deepEqual(Outer._is_writable_meta(scope, identifier1), true);
    Assert.deepEqual(Outer._is_writable_meta(scope, identifier2), false);
    return Tree.Bundle([
      Tree.Lift(Outer.initialize_base(scope, "x1", Tree.primitive(1))),
      Tree.Lift(Outer.initialize_base(scope, "x2", Tree.primitive(2))),
      Tree.Lift(Outer.initialize_meta(scope, identifier1, Tree.primitive(3))),
      Tree.Lift(Outer.initialize_meta(scope, identifier2, Tree.primitive(4))),
      Tree.Lift(Outer.initialize_meta(scope, identifier3, Tree.primitive(5))),
      Tree.Lift(Outer.lookup_base(scope, "x1", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        }
      })),
      Tree.Lift(Outer.lookup_meta(scope, identifier1, "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$x1, $$x2, $_y_1_1, $_y_1_2, $_new_target_1_1;
    $$x1 = 1;
    $$x2 = 2;
    $_y_1_1 = 3;
    $_y_1_2 = 4;
    $_new_target_1_1 = 5;
    $$x1;
    $_y_1_1;
  }`));
});
