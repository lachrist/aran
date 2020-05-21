
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Scope = require("./index.js");
const State = require("../state.js");
const Build = require("../build.js");
const Parser = require("../../../test/parser/index.js");

require("../../lang/build.js")._debug_mode();


State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  // typeof //
  Assert.deepEqual(Scope.EXTEND_STATIC(null, {__proto__:null, x:true}, (scope) => {
    return Scope.Box(scope, "object_box", Build.primitive(123), (box) => {
      return [
        Build.Lift(Scope.typeof(scope, "y")),
        Build.Lift(Scope.typeof(scope, "x")),
        Build.Lift(Scope.initialize(scope, "x", Build.primitive(456))),
        Build.Lift(Scope.typeof(Scope._extend_dynamic(scope, box, null), "x"))
      ].flat();
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
  Assert.deepEqual(Scope.EXTEND_STATIC(null, {__proto__:null, x:true}, (scope) => {
    return Scope.Box(scope, "object_box", Build.primitive(123), (box) => {
      return [
        Build.Lift(Scope.delete(scope, "y")),
        Build.Lift(Scope.delete(scope, "x")),
        Build.Lift(Scope.initialize(scope, "x", Build.primitive(456))),
        Build.Lift(Scope.delete(Scope._extend_dynamic(scope, box, null), "x"))
      ].flat();
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
  Assert.throws(() => Scope.read(null, "this"), new Error("Missing special identifier"));
  Assert.throws(() => Scope.read(null, "new.target"), new Error("Missing special identifier"));
  Assert.deepEqual(Scope.EXTEND_STATIC(null, {__proto__:null, x:true}, (scope) => {
    return Scope.Box(scope, "object_box", Build.primitive(123), (box) => {
      return [
        Build.Lift(Scope.read(scope, "y")),
        Build.Lift(Scope.read(scope, "x")),
        Build.Lift(Scope.initialize(scope, "x", Build.primitive(456))),
        Build.Lift(Scope.read(Scope._extend_dynamic(scope, box, null), "x"))
      ].flat();
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
  Assert.deepEqual(Scope.EXTEND_STATIC(null, {__proto__:null, x1:true, x2:false}, (scope) => {
    return [
      Build.Lift(Scope.write(scope, "y", Build.primitive("foo"))),
      Build.Lift(Scope.write(scope, "x1", Build.primitive("bar"))),
      Build.Lift(Scope.initialize(scope, "x1", Build.primitive(123))),
      Build.Lift(Scope.initialize(scope, "x2", Build.primitive(456))),
      Build.Lift(Scope.write(scope, "x1", Build.primitive("qux"))),
      Build.Lift(Scope.write(scope, "x2", Build.primitive("buz")))
    ].flat();
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
  Assert.deepEqual(Scope.EXTEND_STATIC(Scope._extend_use_strict(null), {__proto__:null}, (scope) => {
    return Build.Lift(Scope.write(scope, "x", Build.primitive("foo")));
  }), Parser.PARSE(`{
    let $_right_hand_side_1_1;
    (
      $_right_hand_side_1_1 = "foo",
      (
        #Reflect.has(#global, "x") ?
        (
          #Reflect.set(#global, "x", $_right_hand_side_1_1) ?
          true :
          throw new #TypeError("Cannot assign object property")) :
        throw new #ReferenceError("x is not defined")));
  }`));
  Assert.deepEqual(Scope.EXTEND_STATIC(null, {__proto__:null, x1:true, x2:false}, (scope1) => {
    return Scope.Box(scope1, "object_box", Build.primitive(123), (box) => {
      return Build.Lone([], Scope.EXTEND_STATIC(Scope._extend_dynamic(scope1, box, null), {__proto__:null}, (scope2) => { 
        return [
          Build.Lift(Scope.write(scope2, "y", Build.primitive("foo"))),
          Build.Lift(Scope.write(scope2, "x1", Build.primitive("bar"))),
          Build.Lift(Scope.initialize(scope1, "x1", Build.primitive(123))),
          Build.Lift(Scope.initialize(scope1, "x2", Build.primitive(456))),
          Build.Lift(Scope.write(scope2, "x1", Build.primitive("qux"))),
          Build.Lift(Scope.write(scope2, "x2", Build.primitive("buz")))
        ].flat();
      }));
    });
  }), Parser.PARSE(`{
    let $$x1, $$x2, $_object_box_1_1;
    $_object_box_1_1 = 123;
    {
      let $_right_hand_side_2_1, $_right_hand_side_2_2, $_right_hand_side_2_3, $_right_hand_side_2_4;
      (
        $_right_hand_side_2_1 = "foo",
        (
          #Reflect.has($_object_box_1_1, "y") ?
          #Reflect.set($_object_box_1_1, "y", $_right_hand_side_2_1) :
          #Reflect.set(#global, "y", $_right_hand_side_2_1)));
      (
        $_right_hand_side_2_2 = "bar",
        (
          #Reflect.has($_object_box_1_1, "x1") ?
          #Reflect.set($_object_box_1_1, "x1", $_right_hand_side_2_2) :
          throw new #ReferenceError("Cannot access 'x1' before initialization")));
      $$x1 = 123;
      $$x2 = 456;
      (
        $_right_hand_side_2_3 = "qux",
        (
          #Reflect.has($_object_box_1_1, "x1") ?
          #Reflect.set($_object_box_1_1, "x1", $_right_hand_side_2_3) :
          $$x1 = $_right_hand_side_2_3));
      (
        $_right_hand_side_2_4 = "buz",
        (
          #Reflect.has($_object_box_1_1, "x2") ?
          #Reflect.set($_object_box_1_1, "x2", $_right_hand_side_2_4) :
          throw new #TypeError("Assignment to constant variable.")));
    }
  }`));
});
