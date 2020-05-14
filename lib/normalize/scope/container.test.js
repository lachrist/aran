
"use strict";

const Assert = require("assert").strict;
const Container = require("./container.js");
const Layer = require("./layer.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // Container //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    return Container.Container(scope, "x", Build.primitive(123), (container) => {
      return [
        Build.Lift(Container.get(scope, container)),
        Build.Lift(Container.set(scope, container, Build.primitive(456)))
      ].flat();
    });
  }), Parser.PARSE(`{
    let $_x_1_1;
    $_x_1_1 = 123;
    $_x_1_1;
    $_x_1_1 = 456;
  }`));
  // container //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    return [
      Build.Lift(Container.container(scope, "x", Build.primitive(123), (container) => {
        return Build.sequence(Container.get(scope, container), Container.set(scope, container, Build.primitive(456)));
      }))
    ].flat();
  }), Parser.PARSE(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`));
  // inline //
  Assert.deepEqual(Layer.GLOBAL(false, (scope) => {
    Assert.throws(() => Container.Container(scope, "x", Symbol("foo"), Assert.fail.bind(Assert)), new Error("Symbols cannot be contained"));
    return [
      Container.Container(scope, "x", 123, (container) => {
        Assert.throws(() => Container.set(scope, container, Build.primitive(456)), new Error("Cannot set an inlined container"));
        return Build.Lift(Container.get(scope, container));
      })
    ].flat();
  }), Parser.PARSE(`{
    123;
  }`));
});
