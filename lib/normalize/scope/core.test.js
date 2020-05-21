
"use strict";

Error.stackTraceLimit = 1/0;

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
  Assert.deepEqual(Core._is_strict(null), false);
  Assert.deepEqual(Core._is_strict(Core._extend_use_strict(null)), true);
  Assert.deepEqual(Core._is_strict(Core._extend_closure(Core._extend_use_strict(null))), true);
  // get_depth //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Assert.equal(Core._get_depth(scope), 1);
    return Build.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
      Assert.equal(Core._get_depth(scope), 2);
      Assert.equal(Core._get_depth(Core._extend_use_strict(scope)), 2);
      return [];
    }));
  }), Parser.PARSE(`{{}}`));
  // // uninitialized //
  Assert.throws(() => Core.EXTEND_STATIC(null, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [];
  }), new Error("Uninitialized identifier"));
  // declare //
  Assert.throws(() => Core._declare(null, "x", "tag"), new Error("Invalid scope for identifier declaration"));
  Assert.throws(() => Core._declare(Core._extend_use_strict(null), "x", "tag"), new Error("Invalid scope for identifier declaration"));
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Duplicate identifier declaration"));
    return [
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
  }`));
  // is_declared //
  Assert.throws(() => Core._is_declared(null, "x"), new Error("Invalid scope for identifier declaration query"));
  Assert.throws(() => Core._is_declared(Core._extend_use_strict(null), "x"), new Error("Invalid scope for identifier declaration query"));
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
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
  // get_dynamic_frame //
  Assert.deepEqual(Core._get_dynamic_frame(Core._extend_use_strict(Core._extend_dynamic(null, "foo")), () => true), "foo");
  Assert.deepEqual(Core._get_dynamic_frame(Core._extend_use_strict(Core._extend_dynamic(null, "foo")), () => false), null);
  // initialize //
  Assert.throws(() => Core.initialize(null, "x"), new Error("Invalid scope for identifier initialization"));
  Assert.throws(() => Core.initialize(Core._extend_use_strict(null), "x"), new Error("Invalid scope for identifier initialization"));
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(123)), new Error("Undeclared identifier initialization"));
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    const aran_expression = Core.initialize(scope, "x", Build.primitive(456));
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(789)), new Error("Duplicate identifier initialization"));
    return [
      Build.Lift(aran_expression)
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    $x = 456;
  }`));
  // parameter //
  Assert.deepEqual(Core.parameter(null, "this"), Parser.parse("THIS"));
  // lookup-miss && shadowing //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    const aran_expression_1 = Core.lookup(scope, "x", "ctx", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Build.primitive(12);
      },
      on_dynamic_frame: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    });
    const aran_expression_2 = Core.lookup(scope, "x", "ctx", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Build.primitive(34);
      },
      on_dynamic_frame: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    });
    Assert.throws(() => Core._declare(scope, "x", "tag"), new Error("Late identifier shadowing"));
    Assert.throws(() => Core.initialize(scope, "x", Build.primitive(56)), new Error("Undeclared (but shadowed) identifier initialization"));
    Assert.equal(Core._declare(scope, "y", "tag"), undefined);
    return [
      Build.Lift(aran_expression_1),
      Build.Lift(aran_expression_2),
      Build.Lift(Core.initialize(scope, "y", Build.primitive(78)))
    ].flat();
  }), Parser.PARSE(`{
    let $y;
    12;
    34;
    $y = 78;
  }`));
  // lookup-live //
  Assert.deepEqual(Core.EXTEND_STATIC(false, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123))),
      Build.Lift(Core.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.sequence(access(null), access(Build.primitive(456)));
        }
      }))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
    ($x, $x = 456);
  }`));
  // lookup-hit-dead-static //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Assert.equal(Core._declare(scope, "x", "tag"), undefined);
    return [
      Build.Lift(Core.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(456);
        },
        on_live_hit: () => Assert.fail()
      })),
      Build.Lift(Core.initialize(scope, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x;
    456;
    $x = 123;
  }`));
  // lookup-hit-dead-dynamic //
  Assert.deepEqual(Core.EXTEND_STATIC(false, (scope1) => {
    Assert.equal(Core._declare(scope1, "x", "tag"), undefined);
    const scope2 = Core._extend_closure(scope1);
    return [
      Build.Lift(Core.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
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
      })),
      Build.Lift(Core.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(789)
        },
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return access(null);
        }
      })),
      Build.Lift(Core.initialize(scope1, "x", Build.primitive(123)))
    ].flat();
  }), Parser.PARSE(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 456);
    (_x ? $x : 789);
    ($x = 123, _x = true);
  }`));
  // lookup-dynamic-frame //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    scope = Core._extend_dynamic(scope, "dyn");
    return [
      Build.Lift(Core.lookup(scope, "x", "ctx", {
        on_miss: (context) => {
          Assert.equal(context, "ctx");
          return Build.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: (context, dynamic, aran_expression) => {
          Assert.equal(context, "ctx");
          Assert.equal(dynamic, "dyn");
          return Build.sequence(aran_expression, Build.primitive(456))
        }
      }))
    ].flat();
  }), Parser.PARSE(`{
    (123, 456);
  }`));
  // eval //
  Assert.deepEqual(Core.EXTEND_STATIC(Core._extend_use_strict(Core._extend_dynamic(Core._extend_closure(null), "dyn")), (scope) => {
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
  // _deserialize //
  [evals[0], JSON.parse(JSON.stringify(evals[0]))].forEach((frame_array) => {
    Assert.deepEqual(Core.EXTEND_STATIC(Core._deserialize(frame_array), (scope) => {
      Assert.equal(Core._is_strict(scope), true);
      Assert.equal(Core._get_depth(scope), 2);
      return [
        Build.Lift(Core.lookup(scope, "x", "ctx", {
          on_miss: () => Assert.fail(),
          on_dynamic_frame: () => Assert.fail(),
          on_live_hit: () => Assert.fail(),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Build.primitive(123);
          }
        })),
        Build.Lift(Core.lookup(scope, "y", "ctx", {
          on_miss: (context) => {
            Assert.equal(context, "ctx");
            return Build.primitive(456);
          },
          on_dynamic_frame: (context, dynamic, aran_expression) => {
            Assert.equal(context, "ctx");
            Assert.deepEqual(dynamic, "dyn");
            Assert.deepEqual(aran_expression, Parser.parse("456"));
            return Build.primitive(789);
          },
          on_live_hit: () => Assert.fail(),
          on_dead_hit: () => Assert.fail()
        }))
      ].flat();
    }), Parser.PARSE(`{
      123;
      789;
    }`));
  });
  // eval-escaped //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope1) => {
    Core._declare(scope1, "x", "tag");
    const scope2 = Core._extend_closure(scope1);
    return [
      Build.Lift(Core.eval(scope2, Build.primitive(123))),
      Build.Lift(Core.initialize(scope1, "x", Build.primitive(456)))
    ].flat();
  }), Parser.PARSE(`{
    let $x, _x;
    _x = false;
    eval(123, § $x, § _x);
    ($x = 456, _x = true);
  }`));
  // eval-duplicate //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Core._declare(scope, "x", "tag");
    Core._declare(scope, "y", "tag");
    return [
      Build.Lift(Core.initialize(scope, "x", Build.primitive(12))),
      Build.Lift(Core.initialize(scope, "y", Build.primitive(34))),
      Build.Lone([], Core.EXTEND_STATIC(scope, (scope) => {
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
