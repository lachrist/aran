"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Split = require("./layer-2-split.js");

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
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
    let marker = null;
    Assert.deepEqual(Split._is_available_base(Split._extend_dynamic(scope, [], [], "dynamic-frame"), "kind-base", "x_base", {
      foo: "bar",
      dynamic: function (frame) {
        Assert.deepEqual(marker, null);
        marker = "dynamic";
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(frame, "dynamic-frame");
        return true;
      },
      static: function (kind) {
        Assert.deepEqual(marker, "dynamic");
        marker = "static";
        Assert.deepEqual(this.foo, "bar"),
        Assert.deepEqual(kind, "kind-base");
        return true
      }
    }), true);
    Assert.deepEqual(marker, "static");
    marker = null;
    Assert.deepEqual(Split._is_available_meta(Split._extend_dynamic(scope, [], [], "dynamic-frame"), "kind-meta", "x_meta", {
      foo: "bar",
      dynamic: function (frame) {
        Assert.deepEqual(marker, null);
        marker = "dynamic";
        Assert.deepEqual(this.foo, "bar");
        Assert.deepEqual(frame, "dynamic-frame");
        return true;
      },
      static: function (kind) {
        Assert.deepEqual(marker, "dynamic");
        marker = "static";
        Assert.deepEqual(this.foo, "bar"),
        Assert.deepEqual(kind, "kind-meta");
        return true
      }
    }), true);
    Assert.deepEqual(marker, "static");
    // Lookup //
    // Assert.deepEqual(Split._is_writable_base(scope, "x1"), true);
    // Assert.deepEqual(Split._declare_base(scope, "x2", false), null);
    // Assert.throws(() => Split._declare_base(scope, "x2", false), new global.Error("Duplicate base variable declaration"));
    // Assert.deepEqual(Split._declare_base(Split._extend_dynamic(scope, "qux"), "x2", false), "qux");
    // Assert.deepEqual(Split._get_foreground_base(scope), ["x1", "x2"]);
    // // Assert.deepEqual(Split._is_writable_base(scope, "x1"), true);
    // // Assert.deepEqual(Split._is_writable_base(scope, "x2"), false);
    // const identifier1 = Split._declare_meta(scope, "y", true);
    // Assert.deepEqual(Split._is_writable_meta(scope, identifier1), true);
    // const identifier2 = Split._declare_meta(scope, "y", false);
    // Assert.deepEqual(Split._is_writable_meta(scope, identifier2), false);
    // const identifier3 = Split._declare_meta(scope, "new.target", false);
    // Assert.deepEqual(Split._is_writable_meta(scope, identifier1), true);
    // Assert.deepEqual(Split._is_writable_meta(scope, identifier2), false);
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
      // ImportInitialize //
      (
        Split._declare_base(scope, "kind-base", "import_base"),
        Split.ImportInitializeBase(scope, "kind-base", "import_base", "source-base", false)),
      (
        Split._declare_meta(scope, "kind-meta", "import_meta"),
        Split.ImportInitializeMeta(scope, "kind-meta", "import_meta", "source-meta", false)),
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

      // Tree.Lift(Split._initialize_base(scope, "x1", Tree.primitive(1)).value),
      // Tree.Lift(Split._initialize_base(scope, "x2", Tree.primitive(2)).value),
      // Tree.Lift(Split.initialize_meta(scope, identifier1, Tree.primitive(3))),
      // Tree.Lift(Split.initialize_meta(scope, identifier2, Tree.primitive(4))),
      // Tree.Lift(Split.initialize_meta(scope, identifier3, Tree.primitive(5))),
      // Tree.Lift(Split.lookup_base(scope, "x1", "ctx", {
      //   foo: "bar",
      //   on_miss: () => Assert.fail(),
      //   on_dead_hit: () => Assert.fail(),
      //   on_dynamic_frame: () => Assert.fail(),
      //   on_live_hit: (context, writable, access) => {
      //     Assert.deepEqual(context, "ctx");
      //     Assert.deepEqual(writable, true);
      //     return access(null);
      //   }
      // })),
      // Tree.Lift(Split.lookup_meta(scope, identifier1, "ctx", {
      //   on_miss: () => Assert.fail(),
      //   on_dead_hit: () => Assert.fail(),
      //   on_dynamic_frame: () => Assert.fail(),
      //   on_live_hit: (context, writable, access) => {
      //     Assert.deepEqual(context, "ctx");
      //     Assert.deepEqual(writable, true);
      //     return access(null);
      //   }
      // }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$x_base, $_x_meta, $$y_base, $_y_meta, $$import_base, $_import_meta;
    $$x_base = "value-base";
    $_x_meta = "value-meta";
    import * as $$import_base from "source-base";
    import * as $_import_meta from "source-meta";
    ("dynamic-frame-base", "miss-base");
    ("dynamic-frame-meta", "miss-meta");
    "dead-hit-base";
    "dead-hit-meta";
    "live-hit-base";
    "live-hit-meta";
  }`), Assert);
});
