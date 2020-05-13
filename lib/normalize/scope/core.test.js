"use strict";

const Assert = require("assert").strict;
const Core = require("./core.js");
const State = require("../state.js");
const Build = require("../../build.js");

require("../../build.js")._debug_mode();

const evals = {__proto__:null};

State.session({nodes:[], serials:new Map(), evals}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // is_strict //
  [true, false].forEach((is_use_strict_1) => {
    [true, false].forEach((is_use_strict_2) => {
      Assert.deepEqual(Core.GLOBAL(is_use_strict_1, (scope) => {
        Assert.equal(Core._is_strict(scope), is_use_strict_1);
        return Build.Lone([], Core.CLOSURE(scope, is_use_strict_2, (scope) => {
          Assert.equal(Core._is_strict(scope), is_use_strict_1 || is_use_strict_2);
          return [];
        }));
      }), Build.BLOCK([], Build.Lone([], Build.BLOCK([], []))));
    });
  });
  // get_depth //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._get_depth(scope), 1);
    return Build.Lone([], Core.REGULAR(scope, (scope) => {
      Assert.equal(Core._get_depth(scope), 2);
      return [];
    }));
  }), Build.BLOCK([], Build.Lone([], Build.BLOCK([], []))));
  // uninitialized //
  Assert.throws(() => Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [];
  }), new Error("Uninitialized identifier"));
  // declare //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Identifier already declared"));
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.write("$x", Build.primitive(123)))
  ].flat()));
  // is_declared //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._is_declared(scope, "x"), false);
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    Assert.equal(Core._is_declared(scope, "x"), true);
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.write("$x", Build.primitive(123)))
  ].flat()));
  // initialize //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(123)), new Error("Cannot initialize undeclared identifier"));
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    const aran_expression = Core.initialize(scope, "x", Build.primitive(456));
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(789)), new Error("Identifier already initialized"));
    return [
      Build.Expression(aran_expression)
    ].flat();
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.write("$x", Build.primitive(456)))
  ].flat()));
  // parameter //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    return [
      Build.Expression(Core.parameter(scope, "new.target"))
    ].flat();
  }), Build.BLOCK([], [
    Build.Expression(Build.read("NEW_TARGET"))
  ].flat()));
  // lookup-miss && shadowing //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    const aran_expression = Core.lookup(scope, "x", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Build.primitive(123);
      },
      on_dynamic_frame: Assert.fail.bind(Assert),
      on_dead_hit: Assert.fail.bind(Assert),
      on_live_hit: Assert.fail.bind(Assert)
    }, "ctx");
    Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Illegal identifier shadowing"));
    Assert.equal(Core._declare(scope, "y", "tag"), undefined);
    return [
      Build.Expression(aran_expression),
      Build.Expression(Core.initialize(scope, "y", Build.primitive(456)))
    ].flat();
  }), Build.BLOCK(["$y"], [
    Build.Expression(Build.primitive(123)),
    Build.Expression(Build.write("$y", Build.primitive(456)))
  ].flat()));
  // lookup-live //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123))),
      Build.Expression(Core.lookup(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert),
        on_dead_hit: Assert.fail.bind(Assert),
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.sequence(access(null), access(Build.primitive(456)));
        }
      }, "ctx"))
    ].flat();
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.write("$x", Build.primitive(123))),
    Build.Expression(Build.sequence(Build.read("$x"), Build.write("$x", Build.primitive(456))))
  ].flat()));
  // lookup-hit-dead-static //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Expression(Core.lookup(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(456);
        },
        on_live_hit: Assert.fail.bind(Assert)
      }, "ctx")),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.primitive(456)),
    Build.Expression(Build.write("$x", Build.primitive(123)))
  ].flat()));
  // lookup-hit-dead-dynamic //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Lone([], Core.CLOSURE(scope, false, (scope) => {
        return [
          Build.Expression(Core.lookup(scope, "x", {
            on_miss: Assert.fail.bind(Assert),
            on_dynamic_frame: Assert.fail.bind(Assert),
            on_dead_hit: (context, tag) => {
              Assert.equal(context, "ctx");
              Assert.equal(tag, "tag");
              return Build.primitive(456)
            },
            on_live_hit: (context, tag, access) => {
              Assert.equal(context, "ctx");
              Assert.equal(tag, "tag");
              return access(null);
            }
          }, "ctx"))
        ].flat();
      })),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Build.BLOCK(["$x", "_x"], [
    Build.Expression(Build.write("_x", Build.primitive(false))),
    Build.Lone([], Build.BLOCK([], [
      Build.Expression(Build.conditional(Build.read("_x"), Build.read("$x"), Build.primitive(456)))
    ].flat())),
    Build.Expression(Build.sequence(Build.write("$x", Build.primitive(123)), Build.write("_x", Build.primitive(true))))
  ].flat()));
  // lookup-dynamic-frame //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    return [
      Build.Lone([], Core.DYNAMIC(scope, "dyn", (scope) => {
        return [
          Build.Expression(Core.lookup(scope, "x", {
            on_miss: (context) => {
              Assert.equal(context, "ctx");
              return Build.primitive(123);
            },
            on_live_hit: Assert.fail.bind(Assert),
            on_dead_hit: Assert.fail.bind(Assert),
            on_dynamic_frame: (context, dynamic, aran_expression) => {
              Assert.equal(context, "ctx");
              Assert.equal(dynamic, "dyn");
              return Build.sequence(aran_expression, Build.primitive(456))
            }
          }, "ctx"))
        ].flat();
      }))
    ].flat();
  }), Build.BLOCK([], [
    Build.Lone([], Build.BLOCK([], [
      Build.Expression(Build.sequence(Build.primitive(123), Build.primitive(456)))
    ].flat()))
  ].flat()));
  // eval //
  Assert.deepEqual(Core.GLOBAL(true, (scope) => {
    Core._declare(scope, "x", "tag");
    return [
      Build.Expression(Core.eval(scope, Build.primitive(123))),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(456)))
    ].flat();
  }), Build.BLOCK(["$x"], [
    Build.Expression(Build.eval(["$x"], Build.primitive(123))),
    Build.Expression(Build.write("$x", Build.primitive(456)))
  ].flat()));
  // extend-eval //
  [evals[0], JSON.parse(JSON.stringify(evals[0]))].forEach((frame_array) => {
    Assert.deepEqual(Core.EVAL(frame_array, false, (scope) => {
      Assert.equal(Core._is_strict(scope), true);
      Assert.equal(Core._get_depth(scope), 2);
      return [
        Build.Expression(Core.lookup(scope, "x", {
          on_miss: Assert.fail.bind(Assert),
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_live_hit: Assert.fail.bind(Assert),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Build.primitive(123);
          }
        }, "ctx")),
        Build.Expression(Core.lookup(scope, "y", {
          on_miss: (context) => {
            Assert.equal(context, "ctx");
            return Build.primitive(456);
          },
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_live_hit: Assert.fail.bind(Assert),
          on_dead_hit: Assert.fail.bind(Assert)
        }, "ctx"))
      ].flat();
    }), Build.BLOCK([], [
      Build.Expression(Build.primitive(123)),
      Build.Expression(Build.primitive(456))
    ].flat()));
  });
  // eval-escaped //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Core._declare(scope, "x", "tag");
    return [
      Build.Lone([], Core.CLOSURE(scope, false, (scope) => {
        return [
          Build.Expression(Core.eval(scope, Build.primitive(123)))
        ].flat();
      })),
      Build.Expression(Core.initialize(scope, "x", Build.primitive(456)))
    ].flat();
  }), Build.BLOCK(["$x", "_x"], [
    Build.Expression(Build.write("_x", Build.primitive(false))),
    Build.Lone([], Build.BLOCK([], [
      Build.Expression(Build.eval(["$x", "_x"], Build.primitive(123)))
    ].flat())),
    Build.Expression(Build.sequence(Build.write("$x", Build.primitive(456)), Build.write("_x", Build.primitive(true))))
  ].flat()));
  // eval-duplicate //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Core._declare(scope, "x", "tag");
    Core._declare(scope, "y", "tag");
    return [
      Build.Expression(Core.initialize(scope, "x", Build.primitive(12))),
      Build.Expression(Core.initialize(scope, "y", Build.primitive(34))),
      Build.Lone([], Core.REGULAR(scope, (scope) => {
        Core._declare(scope, "x", "tag");
        return [
          Build.Expression(Core.initialize(scope, "x", Build.primitive(56))),
          Build.Expression(Core.eval(scope, Build.primitive(78)))
        ].flat();
      }))
    ].flat();
  }), Build.BLOCK(["$x", "$y"], [
    Build.Expression(Build.write("$x", Build.primitive(12))),
    Build.Expression(Build.write("$y", Build.primitive(34))),
    Build.Lone([], Build.BLOCK(["$x"], [
      Build.Expression(Build.write("$x", Build.primitive(56))),
      Build.Expression(Build.eval(["$x", "$y"], Build.primitive(78)))
    ].flat()))
  ].flat()));
});
