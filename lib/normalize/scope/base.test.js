
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Meta = require("./meta.js");
const Base = require("./base.js");
const Outer = require("./outer.js");
const State = require("../state.js");
const Lang = require("../lang.js");
const Parser = require("../../../test/parser/index.js");

const WRITABLE = true;

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // on_miss //
  Assert.deepEqual(Outer.EXTEND_STATIC(null, (scope1) => {
    return Lang.Bundle([
      Lang.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: (scope2, identifier, right) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Lang.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ]);
  }), Parser.PARSE(`{
    123;
  }`));
  // on_live_hit //
  Assert.deepEqual(Outer.EXTEND_STATIC(null, (scope1) => {
    Base._declare(scope1, "x", WRITABLE);
    return Lang.Bundle([
      Lang.Lift(Base.initialize(scope1, "x", Lang.primitive(123))),
      Lang.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: (scope2, identifier, right, writable, access) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(writable, WRITABLE);
          return access(null);
        },
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ]);
  }), Parser.PARSE(`{
    let $$x;
    $$x = 123;
    $$x;
  }`));
  // on_dead_hit //
  Assert.deepEqual(Outer.EXTEND_STATIC(null, (scope1) => {
    Base._declare(scope1, "x", WRITABLE);
    return Lang.Bundle([
      Lang.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: () => Assert.fail(),
        on_dead_hit: (scope2, identifier, right, writable) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(writable, WRITABLE);
          return Lang.primitive(123);
        },
        on_dynamic_hit: () => Assert.fail()
      })),
      Lang.Lift(Base.initialize(scope1, "x", Lang.primitive(456)))
    ]);
  }), Parser.PARSE(`{
    let $$x;
    123;
    $$x = 456;
  }`));
  // on_dynamic_hit (with unscopables) //
  Assert.deepEqual(Outer.EXTEND_STATIC(null, (scope1) => {
    return Meta.Box(scope1, true, "object_box", Lang.primitive("object-box"), (box1) => {
      return Meta.Box(scope1, true, "unscopables_box", Lang.primitive("unsopables-box"), (box2) => {
        const scope2 = Base._extend_dynamic(scope1, box1, box2);
        return Lang.Lift(Base.lookup(scope2, "x", "right", {
          on_miss: (scope3, identifier, right) => {
            Assert.deepEqual(scope3, scope2);
            Assert.deepEqual(identifier, "x");
            Assert.deepEqual(right, "right");
            return Lang.primitive(123);
          },
          on_live_hit: () => Assert.fail(),
          on_dead_hit: () => Assert.fail(),
          on_dynamic_hit: (scope3, identifier, right, box3) => {
            Assert.deepEqual(scope3, scope2);
            Assert.deepEqual(identifier, "x");
            Assert.deepEqual(right, "right");
            Assert.deepEqual(box3, box1);
            return Lang.primitive(456);
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
  Assert.deepEqual(Outer.EXTEND_STATIC(null, (scope1) => {
    return Meta.Box(scope1, true, "object_box", Lang.primitive("object-box"), (box1) => {
      const scope2 = Base._extend_dynamic(scope1, box1, null);
      return Lang.Lift(Base.lookup(scope2, "x", "right", {
        on_miss: (scope3, identifier, right) => {
          Assert.deepEqual(scope3, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Lang.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: (scope3, identifier, right, box2) => {
          Assert.deepEqual(scope3, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(box2, box1);
          return Lang.primitive(456);
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
  Assert.deepEqual(Outer.EXTEND_STATIC(null, (scope1) => {
    Base._declare(scope1, "this", WRITABLE);
    Base._declare(scope1, "new.target", WRITABLE);
    return Lang.Bundle([
      Lang.Lift(Base.initialize(scope1, "this", Lang.primitive(123))),
      Lang.Lift(Base.initialize(scope1, "new.target", Lang.primitive(456))),
      Meta.Box(scope1, true, "object_box", Lang.primitive("object-box"), (box) => {
        const scope2 = Base._extend_dynamic(scope1, box, null);
        return Lang.Bundle([
          Lang.Lift(Base.lookup(scope2, "this", null, {
            on_miss: () => Assert.fail(),
            on_dead_hit: () => Assert.fail(),
            on_dynamic_frame: () => Assert.fail(),
            on_live_hit: (scope3, identifier, right, writable, access) => {
              Assert.deepEqual(scope3, scope2);
              Assert.deepEqual(identifier, "this");
              Assert.deepEqual(right, null);
              Assert.deepEqual(writable, WRITABLE);
              return access(null);
            }
          })),
          Lang.Lift(Base.lookup(scope2, "new.target", null, {
            on_miss: () => Assert.fail(),
            on_dead_hit: () => Assert.fail(),
            on_dynamic_frame: () => Assert.fail(),
            on_live_hit: (scope3, identifier, right, writable, access) => {
              Assert.deepEqual(scope3, scope2);
              Assert.deepEqual(identifier, "new.target");
              Assert.deepEqual(right, null);
              Assert.deepEqual(writable, WRITABLE);
              return access(null);
            }
          }))
        ]);
      })
    ]);
  }), Parser.PARSE(`{
    let $$this, $$0newtarget, $_object_box_1_1;
    $$this = 123;
    $$0newtarget = 456;
    $_object_box_1_1 = "object-box";
    $$this;
    $$0newtarget;
  }`));
});