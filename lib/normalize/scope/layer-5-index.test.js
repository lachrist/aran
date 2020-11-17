"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Scope = require("./index.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // _extend_binding && _get_binding //
  Assert.deepEqual(
    Scope._get_binding_super(
      Scope._extend_binding_super(
        Scope._make_global(),
        "foo")),
    "foo");
  // typeof //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x: true},
      (scope) => Scope.Box(
        scope,
        "object_box",
        true,
        Tree.primitive(123),
        (box) => Tree.Bundle(
          [
            Tree.Lift(
              Scope.typeof(scope, "y")),
            Tree.Lift(
              Scope.typeof(scope, "x")),
            Tree.Lift(
              Scope.initialize(
                scope,
                "x",
                Tree.primitive(456))),
            Tree.Lift(
              Scope.typeof(
                Scope._extend_dynamic(scope, box, null),
                "x"))]))),
    Lang.PARSE_BLOCK(
      `{
        let $$x, $_object_box_1_1;
        $_object_box_1_1 = 123;
        (
          #Reflect.has(#global, "y") ?
          typeof #Reflect.get(#global, "y") :
          "undefined");
        throw new #ReferenceError("Cannot access 'x' before initialization");
        $$x = 456;
        (
          #Reflect.has($_object_box_1_1, "x") ?
          typeof #Reflect.get($_object_box_1_1, "x") :
          typeof $$x);}`),
    Assert);
  // delete //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x: true},
    (scope) => Scope.Box(
      scope,
      "object_box",
      true,
      Tree.primitive(123),
      (box) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.delete(scope, "y")),
          Tree.Lift(
            Scope.delete(scope, "x")),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x",
              Tree.primitive(456))),
          Tree.Lift(
            Scope.delete(
              Scope._extend_dynamic(scope, box, null),
              "x"))]))),
  Lang.PARSE_BLOCK(
    `{
      let $$x, $_object_box_1_1;
      $_object_box_1_1 = 123;
      (
        #Reflect.has(#global, "y") ?
        #Reflect.deleteProperty(#global, "y") :
        true);
      true;
      $$x = 456;
      (
        #Reflect.has($_object_box_1_1, "x") ?
        #Reflect.deleteProperty($_object_box_1_1, "x") :
        true);}`),
  Assert);
  // read //
  Assert.throws(
    () => Scope.read(
      Scope._make_global(),
      "this"),
    new Error("Missing special identifier"));
  Assert.throws(
    () => Scope.read(
      Scope._make_global(),
      "new.target"),
    new Error("Missing special identifier"));
  Assert.throws(
    () => Scope.read(
      Scope._make_global(),
      "super"),
    new Error("Missing special identifier"));
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x: true},
      (scope) => Scope.Box(
        scope,
        "object_box",
        true,
        Tree.primitive(123),
        (box) => Tree.Bundle(
          [
            Tree.Lift(
              Scope.read(scope, "y")),
            Tree.Lift(
              Scope.read(scope, "x")),
            Tree.Lift(
              Scope.initialize(
                scope,
                "x",
                Tree.primitive(456))),
            Tree.Lift(
              Scope.read(
                Scope._extend_dynamic(scope, box, null),
                "x"))]))),
  Lang.PARSE_BLOCK(
    `{
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
        $$x);}`),
  Assert);
  // optimistic write //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x1: true,
        x2: false},
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.write(
              scope,
              "y",
              Tree.primitive("foo"))),
          Tree.Lift(
            Scope.write(
              scope,
              "x1",
              Tree.primitive("bar"))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x1",
              Tree.primitive(123))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x2",
              Tree.primitive(456))),
          Tree.Lift(
            Scope.write(
              scope,
              "x1",
              Tree.primitive("qux"))),
          Tree.Lift(
            Scope.write(
              scope,
              "x2",
              Tree.primitive("buz")))])),
    Lang.PARSE_BLOCK(
      `{
        let $$x1, $$x2;
        (
          #Reflect.has(#global, "y") ?
          #Reflect.set(#global, "y", "foo") :
          #Reflect.defineProperty(
            #global,
            "y",
            {
              __proto__: null,
              value: "foo",
              writable: true,
              enumerable: true,
              configurable: true}));
        (
          "bar",
          throw new #ReferenceError("Cannot access 'x1' before initialization"));
        $$x1 = 123;
        $$x2 = 456;
        $$x1 = "qux";
        (
          "buz",
          throw new #TypeError("Assignment to constant variable."));}`),
  Assert);
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x1: true,
        x2: false},
      (scope1) => Scope.Box(
        scope1,
        "object_box",
        true,
        Tree.primitive(123),
        (box) => Tree.Lone(
          [],
          Scope.EXTEND_STATIC(
            Scope._extend_dynamic(scope1, box, null),
            {__proto__: null},
            (scope2) => Tree.Bundle(
              [
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "y",
                    Tree.unary("!", Tree.primitive("foo")))),
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "x1",
                    Tree.unary(
                      "!",
                      Tree.primitive("bar")))),
                Tree.Lift(
                  Scope.initialize(
                    scope1,
                    "x1",
                    Tree.primitive(123))),
                Tree.Lift(
                  Scope.initialize(
                    scope1,
                    "x2",
                    Tree.primitive(456))),
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "x1",
                    Tree.unary(
                      "!",
                      Tree.primitive("qux")))),
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "x2",
                    Tree.unary(
                      "!",
                      Tree.primitive("buz"))))]))))),
    Lang.PARSE_BLOCK(
      `{
      let $$x1, $$x2, $_object_box_1_1;
      $_object_box_1_1 = 123;
      {
        let $_right_hand_side_2_1, $_right_hand_side_2_2, $_right_hand_side_2_3, $_right_hand_side_2_4;
        (
          $_right_hand_side_2_1 = !"foo",
          (
            #Reflect.has($_object_box_1_1, "y") ?
            #Reflect.set($_object_box_1_1, "y", $_right_hand_side_2_1) :
            (
              #Reflect.has(#global, "y") ?
              #Reflect.set(#global, "y", $_right_hand_side_2_1) :
              #Reflect.defineProperty(
                #global,
                "y",
                {
                  __proto__: null,
                  value: $_right_hand_side_2_1,
                  writable: true,
                  enumerable: true,
                  configurable: true}))));
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
            throw new #TypeError("Assignment to constant variable.")));}}`),
  Assert);
  // strict pessimistic write && strict optimistic write //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._extend_use_strict(
        Scope._make_global()),
      {__proto__: null},
      (scope) => Tree.Bundle(
        [
          Scope.Box(
            scope,
            "frame",
            true,
            Tree.primitive(123),
            (box) => Tree.Lift(
              Scope.write(
                Scope._extend_dynamic(scope, box, null),
                "y",
                Tree.unary(
                  "!",
                  Tree.primitive("bar")))))])),
    Lang.PARSE_BLOCK(
      `{
        let _right, _frame;
        _frame = 123;
        (
          _right = !"bar",
          (
            #Reflect.has(_frame, "y") ?
            (
              #Reflect.set(_frame, "y", _right) ?
              true :
              throw new #TypeError("Cannot set object property")) :
            (
              #Reflect.has(#global, "y") ?
              (
                #Reflect.set(#global, "y", _right) ?
                true :
                throw new #TypeError("Cannot set object property")) :
              throw new #ReferenceError("y is not defined"))));}`),
    Assert);
});