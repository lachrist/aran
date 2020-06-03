
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Scope = require("./index.js");
const State = require("../state.js");
const Lang = require("../lang.js");
const Parser = require("../../../test/parser/index.js");

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  // typeof //
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._make_root(), {__proto__:null, x:true}, (scope) => {
    return Scope.Box(scope, "object_box", true, Lang.primitive(123), (box) => {
      return Lang.Bundle([
        Lang.Lift(Scope.typeof(scope, "y")),
        Lang.Lift(Scope.typeof(scope, "x")),
        Lang.Lift(Scope.initialize(scope, "x", Lang.primitive(456))),
        Lang.Lift(Scope.typeof(Scope._extend_dynamic(scope, box, null), "x"))
      ]);
    });
  }), Parser.PARSE(`{
    let $$x, $_object_box_1_1;
    $_object_box_1_1 = 123;
    typeof #Reflect.get(#global, "y");
    throw new #ReferenceError("Cannot access 'x' before initialization");
    $$x = 456;
    (
      #Reflect.has($_object_box_1_1, "x") ?
      typeof #Reflect.get($_object_box_1_1, "x") :
      typeof $$x);
  }`));
  // delete //
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._make_root(), {__proto__:null, x:true}, (scope) => {
    return Scope.Box(scope, "object_box", true, Lang.primitive(123), (box) => {
      return Lang.Bundle([
        Lang.Lift(Scope.delete(scope, "y")),
        Lang.Lift(Scope.delete(scope, "x")),
        Lang.Lift(Scope.initialize(scope, "x", Lang.primitive(456))),
        Lang.Lift(Scope.delete(Scope._extend_dynamic(scope, box, null), "x"))
      ]);
    });
  }), Parser.PARSE(`{
    let $$x, $_object_box_1_1;
    $_object_box_1_1 = 123;
    #Reflect.deleteProperty(#global, "y");
    true;
    $$x = 456;
    (
      #Reflect.has($_object_box_1_1, "x") ?
      #Reflect.deleteProperty($_object_box_1_1, "x") :
      true);
  }`));
  // read //
  Assert.throws(() => Scope.read(Scope._make_root(), "this"), new Error("Missing special identifier"));
  Assert.throws(() => Scope.read(Scope._make_root(), "new.target"), new Error("Missing special identifier"));
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._make_root(), {__proto__:null, x:true}, (scope) => {
    return Scope.Box(scope, "object_box", true, Lang.primitive(123), (box) => {
      return Lang.Bundle([
        Lang.Lift(Scope.read(scope, "y")),
        Lang.Lift(Scope.read(scope, "x")),
        Lang.Lift(Scope.initialize(scope, "x", Lang.primitive(456))),
        Lang.Lift(Scope.read(Scope._extend_dynamic(scope, box, null), "x"))
      ]);
    });
  }), Parser.PARSE(`{
    let $$x, $_object_box_1_1;
    $_object_box_1_1 = 123;
    (
      #Reflect.has(#global, "y") ?
      #Reflect.get(#global, "y") :
      throw new #ReferenceError("y is not defined"));
    throw new #ReferenceError("Cannot access 'x' before initialization");
    $$x = 456;
    (
      #Reflect.has($_object_box_1_1, "x") ?
      #Reflect.get($_object_box_1_1, "x") :
      $$x);
  }`));
  // optimistic write //
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._make_root(), {__proto__:null, x1:true, x2:false}, (scope) => {
    return Lang.Bundle([
      Lang.Lift(Scope.write(scope, "y", Lang.primitive("foo"))),
      Lang.Lift(Scope.write(scope, "x1", Lang.primitive("bar"))),
      Lang.Lift(Scope.initialize(scope, "x1", Lang.primitive(123))),
      Lang.Lift(Scope.initialize(scope, "x2", Lang.primitive(456))),
      Lang.Lift(Scope.write(scope, "x1", Lang.primitive("qux"))),
      Lang.Lift(Scope.write(scope, "x2", Lang.primitive("buz")))
    ]);
  }), Parser.PARSE(`{
    let $$x1, $$x2;
    #Reflect.set(#global, "y", "foo");
    ("bar", throw new #ReferenceError("Cannot access 'x1' before initialization"));
    $$x1 = 123;
    $$x2 = 456;
    $$x1 = "qux";
    ("buz", throw new #TypeError("Assignment to constant variable."));
  }`));
  // pessimistic write //
  // Assert.deepEqual = (x, y) => {
  //   console.log(JSON.stringify(x));
  //   console.log(JSON.stringify(y));
  // };
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._extend_use_strict(Scope._make_root()), {__proto__:null}, (scope) => {
    return Lang.Lift(Scope.write(scope, "x", Lang.unary("!", Lang.primitive("foo"))));
  }), Parser.PARSE(`{
    let $_right_hand_side_1_1;
    (
      $_right_hand_side_1_1 = !"foo",
      (
        #Reflect.has(#global, "x") ?
        (
          #Reflect.set(#global, "x", $_right_hand_side_1_1) ?
          true :
          throw new #TypeError("Cannot assign object property")) :
        throw new #ReferenceError("x is not defined")));
  }`));
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._make_root(), {__proto__:null, x1:true, x2:false}, (scope1) => {
    return Scope.Box(scope1, "object_box", true, Lang.primitive(123), (box) => {
      return Lang.Lone([], Scope.EXTEND_STATIC(Scope._extend_dynamic(scope1, box, null), {__proto__:null}, (scope2) => { 
        return Lang.Bundle([
          Lang.Lift(Scope.write(scope2, "y", Lang.unary("!", Lang.primitive("foo")))),
          Lang.Lift(Scope.write(scope2, "x1", Lang.unary("!", Lang.primitive("bar")))),
          Lang.Lift(Scope.initialize(scope1, "x1", Lang.primitive(123))),
          Lang.Lift(Scope.initialize(scope1, "x2", Lang.primitive(456))),
          Lang.Lift(Scope.write(scope2, "x1", Lang.unary("!", Lang.primitive("qux")))),
          Lang.Lift(Scope.write(scope2, "x2", Lang.unary("!", Lang.primitive("buz"))))
        ]);
      }));
    });
  }), Parser.PARSE(`{
    let $$x1, $$x2, $_object_box_1_1;
    $_object_box_1_1 = 123;
    {
      let $_right_hand_side_2_1, $_right_hand_side_2_2, $_right_hand_side_2_3, $_right_hand_side_2_4;
      (
        $_right_hand_side_2_1 = !"foo",
        (
          #Reflect.has($_object_box_1_1, "y") ?
          #Reflect.set($_object_box_1_1, "y", $_right_hand_side_2_1) :
          #Reflect.set(#global, "y", $_right_hand_side_2_1)));
      (
        $_right_hand_side_2_2 = !"bar",
        (
          #Reflect.has($_object_box_1_1, "x1") ?
          #Reflect.set($_object_box_1_1, "x1", $_right_hand_side_2_2) :
          throw new #ReferenceError("Cannot access 'x1' before initialization")));
      $$x1 = 123;
      $$x2 = 456;
      (
        $_right_hand_side_2_3 = !"qux",
        (
          #Reflect.has($_object_box_1_1, "x1") ?
          #Reflect.set($_object_box_1_1, "x1", $_right_hand_side_2_3) :
          $$x1 = $_right_hand_side_2_3));
      (
        $_right_hand_side_2_4 = !"buz",
        (
          #Reflect.has($_object_box_1_1, "x2") ?
          #Reflect.set($_object_box_1_1, "x2", $_right_hand_side_2_4) :
          throw new #TypeError("Assignment to constant variable.")));
    }
  }`));
});
