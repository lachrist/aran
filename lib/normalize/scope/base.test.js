
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Meta = require("./meta.js");
const Base = require("./base.js");
const Core = require("./core.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // on_miss //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope1) => {
    return [
      Build.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: (scope2, identifier, right) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Build.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ].flat()
  }), Parser.PARSE(`{
    123;
  }`));
  // on_live_hit //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope1) => {
    Base._declare(scope1, "x", "tag");
    return [
      Build.Lift(Base.initialize(scope1, "x", Build.primitive(123))),
      Build.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: (scope2, identifier, right, tag, access) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(tag, "tag");
          return access(null);
        },
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ].flat()
  }), Parser.PARSE(`{
    let $$x;
    $$x = 123;
    $$x;
  }`));
  // on_dead_hit //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope1) => {
    Base._declare(scope1, "x", "tag");
    return [
      Build.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: () => Assert.fail(),
        on_dead_hit: (scope2, identifier, right, tag) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(tag, "tag");
          return Build.primitive(123);
        },
        on_dynamic_hit: () => Assert.fail()
      })),
      Build.Lift(Base.initialize(scope1, "x", Build.primitive(456)))
    ].flat()
  }), Parser.PARSE(`{
    let $$x;
    123;
    $$x = 456;
  }`));
  // on_dynamic_hit (with unscopables) //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope1) => {
    return Meta.Box(scope1, "object_box", Build.primitive("object-box"), (box1) => {
      return Meta.Box(scope1, "unscopables_box", Build.primitive("unsopables-box"), (box2) => {
        const scope2 = Base._extend_dynamic(scope1, box1, box2);
        return Build.Lift(Base.lookup(scope2, "x", "right", {
          on_miss: (scope3, identifier, right) => {
            Assert.deepEqual(scope3, scope2);
            Assert.deepEqual(identifier, "x");
            Assert.deepEqual(right, "right");
            return Build.primitive(123);
          },
          on_live_hit: () => Assert.fail(),
          on_dead_hit: () => Assert.fail(),
          on_dynamic_hit: (scope3, identifier, right, box3) => {
            Assert.deepEqual(scope3, scope2);
            Assert.deepEqual(identifier, "x");
            Assert.deepEqual(right, "right");
            Assert.deepEqual(box3, box1);
            return Build.primitive(456);
          }
        }));
      });
    });
  }), Parser.PARSE(`{
    let $_object_box_1_1, $_unscopables_box_1_1;
    $_object_box_1_1 = "object-box";
    $_unscopables_box_1_1 = "unsopables-box";
    (
      (
        #Reflect.has($_object_box_1_1, "x") ?
        (
          $_unscopables_box_1_1 = #Reflect.get($_object_box_1_1, #Symbol.unscopables),
          (
            (
              (typeof $_unscopables_box_1_1) === "object" ?
              $_unscopables_box_1_1 :
              (typeof $_unscopables_box_1_1) === "function") ?
            !#Reflect.get($_unscopables_box_1_1, "x") :
            true)) :
        false) ?
      456 :
      123);
  }`));
  // on_dynamic_hit (without unscopables) //
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope1) => {
    return Meta.Box(scope1, "object_box", Build.primitive("object-box"), (box1) => {
      const scope2 = Base._extend_dynamic(scope1, box1, null);
      return Build.Lift(Base.lookup(scope2, "x", "right", {
        on_miss: (scope3, identifier, right) => {
          Assert.deepEqual(scope3, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Build.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: (scope3, identifier, right, box2) => {
          Assert.deepEqual(scope3, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(box2, box1);
          return Build.primitive(456);
        }
      }));
    });
  }), Parser.PARSE(`{
    let $_object_box_1_1;
    $_object_box_1_1 = "object-box";
    (
      #Reflect.has($_object_box_1_1, "x") ?
      456 :
      123);
  }`));
  // read_this && read_new_target //
  Assert.throws(() => Base.read_this(null), new Error("Missing special identifier"));
  Assert.throws(() => Base.read_new_target(null), new Error("Missing special identifier"));
  Assert.deepEqual(Core.EXTEND_STATIC(null, (scope) => {
    Base._declare(scope, "this", "tag");
    Assert.throws(() => Base.read_this(scope), new Error("Special identifier in deadzone"));
    return [
      Build.Lift(Base.initialize(scope, "this", Build.primitive(123))),
      Meta.Box(scope, "object_box", Build.primitive("object-box"), (box) => {
        return Build.Lift(Base.read_this(Base._extend_dynamic(scope, box, null)))
      })
    ].flat();
  }), Parser.PARSE(`{
    let $$this, $_object_box_1_1;
    $$this = 123;
    $_object_box_1_1 = "object-box";
    $$this;
  }`));
});