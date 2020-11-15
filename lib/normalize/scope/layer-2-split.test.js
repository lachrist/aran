"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Split = require("./layer-2-split.js");

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
  Assert.deepEqual(Split.EXTEND_STATIC(Split._extend_horizon(Split._make_root()), (scope) => {
    Assert.throws(() => Split._declare_meta(Split._extend_dynamic(scope, "foo"), "x", "bar"), new global.Error("Cannot declare meta variable on dynamic frame"));
    Assert.throws(() => Split.initialize_meta(Split._extend_dynamic(scope, "foo"), "x", Tree.primitive("bar")), new global.Error("Cannot initialize meta variable on dynamic frame"));
    Assert.deepEqual(Split._declare_base(scope, "x1", true), null);
    Assert.deepEqual(Split._is_writable_base(scope, "x1"), true);
    Assert.deepEqual(Split._declare_base(scope, "x2", false), null);
    Assert.throws(() => Split._declare_base(scope, "x2", false), new global.Error("Duplicate base variable declaration"));
    Assert.deepEqual(Split._declare_base(Split._extend_dynamic(scope, "qux"), "x2", false), "qux");
    Assert.deepEqual(Split._get_foreground_base(scope), ["x1", "x2"]);
    // Assert.deepEqual(Split._is_writable_base(scope, "x1"), true);
    // Assert.deepEqual(Split._is_writable_base(scope, "x2"), false);
    const identifier1 = Split._declare_meta(scope, "y", true);
    Assert.deepEqual(Split._is_writable_meta(scope, identifier1), true);
    const identifier2 = Split._declare_meta(scope, "y", false);
    Assert.deepEqual(Split._is_writable_meta(scope, identifier2), false);
    const identifier3 = Split._declare_meta(scope, "new.target", false);
    // Assert.deepEqual(Split._is_writable_meta(scope, identifier1), true);
    // Assert.deepEqual(Split._is_writable_meta(scope, identifier2), false);
    return Tree.Bundle([
      Tree.Lift(Split._initialize_base(scope, "x1", Tree.primitive(1)).value),
      Tree.Lift(Split._initialize_base(scope, "x2", Tree.primitive(2)).value),
      Tree.Lift(Split.initialize_meta(scope, identifier1, Tree.primitive(3))),
      Tree.Lift(Split.initialize_meta(scope, identifier2, Tree.primitive(4))),
      Tree.Lift(Split.initialize_meta(scope, identifier3, Tree.primitive(5))),
      Tree.Lift(Split.lookup_base(scope, "x1", "ctx", {
        on_miss: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_live_hit: (context, writable, access) => {
          Assert.deepEqual(context, "ctx");
          Assert.deepEqual(writable, true);
          return access(null);
        }
      })),
      Tree.Lift(Split.lookup_meta(scope, identifier1, "ctx", {
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
