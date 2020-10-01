"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Meta = require("./meta.js");
const Base = require("./base.js");
const Outer = require("./outer.js");
const State = require("../state.js");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  // on_miss //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope1) => {
    return Tree.Bundle([
      Tree.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: (scope2, identifier, right) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Tree.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    123;
  }`));
  // on_live_hit //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope1) => {
    Base._declare(scope1, "x", true);
    return Tree.Bundle([
      Tree.Lift(Base.initialize(scope1, "x", Tree.primitive(123))),
      Tree.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: (scope2, identifier, right, writable, access) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(writable, true);
          return access(null);
        },
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$x;
    $$x = 123;
    $$x;
  }`));
  // on_dead_hit //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope1) => {
    Base._declare(scope1, "x", true);
    return Tree.Bundle([
      Tree.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: () => Assert.fail(),
        on_dead_hit: (scope2, identifier, right, writable) => {
          Assert.deepEqual(scope2, scope1);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(writable, true);
          return Tree.primitive(123);
        },
        on_dynamic_hit: () => Assert.fail()
      })),
      Tree.Lift(Base.initialize(scope1, "x", Tree.primitive(456)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$x;
    123;
    $$x = 456;
  }`));
  // on_dynamic_hit (with unscopables) //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope1) => {
    return Meta.Box(scope1, "object_box", true, Tree.primitive("object-box"), (box1) => {
      return Meta.Box(scope1, "unscopables_box", true, Tree.primitive("unsopables-box"), (box2) => {
        const scope2 = Base._extend_with(scope1, box1, box2);
        return Tree.Lift(Base.lookup(scope2, "x", "right", {
          on_miss: (scope3, identifier, right) => {
            Assert.deepEqual(scope3, scope2);
            Assert.deepEqual(identifier, "x");
            Assert.deepEqual(right, "right");
            return Tree.primitive(123);
          },
          on_live_hit: () => Assert.fail(),
          on_dead_hit: () => Assert.fail(),
          on_dynamic_hit: (scope3, identifier, right, box3) => {
            Assert.deepEqual(scope3, scope2);
            Assert.deepEqual(identifier, "x");
            Assert.deepEqual(right, "right");
            Assert.deepEqual(box3, box1);
            return Tree.primitive(456);
          }
        }));
      });
    });
  }), Lang.PARSE_BLOCK(`{
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
              (typeof $_unscopables_box_1_1 === "object") ?
              $_unscopables_box_1_1 :
              (typeof $_unscopables_box_1_1 === "function")) ?
            #Reflect.get($_unscopables_box_1_1, "x") :
            false)) :
        true) ?
      123 :
      456);
  }`));
  // on_dynamic_hit (without unscopables) //
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope1) => {
    return Meta.Box(scope1, "object_box", true, Tree.primitive("object-box"), (box1) => {
      const scope2 = Base._extend_eval(scope1, box1);
      Assert.deepEqual(Base._get_eval(scope2), box1);
      return Tree.Lift(Base.lookup(scope2, "x", "right", {
        on_miss: (scope3, identifier, right) => {
          Assert.deepEqual(scope3, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Tree.primitive(123);
        },
        on_live_hit: () => Assert.fail(),
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: (scope3, identifier, right, box2) => {
          Assert.deepEqual(scope3, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(box2, box1);
          return Tree.primitive(456);
        }
      }));
    });
  }), Lang.PARSE_BLOCK(`{
    let $_object_box_1_1;
    $_object_box_1_1 = "object-box";
    (
      #Reflect.has($_object_box_1_1, "x") ?
      456 :
      123);
  }`));
  // read_this && read_new_target //
  Assert.throws(() => Base.lookup(Outer._make_root(), "this", null, {
    on_miss: () => Assert.fail(),
    on_dead_hit: () => Assert.fail(),
    on_dynamic_hit: () => Assert.fail(),
    on_live_hit: () => Assert.fail()
  }), new Error("Missing special identifier"));
  Assert.throws(() => Base.lookup(Outer._make_root(), "new.target", null, {
    on_miss: () => Assert.fail(),
    on_dead_hit: () => Assert.fail(),
    on_dynamic_hit: () => Assert.fail(),
    on_live_hit: () => Assert.fail()
  }), new Error("Missing special identifier"));
  Assert.deepEqual(Outer.EXTEND_STATIC(Outer._make_root(), (scope1) => {
    Base._declare(scope1, "this", true);
    Base._declare(scope1, "new.target", true);
    Assert.throws(() => Base.lookup(scope1, "this", null, {
      on_miss: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_dynamic_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    }), new Error("Special identifier in deadzone"));
    Assert.throws(() => Base.lookup(scope1, "new.target", null, {
      on_miss: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_dynamic_hit: () => Assert.fail(),
      on_live_hit: () => Assert.fail()
    }), new Error("Special identifier in deadzone"));
    return Tree.Bundle([
      Tree.Lift(Base.initialize(scope1, "this", Tree.primitive(123))),
      Tree.Lift(Base.initialize(scope1, "new.target", Tree.primitive(456))),
      Meta.Box(scope1, "object_box", true, Tree.primitive("object-box"), (box) => {
        const scope2 = Base._extend_eval(scope1, box);
        return Tree.Bundle([
          Tree.Lift(Base.lookup(scope2, "this", null, {
            on_miss: () => Assert.fail(),
            on_dead_hit: () => Assert.fail(),
            on_dynamic_hit: () => Assert.fail(),
            on_live_hit: (scope3, identifier, right, writable, access) => {
              Assert.deepEqual(scope3, scope2);
              Assert.deepEqual(identifier, "this");
              Assert.deepEqual(right, null);
              Assert.deepEqual(writable, true);
              return access(null);
            }
          })),
          Tree.Lift(Base.lookup(scope2, "new.target", null, {
            on_miss: () => Assert.fail(),
            on_dead_hit: () => Assert.fail(),
            on_dynamic_frame: () => Assert.fail(),
            on_live_hit: (scope3, identifier, right, writable, access) => {
              Assert.deepEqual(scope3, scope2);
              Assert.deepEqual(identifier, "new.target");
              Assert.deepEqual(right, null);
              Assert.deepEqual(writable, true);
              return access(null);
            }
          }))
        ]);
      })
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$this, $$0newtarget, $_object_box_1_1;
    $$this = 123;
    $$0newtarget = 456;
    $_object_box_1_1 = "object-box";
    $$this;
    $$0newtarget;
  }`));
});
