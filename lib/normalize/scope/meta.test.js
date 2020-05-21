
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Meta = require("./meta.js");
const Core = require("./core.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // Box //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    return Meta.Box(scope, "x", Build.primitive(123), (box) => {
      return [
        Build.Lift(Meta.get(scope, box)),
        Build.Lift(Meta.set(scope, box, Build.primitive(456)))
      ].flat();
    });
  }), Parser.PARSE(`{
    let $_x_1_1;
    $_x_1_1 = 123;
    $_x_1_1;
    $_x_1_1 = 456;
  }`));
  // box //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    return [
      Build.Lift(Meta.box(scope, "x", Build.primitive(123), (box) => {
        return Build.sequence(Meta.get(scope, box), Meta.set(scope, box, Build.primitive(456)));
      }))
    ].flat();
  }), Parser.PARSE(`{
    let $_x_1_1;
    ($_x_1_1 = 123, ($_x_1_1, $_x_1_1 = 456));
  }`));
  // dynamic //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    return [
      Build.Lift(Meta.box(scope, "x", Build.primitive(123), (box) => {
        return Meta.get(Core._extend_dynamic(scope, null), box);
      }))
    ].flat();
  }), Parser.PARSE(`{
    let $_x_1_1;
    ($_x_1_1 = 123, $_x_1_1);
  }`));
  // duplicate //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    return [
      Build.Lift(Meta.box(scope, "x", Build.primitive(123), (box) => Meta.get(scope, box))),
      Build.Lift(Meta.box(scope, "x", Build.primitive(456), (box) => Meta.get(scope, box))),
    ].flat();
  }), Parser.PARSE(`{
    let $_x_1_1, $_x_1_2;
    ($_x_1_1 = 123, $_x_1_1);
    ($_x_1_2 = 456, $_x_1_2);
  }`));
  // inline //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Assert.throws(() => Meta.Box(scope, "x", Symbol("foo"), () => Assert.fail()), new Error("Cannot box a symbol"));
    return [
      Meta.Box(scope, "x", 123, (box) => {
        Assert.throws(() => Meta.set(scope, box, Build.primitive(456)), new Error("Cannot set an inlined box"));
        return Build.Lift(Meta.get(scope, box));
      }),
      Meta.Box(scope, "y", "foo", (box) => Build.Lift(Meta.get(scope, box)))
    ].flat();
  }), Parser.PARSE(`{
    123;
    "foo";
  }`));
});
