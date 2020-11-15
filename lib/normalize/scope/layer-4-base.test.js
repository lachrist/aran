"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Base = require("./layer-4-base.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // DeclareInitialize //
  Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope) => {
    Assert.throws(
      () => Base.DeclareInitialize(scope, "let", "x"),
      new global.Error("Can only declare-and-initialize closure-scoped variables"));
    Assert.throws(
      () => Base.DeclareInitialize(Base._extend_dynamic(scope, null, null, null), "var", "y"),
      new global.Error("Missing closure level of dynamic frame for declaration-and-initialization of closure-scoped variable"));
    return Tree.Bundle([
      Base.DeclareInitialize(scope, "var", "z"),
      Base.DeclareInitialize(Base._extend_dynamic(scope, null, null, Base._primitive_box(123)), "var", "t"),
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$z;
    $$z = void 0;
    (
      #Reflect.has(123, "t") ?
      void 0 :
      #Reflect.defineProperty(
        123,
        "t",
        {
          __proto__: null,
          value: void 0,
          writable: true,
          enumerable: true,
          configurable: false}));
  }`), Assert);
  // Declare && initialize
  Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope) => {
    Assert.throws(
      () => Base.Declare(scope, "var", "x"),
      new global.Error("Can only declare (and not initialize right after) block-scoped variables"));
    Assert.throws(
      () => Base.initialize(scope, "var", "x"),
      new global.Error("Can only initialize (and not declare right before) block-scoped variables"));
    Assert.throws(
      () => Base.Declare(Base._extend_dynamic(scope, null, null, null), "let", "y"),
      new global.Error("Missing block level of dynamic frame for declaration of block-scoped variable"));
    Assert.throws(
      () => Base.initialize(Base._extend_dynamic(scope, null, null, null), "let", "y"),
      new global.Error("Missing block level of dynamic frame for initialization of block-scoped variable"));
    return Tree.Bundle([
      Base.Declare(scope, "let", "z"),
      Tree.Lift(Base.initialize(scope, "let", "z", Tree.primitive(123))),
      (
        scope = Base._extend_dynamic(scope, null, Base._primitive_box(456), null),
        Base.Declare(scope, "const", "t")),
      Tree.Lift(Base.initialize(scope, "const", "t", Tree.primitive(789)))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$z;
    $$z = 123;
    #Reflect.defineProperty(
      456,
      "t",
      {
        __proto__: null,
        value: #"@deadzone",
        writable: false,
        enumerable: true,
        configurable: false});
    #Reflect.defineProperty(
      456,
      "t",
      {
        __proto__: null,
        value: 789});
  }`), Assert);
  // lookup >> miss //
  Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
    Assert.throws(() => Base.lookup(scope1, "this", "right", {
      on_miss: () => Assert.fail(),
      on_live_hit: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_dynamic_hit: () => Assert.fail()
    }), new global.Error("Missing special identifier"));
    return Tree.Lift(Base.lookup(scope1, "x", "right", {
      on_miss: (scope2, identifier, right) => {
        Assert.deepEqual(scope2, scope1);
        Assert.deepEqual(identifier, "x");
        Assert.deepEqual(right, "right");
        return Tree.primitive(123);
      },
      on_live_hit: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_dynamic_hit: () => Assert.fail()
    }));
  }), Lang.PARSE_BLOCK(`{123;}`), Assert);
  // lookup >> live hit //
  Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
    return Tree.Bundle([
      Base.DeclareInitialize(scope1, "var", "x"),
      Tree.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: (scope2, identifier, right, writable, access) => {
          Assert.deepEqual(scope1, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          Assert.deepEqual(writable, true);
          return access(Tree.primitive(123));
        },
        on_dead_hit: () => Assert.fail(),
        on_dynamic_hit: () => Assert.fail()
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$x;
    $$x = void 0;
    $$x = 123;
  }`), Assert);
  // lookup >> dead hit //
  Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
    Base.Declare(scope1, "let", "this");
    Assert.throws(() => Base.lookup(scope1, "this", "right", {
      on_miss: () => Assert.fail(),
      on_live_hit: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_dynamic_hit: () => Assert.fail()
    }, new global.Error("Special identifier in deadzone")));
    Base.Declare(scope1, "let", "x");
    return Tree.Bundle([
      Tree.Lift(Base.lookup(scope1, "x", "right", {
        on_miss: () => Assert.fail(),
        on_live_hit: () => Assert.fail(),
        on_dead_hit: (scope2, identifier, right) => {
          Assert.deepEqual(scope1, scope2);
          Assert.deepEqual(identifier, "x");
          Assert.deepEqual(right, "right");
          return Tree.primitive(123);
        },
        on_dynamic_hit: () => Assert.fail()
      }))
    ]);
  }), Lang.PARSE_BLOCK(`{
    let $$this, $$x;
    123;
  }`), Assert);
  // lookup >> dynamic empty //
  Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
    scope1 = Base._extend_dynamic(scope1, null, null, null);
    return Tree.Lift(Base.lookup(scope1, "x", "right", {
      on_miss: (scope2, identifier, right) => {
        Assert.deepEqual(scope1, scope2);
        Assert.deepEqual(identifier, "x");
        Assert.deepEqual(right, "right");
        return Tree.primitive(123);
      },
      on_live_hit: () => Assert.fail(),
      on_dead_hit: () => Assert.fail(),
      on_dynamic_hit: () => Assert.fail()
    }));
  }), Lang.PARSE_BLOCK(`{
    123;
  }`), Assert);
  // // lookup >> (hit && full dynamic frame)
  Lang._match_block(
    Base.EXTEND_STATIC(
      Base._make_root(),
      (scope1) => Base.Box(
        scope1,
        "with",
        false,
        Tree.primitive("with-frame"),
        (box1) => Base.Box(
          scope1,
          "block",
          false,
          Tree.primitive("block-frame"),
          (box2) => Base.Box(
            scope1,
            "closure",
            false,
            Tree.primitive("closure-frame"),
            (box3) => Tree.Lone(
              [],
              Base.EXTEND_STATIC(
                Base._extend_dynamic(scope1, box1, box2, box3),
                (scope1) => Tree.Lift(
                  Base.lookup(
                    scope1,
                    "x",
                    "right",
                    {
                      on_miss: (scope2, identifier, right) => (
                        Assert.deepEqual(scope1, scope2),
                        Assert.deepEqual(identifier, "x"),
                        Assert.deepEqual(right, "right"),
                        Tree.primitive(123)),
                      on_live_hit: () => Assert.fail(),
                      on_dead_hit: (scope2, identifier, right) => (
                        Assert.deepEqual(scope2, scope1),
                        Assert.deepEqual(identifier, "x"),
                        Assert.deepEqual(right, "right"),
                        Tree.primitive(456)),
                      on_dynamic_hit: (scope2, identifier, right, box, check) => (
                        Assert.deepEqual(scope2, scope1),
                        Assert.deepEqual(identifier, "x"),
                        Assert.deepEqual(right, "right"),
                        Tree.binary(
                          "+",
                          Base.get(scope1, box),
                          Tree.primitive(check)))})))))))),
    Lang.PARSE_BLOCK(
      `{
        {
          let $_unscopables;
          (
            (
              #Reflect.has("with-frame", "x") ?
              (
                $_unscopables = #Reflect.get("with-frame", #Symbol.unscopables),
                (
                  (
                    (typeof $_unscopables === "object") ?
                    $_unscopables :
                    (typeof $_unscopables === "function")) ?
                  #Reflect.get($_unscopables, "x") :
                  false)) :
              true) ?
            (
              #Reflect.has("block-frame", "x") ?
              (
                (#Reflect.get("block-frame", "x") === #"@deadzone") ?
                456 :
                ("block-frame" + true)) :
              (
                #Reflect.has("closure-frame", "x") ?
                ("closure-frame" + false) :
                123)) :
            ("with-frame" + false));}}`),
    Assert);

  // Lang._match_block(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   scope1 = Base._extend_dynamic(scope1, Base._primitive_box(12), Base._primitive_box(34), Base._primitive_box(56));
  //   Assert.throws(() => Base.lookup(scope1, "this", "right", {
  //     on_miss: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_dynamic_hit: () => Assert.fail()
  //   }), new global.Error("Missing special identifier"));
  //   return Tree.Lift(Base.lookup(scope1, "x", "right", {
  //     on_miss: (scope2, identifier, right) => {
  //       Assert.deepEqual(scope2, scope1);
  //       Assert.deepEqual(identifier, "x");
  //       Assert.deepEqual(right, "right");
  //       return Tree.primitive(123);
  //     },
  //     on_live_hit: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_dynamic_hit: () => Assert.fail()
  //   }));
  // }), Lang.PARSE_BLOCK(`{123;}`), Assert);
  //
  // // on_miss //
  // Assert.deepEqual(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   return Tree.Bundle([
  //     Tree.Lift(Base.lookup(scope1, "x", "right", {
  //       on_miss: (scope2, identifier, right) => {
  //         Assert.deepEqual(scope2, scope1);
  //         Assert.deepEqual(identifier, "x");
  //         Assert.deepEqual(right, "right");
  //         return Tree.primitive(123);
  //       },
  //       on_live_hit: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_dynamic_hit: () => Assert.fail()
  //     }))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   123;
  // }`));
  // // on_live_hit //
  // Assert.deepEqual(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   Base._declare(scope1, "x", true);
  //   return Tree.Bundle([
  //     Tree.Lift(Base.initialize(scope1, "x", Tree.primitive(123))),
  //     Tree.Lift(Base.lookup(scope1, "x", "right", {
  //       on_miss: () => Assert.fail(),
  //       on_live_hit: (scope2, identifier, right, writable, access) => {
  //         Assert.deepEqual(scope2, scope1);
  //         Assert.deepEqual(identifier, "x");
  //         Assert.deepEqual(right, "right");
  //         Assert.deepEqual(writable, true);
  //         return access(null);
  //       },
  //       on_dead_hit: () => Assert.fail(),
  //       on_dynamic_hit: () => Assert.fail()
  //     }))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $$x;
  //   $$x = 123;
  //   $$x;
  // }`));
  // // on_dead_hit //
  // Assert.deepEqual(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   Base._declare(scope1, "x", true);
  //   return Tree.Bundle([
  //     Tree.Lift(Base.lookup(scope1, "x", "right", {
  //       on_miss: () => Assert.fail(),
  //       on_live_hit: () => Assert.fail(),
  //       on_dead_hit: (scope2, identifier, right, writable) => {
  //         Assert.deepEqual(scope2, scope1);
  //         Assert.deepEqual(identifier, "x");
  //         Assert.deepEqual(right, "right");
  //         Assert.deepEqual(writable, true);
  //         return Tree.primitive(123);
  //       },
  //       on_dynamic_hit: () => Assert.fail()
  //     })),
  //     Tree.Lift(Base.initialize(scope1, "x", Tree.primitive(456)))
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $$x;
  //   123;
  //   $$x = 456;
  // }`));
  // // on_dynamic_hit (with unscopables) //
  // Assert.deepEqual(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   return Base.Box(scope1, "object_box", true, Tree.primitive("object-box"), (box1) => {
  //     return Base.Box(scope1, "unscopables_box", true, Tree.primitive("unsopables-box"), (box2) => {
  //       const scope2 = Base._extend_dynamic(scope1, box1, box2);
  //       return Tree.Lift(Base.lookup(scope2, "x", "right", {
  //         on_miss: (scope3, identifier, right) => {
  //           Assert.deepEqual(scope3, scope2);
  //           Assert.deepEqual(identifier, "x");
  //           Assert.deepEqual(right, "right");
  //           return Tree.primitive(123);
  //         },
  //         on_live_hit: () => Assert.fail(),
  //         on_dead_hit: () => Assert.fail(),
  //         on_dynamic_hit: (scope3, identifier, right, box3) => {
  //           Assert.deepEqual(scope3, scope2);
  //           Assert.deepEqual(identifier, "x");
  //           Assert.deepEqual(right, "right");
  //           Assert.deepEqual(box3, box1);
  //           return Tree.primitive(456);
  //         }
  //       }));
  //     });
  //   });
  // }), Lang.PARSE_BLOCK(`{
  //   let $_object_box_1_1, $_unscopables_box_1_1;
  //   $_object_box_1_1 = "object-box";
  //   $_unscopables_box_1_1 = "unsopables-box";
  //   (
  //     (
  //       #Reflect.has($_object_box_1_1, "x") ?
  //       (
  //         $_unscopables_box_1_1 = #Reflect.get($_object_box_1_1, #Symbol.unscopables),
  //         (
  //           (
  //             (typeof $_unscopables_box_1_1 === "object") ?
  //             $_unscopables_box_1_1 :
  //             (typeof $_unscopables_box_1_1 === "function")) ?
  //           #Reflect.get($_unscopables_box_1_1, "x") :
  //           false)) :
  //       true) ?
  //     123 :
  //     456);
  // }`));
  // // on_dynamic_hit (without unscopables) //
  // Assert.deepEqual(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   return Base.Box(scope1, "object_box", true, Tree.primitive("object-box"), (box1) => {
  //     const scope2 = Base._extend_dynamic(scope1, box1, null);
  //     return Tree.Lift(Base.lookup(scope2, "x", "right", {
  //       on_miss: (scope3, identifier, right) => {
  //         Assert.deepEqual(scope3, scope2);
  //         Assert.deepEqual(identifier, "x");
  //         Assert.deepEqual(right, "right");
  //         return Tree.primitive(123);
  //       },
  //       on_live_hit: () => Assert.fail(),
  //       on_dead_hit: () => Assert.fail(),
  //       on_dynamic_hit: (scope3, identifier, right, box2) => {
  //         Assert.deepEqual(scope3, scope2);
  //         Assert.deepEqual(identifier, "x");
  //         Assert.deepEqual(right, "right");
  //         Assert.deepEqual(box2, box1);
  //         return Tree.primitive(456);
  //       }
  //     }));
  //   });
  // }), Lang.PARSE_BLOCK(`{
  //   let $_object_box_1_1;
  //   $_object_box_1_1 = "object-box";
  //   (
  //     #Reflect.has($_object_box_1_1, "x") ?
  //     456 :
  //     123);
  // }`));
  // // read_this && read_new_target //
  // Assert.throws(() => Base.lookup(Base._make_root(), "this", null, {
  //   on_miss: () => Assert.fail(),
  //   on_dead_hit: () => Assert.fail(),
  //   on_dynamic_hit: () => Assert.fail(),
  //   on_live_hit: () => Assert.fail()
  // }), new Error("Missing special identifier"));
  // Assert.throws(() => Base.lookup(Base._make_root(), "new.target", null, {
  //   on_miss: () => Assert.fail(),
  //   on_dead_hit: () => Assert.fail(),
  //   on_dynamic_hit: () => Assert.fail(),
  //   on_live_hit: () => Assert.fail()
  // }), new Error("Missing special identifier"));
  // Assert.deepEqual(Base.EXTEND_STATIC(Base._make_root(), (scope1) => {
  //   Base._declare(scope1, "this", true);
  //   Base._declare(scope1, "new.target", true);
  //   Assert.throws(() => Base.lookup(scope1, "this", null, {
  //     on_miss: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_dynamic_hit: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail()
  //   }), new Error("Special identifier in deadzone"));
  //   Assert.throws(() => Base.lookup(scope1, "new.target", null, {
  //     on_miss: () => Assert.fail(),
  //     on_dead_hit: () => Assert.fail(),
  //     on_dynamic_hit: () => Assert.fail(),
  //     on_live_hit: () => Assert.fail()
  //   }), new Error("Special identifier in deadzone"));
  //   return Tree.Bundle([
  //     Tree.Lift(Base.initialize(scope1, "this", Tree.primitive(123))),
  //     Tree.Lift(Base.initialize(scope1, "new.target", Tree.primitive(456))),
  //     Base.Box(scope1, "object_box", true, Tree.primitive("object-box"), (box) => {
  //       const scope2 = Base._extend_dynamic(scope1, box, null);
  //       return Tree.Bundle([
  //         Tree.Lift(Base.lookup(scope2, "this", null, {
  //           on_miss: () => Assert.fail(),
  //           on_dead_hit: () => Assert.fail(),
  //           on_dynamic_hit: () => Assert.fail(),
  //           on_live_hit: (scope3, identifier, right, writable, access) => {
  //             Assert.deepEqual(scope3, scope2);
  //             Assert.deepEqual(identifier, "this");
  //             Assert.deepEqual(right, null);
  //             Assert.deepEqual(writable, true);
  //             return access(null);
  //           }
  //         })),
  //         Tree.Lift(Base.lookup(scope2, "new.target", null, {
  //           on_miss: () => Assert.fail(),
  //           on_dead_hit: () => Assert.fail(),
  //           on_dynamic_frame: () => Assert.fail(),
  //           on_live_hit: (scope3, identifier, right, writable, access) => {
  //             Assert.deepEqual(scope3, scope2);
  //             Assert.deepEqual(identifier, "new.target");
  //             Assert.deepEqual(right, null);
  //             Assert.deepEqual(writable, true);
  //             return access(null);
  //           }
  //         }))
  //       ]);
  //     })
  //   ]);
  // }), Lang.PARSE_BLOCK(`{
  //   let $$this, $$0newtarget, $_object_box_1_1;
  //   $$this = 123;
  //   $$0newtarget = 456;
  //   $_object_box_1_1 = "object-box";
  //   $$this;
  //   $$0newtarget;
  // }`));
});
