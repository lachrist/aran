
"use strict";

Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
const Outer = require("./outer.js");
const Lang = require("../lang.js");
const State = require("../state.js");
const Parser = require("../../../test/parser/index.js");

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {
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
    return Lang.Bundle([
      Lang.Lift(Outer.initialize_base(scope, "x1", Lang.primitive(1))),
      Lang.Lift(Outer.initialize_base(scope, "x2", Lang.primitive(2))),
      Lang.Lift(Outer.initialize_meta(scope, identifier1, Lang.primitive(3))),
      Lang.Lift(Outer.initialize_meta(scope, identifier2, Lang.primitive(4))),
      Lang.Lift(Outer.initialize_meta(scope, identifier3, Lang.primitive(5))),
      Lang.Lift(Outer.lookup_base(scope, "x1", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        }
      })),
      Lang.Lift(Outer.lookup_meta(scope, identifier1, "ctx", {
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
  }), Parser.PARSE(`{
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

