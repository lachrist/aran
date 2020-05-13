
"use strict";

const Assert = require("assert").strict;
const Container = require("./container.js");
const Layer = require("./layer.js");
const State = require("../state.js");
const Build = require("../../build.js");

require("../../build.js")._debug_mode();

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // Container //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    return Container.Container(scope, "x", Build.primitive(123), (container) => {
      return [
        Build.Expression(Container.get(scope, container)),
        Build.Expression(Container.set(scope, container, Build.primitive(456)))
      ].flat();
    });
  }), Build.BLOCK(["$_x_1_1"], [
    Build.Expression(Build.write("$_x_1_1", Build.primitive(123))),
    Build.Expression(Build.read("$_x_1_1")),
    Build.Expression(Build.write("$_x_1_1", Build.primitive(456)))
  ].flat()));
  // container //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    return [
      Build.Expression(Container.container(scope, "x", Build.primitive(123), (container) => {
        return Build.sequence(Container.get(scope, container), Container.set(scope, container, Build.primitive(456)));
      }))
    ].flat();
  }), Build.BLOCK(["$_x_1_1"], [
    Build.Expression(Build.sequence(Build.write("$_x_1_1", Build.primitive(123)), Build.sequence(Build.read("$_x_1_1"), Build.write("$_x_1_1", Build.primitive(456)))))
  ].flat()));
  // inline //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    Assert.throws(() => Container.Container(scope, "x", Symbol("foo"), Assert.fail.bind(Assert)), new Error("Symbols cannot be contained"));
    return [
      Container.Container(scope, "x", 123, (container) => {
        Assert.throws(() => Container.set(scope, container, Build.primitive(456)), new Error("Cannot set an inlined container"));
        return Build.Expression(Container.get(scope, container));
      })
    ].flat();
  }), Build.BLOCK([], [
    Build.Expression(Build.primitive(123))
  ].flat()));
});
