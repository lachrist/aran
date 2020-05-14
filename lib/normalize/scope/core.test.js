"use strict";

const Assert = require("assert").strict;
const Core = require("./core.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

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
      }), Parser.PARSE(`{{}}`));
    });
  });
  // get_depth //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._get_depth(scope), 1);
    return Build.Lone([], Core.REGULAR(scope, (scope) => {
      Assert.equal(Core._get_depth(scope), 2);
      return [];
    }));
  }), Parser.PARSE(`{{}}`));
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
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
  }`));
  // is_declared //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._is_declared(scope, "x"), false);
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    Assert.equal(Core._is_declared(scope, "x"), true);
    return [
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
  }`));
  // initialize //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(123)), new Error("Cannot initialize undeclared identifier"));
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    const aran_expression = Core.initialize(scope, "x", Build.primitive(456));
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(789)), new Error("Identifier already initialized"));
    return [
      Build.Lift(aran_expression)
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    $x = 456;
  }`));
  // parameter //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    return [
      Build.Lift(Core.parameter(scope, "new.target"))
    ].flat();
  }), Parser.PARSE(`{
    NEW_TARGET;
  }`));
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
      Build.Lift(aran_expression),
      Build.Lift(Core.initialize(scope, "y", Build.primitive(456)))
    ].flat();
  }), Parser.PARSE(`{
    let $y;
    123;
    $y = 456;
  }`));
  // lookup-live //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123))),
      Build.Lift(Core.lookup(scope, "x", {
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
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
    ($x, $x = 456);
  }`));
  // lookup-hit-dead-static //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Lift(Core.lookup(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(456);
        },
        on_live_hit: Assert.fail.bind(Assert)
      }, "ctx")),
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    456;
    $x = 123;
  }`));
  // lookup-hit-dead-dynamic //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Lone([], Core.CLOSURE(scope, false, (scope) => {
        return [
          Build.Lift(Core.lookup(scope, "x", {
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
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x, _x;
    _x = false;
    {
      (_x ? $x : 456);
    }
    ($x = 123, _x = true); 
  }`));
  // lookup-dynamic-frame //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    return [
      Build.Lone([], Core.DYNAMIC(scope, "dyn", (scope) => {
        return [
          Build.Lift(Core.lookup(scope, "x", {
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
  }), Parser.PARSE(`{
    {
      (123, 456);
    }
  }`));
  // eval //
  Assert.deepEqual(Core.GLOBAL(true, (scope) => {
    Core._declare(scope, "x", "tag");
    return [
      Build.Lift(Core.eval(scope, Build.primitive(123))),
      Build.Lift(Core.initialize(scope, "x", Build.primitive(456)))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    eval(123, § $x);
    ($x = 456);
  }`));
  // extend-eval //
  [evals[0], JSON.parse(JSON.stringify(evals[0]))].forEach((frame_array) => {
    Assert.deepEqual(Core.EVAL(frame_array, false, (scope) => {
      Assert.equal(Core._is_strict(scope), true);
      Assert.equal(Core._get_depth(scope), 2);
      return [
        Build.Lift(Core.lookup(scope, "x", {
          on_miss: Assert.fail.bind(Assert),
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_live_hit: Assert.fail.bind(Assert),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Build.primitive(123);
          }
        }, "ctx")),
        Build.Lift(Core.lookup(scope, "y", {
          on_miss: (context) => {
            Assert.equal(context, "ctx");
            return Build.primitive(456);
          },
          on_dynamic_frame: Assert.fail.bind(Assert),
          on_live_hit: Assert.fail.bind(Assert),
          on_dead_hit: Assert.fail.bind(Assert)
        }, "ctx"))
      ].flat();
    }), Parser.PARSE(`{
      123;
      456;
    }`));
  });
  // eval-escaped //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Core._declare(scope, "x", "tag");
    return [
      Build.Lone([], Core.CLOSURE(scope, false, (scope) => {
        return [
          Build.Lift(Core.eval(scope, Build.primitive(123)))
        ].flat();
      })),
      Build.Lift(Core.initialize(scope, "x", Build.primitive(456)))
    ].flat();
  }), Parser.PARSE(`{
    let $x, _x;
    _x = false;
    {
      eval(123, § $x, § _x);
    }
    ($x = 456, _x = true);
  }`));
  // eval-duplicate //
  Assert.deepEqual(Core.GLOBAL(false, (scope) => {
    Core._declare(scope, "x", "tag");
    Core._declare(scope, "y", "tag");
    return [
      Build.Lift(Core.initialize(scope, "x", Build.primitive(12))),
      Build.Lift(Core.initialize(scope, "y", Build.primitive(34))),
      Build.Lone([], Core.REGULAR(scope, (scope) => {
        Core._declare(scope, "x", "tag");
        return [
          Build.Lift(Core.initialize(scope, "x", Build.primitive(56))),
          Build.Lift(Core.eval(scope, Build.primitive(78)))
        ].flat();
      }))
    ].flat();
  }), Parser.PARSE(`{
    let $x, $y;
    $x = 12;
    $y = 34;
    {
      let $x;
      $x = 56;
      eval(78, § $x, § $y);
    }
  }`));
});
