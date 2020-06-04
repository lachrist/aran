"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Inner = require("./inner.js");
const State = require("../state.js");
const Lang = require("../lang.js");
const Parser = require("../../test/parser/index.js");

const evals = {__proto__:null};

State._run_session({nodes:[], serials:new Map(), evals}, [], () => {
  // is_strict //
  Assert.deepEqual(Inner._is_strict(Inner._make_root()), false);
  Assert.deepEqual(Inner._is_strict(Inner._extend_use_strict(Inner._make_root())), true);
  Assert.deepEqual(Inner._is_strict(Inner._extend_closure(Inner._extend_use_strict(Inner._make_root()))), true);
  // get_depth //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._get_depth(scope), 1);
    return Lang.Bundle([
      Lang.Lone([], Inner.EXTEND_STATIC(scope, (scope) => {
        Assert.equal(Inner._get_depth(scope), 2);
        Assert.equal(Inner._get_depth(Inner._extend_use_strict(scope)), 2);
        return Lang.Bundle([]);
      }))
    ]);
  }), Parser.PARSE(`{{}}`));
  // // uninitialized //
  Assert.throws(() => Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    return Lang.Bundle([]);
  }), new Error("Uninitialized identifier"));
  // declare //
  Assert.throws(() => Inner._declare(Inner._make_root(), "x", "tag"), new Error("Invalid scope for declaration"));
  Assert.throws(() => Inner._declare(Inner._extend_use_strict(Inner._make_root()), "x", "tag"), new Error("Invalid scope for declaration"));
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    Assert.throws(() => Inner._declare(scope, "x", "tag"), new Error("Duplicate declaration"));
    return Lang.Bundle([
      Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(123)))
    ]);
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
  }`));
  // _is_declared && _get_tag //
  Assert.throws(() => Inner._is_declared(Inner._make_root(), "x"), new Error("Invalid scope for declaration query"));
  Assert.throws(() => Inner._is_declared(Inner._extend_use_strict(Inner._make_root()), "x"), new Error("Invalid scope for declaration query"));
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._is_declared(scope, "x"), false);
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    Assert.equal(Inner._is_declared(scope, "x"), true);
    Assert.equal(Inner._get_tag(scope, "x"), "tag");
    Assert.equal(Inner._get_tag(Inner._extend_use_strict(scope), "x"), "tag");
    Assert.throws(() => Inner._get_tag(scope, "y"), new Error("Missing tag"));
    return Lang.Bundle([
      Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(123)))
    ]);
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
  }`));
  // get_dynamic_frame //
  Assert.deepEqual(Inner._get_dynamic_frame(Inner._extend_use_strict(Inner._extend_dynamic(Inner._make_root(), "foo")), () => true), "foo");
  Assert.deepEqual(Inner._get_dynamic_frame(Inner._extend_use_strict(Inner._extend_dynamic(Inner._make_root(), "foo")), () => false), null);
  // initialize //
  Assert.throws(() => Inner.initialize(Inner._make_root(), "x"), new Error("Invalid scope for initialization"));
  Assert.throws(() => Inner.initialize(Inner._extend_use_strict(Inner._make_root()), "x"), new Error("Invalid scope for initialization"));
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.throws(() => Inner.initialize(scope, "x", Lang.primitive(123)), new Error("Undeclared initialization"));
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    const aran_expression = Inner.initialize(scope, "x", Lang.primitive(456));
    Assert.throws(() => Inner.initialize(scope, "x", Lang.primitive(789)), new Error("Duplicate initialization"));
    return Lang.Bundle([
      Lang.Lift(aran_expression)
    ]);
  }), Parser.PARSE(`{
    let $x;
    $x = 456;
  }`));
  // parameter //
  Assert.deepEqual(Inner.parameter(Inner._make_root(), "this"), Parser.parse("THIS"));
  // lookup-miss && shadowing //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    const aran_expression_1 = Inner.lookup(scope, "x", "ctx", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Lang.primitive(12);
      },
      on_dynamic_frame: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    });
    const aran_expression_2 = Inner.lookup(scope, "x", "ctx", {
      on_miss: (context) => {
        Assert.equal(context, "ctx");
        return Lang.primitive(34);
      },
      on_dynamic_frame: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    });
    Assert.throws(() => Inner._declare(scope, "x", "tag"), new Error("Late shadowing"));
    Assert.throws(() => Inner.initialize(scope, "x", Lang.primitive(56)), new Error("Undeclared (but shadowed) initialization"));
    Assert.equal(Inner._declare(scope, "y", "tag"), undefined);
    return Lang.Bundle([
      Lang.Lift(aran_expression_1),
      Lang.Lift(aran_expression_2),
      Lang.Lift(Inner.initialize(scope, "y", Lang.primitive(78)))
    ]);
  }), Parser.PARSE(`{
    let $y;
    12;
    34;
    $y = 78;
  }`));
  // lookup-live //
  Assert.deepEqual(Inner.EXTEND_STATIC(false, (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    return Lang.Bundle([
      Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(123))),
      Lang.Lift(Inner.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Lang.sequence(access(null), access(Lang.primitive(456)));
        }
      }))
    ]);
  }), Parser.PARSE(`{
    let $x;
    $x = 123;
    ($x, $x = 456);
  }`));
  // lookup-hit-dead-static //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Assert.equal(Inner._declare(scope, "x", "tag"), undefined);
    return Lang.Bundle([
      Lang.Lift(Inner.lookup(scope, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Lang.primitive(456);
        },
        on_live_hit: () => Assert.fail()
      })),
      Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(123)))
    ]);
  }), Parser.PARSE(`{
    let $x;
    456;
    $x = 123;
  }`));
  // lookup-hit-dead-dynamic //
  Assert.deepEqual(Inner.EXTEND_STATIC(false, (scope1) => {
    Assert.equal(Inner._declare(scope1, "x", "tag"), undefined);
    const scope2 = Inner._extend_closure(scope1);
    return Lang.Bundle([
      Lang.Lift(Inner.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Lang.primitive(456)
        },
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return access(null);
        }
      })),
      Lang.Lift(Inner.lookup(scope2, "x", "ctx", {
        on_miss: () => Assert.fail(),
        on_dynamic_frame: () => Assert.fail(),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Lang.primitive(789)
        },
        on_live_hit: (context, tag, access) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return access(null);
        }
      })),
      Lang.Lift(Inner.initialize(scope1, "x", Lang.primitive(123)))
    ]);
  }), Parser.PARSE(`{
    let $x, _x;
    _x = false;
    (_x ? $x : 456);
    (_x ? $x : 789);
    ($x = 123, _x = true);
  }`));
  // lookup-dynamic-frame //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    scope = Inner._extend_dynamic(scope, "dyn");
    return Lang.Bundle([
      Lang.Lift(Inner.lookup(scope, "x", "ctx", {
        on_miss: (context) => {
          Assert.equal(context, "ctx");
          return Lang.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_frame: (context, dynamic, aran_expression) => {
          Assert.equal(context, "ctx");
          Assert.equal(dynamic, "dyn");
          return Lang.sequence(aran_expression, Lang.primitive(456))
        }
      }))
    ]);
  }), Parser.PARSE(`{
    (123, 456);
  }`));
  // eval //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._extend_use_strict(Inner._extend_dynamic(Inner._extend_closure(Inner._make_root()), "dyn")), (scope) => {
    Inner._declare(scope, "x", "tag");
    return Lang.Bundle([
      Lang.Lift(Inner.eval(scope, Lang.primitive(123))),
      Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(456)))
    ]);
  }), Parser.PARSE(`{
    let $x;
    eval(123, § $x);
    ($x = 456);
  }`));
  // is_eval //
  Assert.deepEqual(Inner._is_eval(Inner._extend_use_strict(Inner._make_root())), false);
  Assert.deepEqual(Inner._is_eval(Inner._make_eval(evals.null)), true);
  // _make_eval //
  [evals.null, JSON.parse(JSON.stringify(evals.null))].forEach((frame_array) => {
    Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_eval(frame_array), (scope) => {
      Assert.equal(Inner._is_strict(scope), true);
      Assert.equal(Inner._get_depth(scope), 2);
      return Lang.Bundle([
        Lang.Lift(
          Inner.eval(scope, Lang.primitive("foo"))),
        Lang.Lift(Inner.lookup(scope, "x", "ctx", {
          on_miss: () => Assert.fail(),
          on_dynamic_frame: () => Assert.fail(),
          on_live_hit: () => Assert.fail(),
          on_dead_hit: (context, tag) => {
            Assert.equal(context, "ctx");
            Assert.equal(tag, "tag");
            return Lang.primitive(123);
          }
        })),
        Lang.Lift(Inner.lookup(scope, "y", "ctx", {
          on_miss: (context) => {
            Assert.equal(context, "ctx");
            return Lang.primitive(456);
          },
          on_dynamic_frame: (context, dynamic, aran_expression) => {
            Assert.equal(context, "ctx");
            Assert.deepEqual(dynamic, "dyn");
            Assert.deepEqual(aran_expression, Parser.parse("456"));
            return Lang.primitive(789);
          },
          on_live_hit: () => Assert.fail(),
          on_dead_hit: () => Assert.fail()
        }))
      ]);
    }), Parser.PARSE(`{
      eval("foo", § $x);
      123;
      789;
    }`));
  });
  // eval-escaped //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope1) => {
    Inner._declare(scope1, "x", "tag");
    const scope2 = Inner._extend_closure(scope1);
    return Lang.Bundle([
      Lang.Lift(Inner.eval(scope2, Lang.primitive(123))),
      Lang.Lift(Inner.initialize(scope1, "x", Lang.primitive(456)))
    ]);
  }), Parser.PARSE(`{
    let $x, _x;
    _x = false;
    eval(123, § $x, § _x);
    ($x = 456, _x = true);
  }`));
  // eval-duplicate //
  Assert.deepEqual(Inner.EXTEND_STATIC(Inner._make_root(), (scope) => {
    Inner._declare(scope, "x", "tag");
    Inner._declare(scope, "y", "tag");
    return Lang.Bundle([
      Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(12))),
      Lang.Lift(Inner.initialize(scope, "y", Lang.primitive(34))),
      Lang.Lone([], Inner.EXTEND_STATIC(scope, (scope) => {
        Inner._declare(scope, "x", "tag");
        return Lang.Bundle([
          Lang.Lift(Inner.initialize(scope, "x", Lang.primitive(56))),
          Lang.Lift(Inner.eval(scope, Lang.primitive(78)))
        ]);
      }))
    ]);
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
