"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Split = require("./layer-2-split.js");

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  Lang._match_block(Split.EXTEND_STATIC(Split._make_root(), ["kind-base"], ["kind-meta"], (scope) => {
    // Declare //
    Assert.deepEqual(Split._declare_base(scope, "kind-base", "x_base"), {static:true, value:null});
    Assert.deepEqual(Split._declare_meta(scope, "kind-meta", "x_meta"), {static:true, value:null});
    // Initialize //
    const result_base = Split._initialize_base(scope, "kind-base", "x_base", Tree.primitive("value-base"), false);
    Assert.deepEqual(result_base.static, true);
    const result_meta = Split._initialize_meta(scope, "kind-meta", "x_meta", Tree.primitive("value-meta"), false);
    Assert.deepEqual(result_meta.static, true);
    // Availability //
    Assert.deepEqual(Split._is_available_base(scope, "kind-base", "x_base", {
      foo: "bar",
      static: function (kind) {
        Assert.deepEqual(this.foo, "bar"),
        Assert.deepEqual(kind, "kind-base");
        return true;
      }
    }), []);
    Assert.deepEqual(Split._is_available_meta(scope, "kind-meta", "x_meta", {
      foo: "bar",
      static: function (kind) {
        Assert.deepEqual(this.foo, "bar"),
        Assert.deepEqual(kind, "kind-meta");
        return true;
      }
    }), []);
    // Lookup //
    Assert.deepEqual(Split._declare_base(scope, "kind-base", "y_base"), {static:true, value:null});
    Assert.deepEqual(Split._declare_base(scope, "kind-base", "y_base"), {static:true, value:"kind-base"});
    Assert.deepEqual(Split._declare_meta(scope, "kind-meta", "y_meta"), {static:true, value:null});
    Assert.deepEqual(Split._declare_meta(scope, "kind-meta", "y_meta"), {static:true, value:"kind-meta"});
    const lookup_callback_prototype = {
      foo: "bar",
      on_miss: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail(),
      on_dynamic_frame: () => Assert.fail()
    };
    return Tree.Bundle([
      // _initialize //
      Tree.Lift(result_base.value),
      Tree.Lift(result_meta.value),
      // // ImportInitialize //
      // (
      //   Split._declare_base(scope, "kind-base", "import_base"),
      //   Split.ImportInitializeBase(scope, "kind-base", "import_base", "source-base", false)),
      // (
      //   Split._declare_meta(scope, "kind-meta", "import_meta"),
      //   Split.ImportInitializeMeta(scope, "kind-meta", "import_meta", "source-meta", false)),
      // Lookup >> Miss && Dynamic Frame //
      Tree.Lift(Split.lookup_base(Split._extend_dynamic(scope, [], [], "dynamic-frame"), "z_base", {
        __proto__: lookup_callback_prototype,
        on_miss: function () {
          Assert.deepEqual(this.foo, "bar");
          return Tree.primitive("miss-base");
        },
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.sequence(Tree.primitive("dynamic-frame-base"), expression);
        }
      })),
      Tree.Lift(Split.lookup_meta(Split._extend_dynamic(scope, [], [], "dynamic-frame"), "z_meta", {
        __proto__: lookup_callback_prototype,
        on_miss: function () {
          Assert.deepEqual(this.foo, "bar");
          return Tree.primitive("miss-meta");
        },
        on_dynamic_frame: function (frame, expression) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(frame, "dynamic-frame");
          return Tree.sequence(Tree.primitive("dynamic-frame-meta"), expression);
        }
      })),
      // Lookup >> Dead Hit //
      Tree.Lift(Split.lookup_base(scope, "y_base", {
        __proto__: lookup_callback_prototype,
        on_dead_hit: function (kind) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind-base");
          return Tree.primitive("dead-hit-base");
        }
      })),
      Tree.Lift(Split.lookup_meta(scope, "y_meta", {
        __proto__: lookup_callback_prototype,
        on_dead_hit: function (kind) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind-meta");
          return Tree.primitive("dead-hit-meta");
        }
      })),
      // Lookup >> Live Hit
      Tree.Lift(Split.lookup_base(scope, "x_base", {
        __proto__: lookup_callback_prototype,
        on_live_hit: function (kind, access) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind-base");
          return Tree.primitive("live-hit-base");
        }
      })),
      Tree.Lift(Split.lookup_meta(scope, "x_meta", {
        __proto__: lookup_callback_prototype,
        on_live_hit: function (kind, access) {
          Assert.deepEqual(this.foo, "bar");
          Assert.deepEqual(kind, "kind-meta");
          return Tree.primitive("live-hit-meta");
        }
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$x_base, $_x_meta, $$y_base, $_y_meta;
    $$x_base = "value-base";
    $_x_meta = "value-meta";
    ("dynamic-frame-base", "miss-base");
    ("dynamic-frame-meta", "miss-meta");
    "dead-hit-base";
    "dead-hit-meta";
    "live-hit-base";
    "live-hit-meta";
  }`), Assert);
}, []);
