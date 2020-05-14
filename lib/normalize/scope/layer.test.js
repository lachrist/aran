
"use strict";

const Assert = require("assert").strict;
const Layer = require("./layer.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // meta //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    Assert.throws(() => Layer.access_meta(scope, "x", null), new Error("Missing meta identifier"));
    const object1 = Layer.declare_initialize_meta(scope, "x", Build.primitive(123));
    const object2 = Layer.declare_initialize_meta(scope, "x", Build.primitive(456));
    return [
      Build.Lift(object1.aran_expression),
      Build.Lift(object2.aran_expression),
      Build.Lift(Layer.access_meta(scope, object1.identifier, null)),
      Build.Lift(Layer.access_meta(scope, object1.identifier, Build.primitive(789))),
      Build.Lone([], Layer.DYNAMIC(scope, "dyn", (scope) => {
        return [
          Build.Lift(Layer.access_meta(scope, object1.identifier, null))
        ].flat();
      }))
    ].flat();
  }), Parser.PARSE(`{
    let $_x_1_1, $_x_1_2;
    $_x_1_1 = 123;
    $_x_1_2 = 456;
    $_x_1_1;
    $_x_1_1 = 789;
    {
      $_x_1_1;
    }
  }`));
  // base //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    Assert.equal(Layer._declare_base(scope, "x", "tag"), undefined);
    Assert.throws(() => Layer.initialize_base(scope, "new.target", new Error("Cannot initialize undeclared identifier")));
    return [
      Build.Lift(Layer.lookup_base(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(123);
        },
        on_live_hit: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert)
      }, "ctx")),
      Build.Lift(Layer.initialize_base(scope, "x", Build.primitive(456)))
    ].flat();
  }), Parser.PARSE(`{
    let $$x;
    123;
    $$x = 456;
  }`));
});
