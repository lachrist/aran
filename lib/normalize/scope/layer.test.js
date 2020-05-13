
"use strict";

const Assert = require("assert").strict;
const Layer = require("./layer.js");
const State = require("../state.js");
const Build = require("../../build.js");

require("../../build.js")._debug_mode();

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
      Build.Expression(object1.aran_expression),
      Build.Expression(object2.aran_expression),
      Build.Expression(Layer.access_meta(scope, object1.identifier, null)),
      Build.Expression(Layer.access_meta(scope, object1.identifier, Build.primitive(789))),
      Build.Lone([], Layer.DYNAMIC(scope, "dyn", (scope) => {
        return [
          Build.Expression(Layer.access_meta(scope, object1.identifier, null))
        ].flat();
      }))
    ].flat();
  }), Build.BLOCK(["$_x_1_1", "$_x_1_2"], [
    Build.Expression(Build.write("$_x_1_1" , Build.primitive(123))),
    Build.Expression(Build.write("$_x_1_2" , Build.primitive(456))),
    Build.Expression(Build.read("$_x_1_1")),
    Build.Expression(Build.write("$_x_1_1" , Build.primitive(789))),
    Build.Lone([], Build.BLOCK([], [
      Build.Expression(Build.read("$_x_1_1"))
    ].flat()))
  ].flat()));
  // base //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    Assert.equal(Layer._declare_base(scope, "x", "tag"), undefined);
    Assert.throws(() => Layer.initialize_base(scope, "new.target", new Error("Cannot initialize undeclared identifier")));
    return [
      Build.Expression(Layer.lookup_base(scope, "x", {
        on_miss: Assert.fail.bind(Assert),
        on_dead_hit: (context, tag) => {
          Assert.equal(context, "ctx");
          Assert.equal(tag, "tag");
          return Build.primitive(123);
        },
        on_live_hit: Assert.fail.bind(Assert),
        on_dynamic_frame: Assert.fail.bind(Assert)
      }, "ctx")),
      Build.Expression(Layer.initialize_base(scope, "x", Build.primitive(456)))
    ].flat();
  }), Build.BLOCK(["$$x"], [
    Build.Expression(Build.primitive(123)),
    Build.Expression(Build.write("$$x", Build.primitive(456)))
  ].flat()));
});
