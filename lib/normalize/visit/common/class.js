"use strict";

const global_Error = global.Error;
const global_String = global.String;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Scope = require("../../scope/index.js");
const Query = require("../../query/index.js");
const Closure = require("./closure.js");
const Completion = require("../../completion.js");
let Expression = null;

exports._resolve_circular_dependencies = (expression_module) => {
  Expression = expression_module;
};

// var x = function () {};
// x.foo = "bar";
// var y = class extends x {
//   constructor () {
//     // console.log(super.foo);
//     super();
//     console.log(super.foo);
//   }
// }
// new y();

//
// {
//   class C { constructor () { console.log("bar", nameof(new.target), nameof(Reflect.getPrototypeOf(this))) } }
//   class CC extends C { constructor () { super(); console.log("foo", nameof(new.target), nameof(Reflect.getPrototypeOf(this))); } }
//   class CCC {};
//   const names = new Map();
//   names.set(C, "C");
//   names.set(CC, "CC");
//   names.set(CCC, "CCC");
//   names.set(C.prototype, "C.prototype");
//   names.set(CC.prototype, "CC.prototype");
//   names.set(CCC.prototype, "CCC.prototype");
//   const nameof = (value) => names.get(value);
//   Reflect.construct(CC, [], CCC);
// }


exports.class = (scope, node, name_nullable_box) => (
  node.superClass === null ?
  stage1(scope, node, name_nullable_box, null) :
  Scope.box(
    scope,
    "super",
    false,
    Expression.visit(scope, node.superClass, false, null),
    (super_box) => Tree.sequence(
      Tree.conditional(
        Tree.binary(
          "===",
          Scope.get(scope, super_box),
          Tree.primitive(null)),
        Tree.primitive(void 0),
        Tree.apply(
          Tree.builtin("Reflect.construct"),
          Tree.primitive(void 0),
          [
            Tree.builtin("Object"),
            Tree.object(
              Tree.primitive(null),
              [
                [
                  Tree.primitive("length"),
                  Tree.primitive(0)]]),
            Scope.get(scope, super_box)])),
      stage1(scope, node, name_nullable_box, super_box))));

const stage1 = (scope, node, name_nullable_box, super_nullable_box) => (
  scope = Scope._extend_use_strict(scope),
  (
    node.id === null ?
    stage2(scope, node, name_nullable_box, super_nullable_box) :
    Tree.apply(
      Tree.arrow(
        Scope.EXTEND_STATIC(
          scope,
          {
            __proto__: null,
            [node.id.name]: false},
          (scope) => Tree.Bundle(
            [
              Tree.Lift(
                Scope.initialize(
                  scope,
                  node.id.name,
                  stage2(scope, node, name_nullable_box, super_nullable_box))),
              Tree.Return(
                Scope.read(scope, node.id.name))]))),
      Tree.primitive(void 0),
      [])));

const stage2 = (scope, node, name_nullable_box, super_nullable_box) => (
  node.id === null ?
  stage3(scope, node, name_nullable_box, super_nullable_box) :
  Scope.box(
    scope,
    "name",
    false,
    Tree.primitive(node.id.name),
    (name_box) => stage3(scope, node, name_box, super_nullable_box)));

const stage3 = (scope, node, name_nullable_box, super_nullable_box) => Scope.box(
  scope,
  "constructor",
  false,
  (
    ArrayLite.some(node.body.body, Query._is_constructor_method) ?
    Closure.closure(
      scope,
      ArrayLite.find(node.body.body, Query._is_constructor_method).value,
      (
        node.superClass === null ?
        Completion._constructor :
        Completion._derived_constructor),
      name_nullable_box,
      super_nullable_box) :
    Tree.apply(
      Tree.builtin("Object.defineProperty"),
      Tree.primitive(void 0),
      [
        Tree.apply(
          Tree.builtin("Object.defineProperty"),
          Tree.primitive(void 0),
          [
            Tree.constructor(
              Scope.EXTEND_STATIC(
                scope,
                {__proto__:null},
                (scope) => Tree.Return(
                  Tree.conditional(
                    Scope.parameter(scope, "new.target"),
                    // N.B {__proto__: #Reflect.get(NEW_TARGET, "prototype")} === #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET)
                    Tree.apply(
                      Tree.builtin("Reflect.construct"),
                      Tree.primitive(void 0),
                      [
                        (
                          super_nullable_box === null ?
                          Tree.builtin("Object") :
                          Scope.get(scope, super_nullable_box)),
                        Scope.parameter(scope, "arguments"),
                        Scope.parameter(scope, "new.target")]),
                    Tree.throw(
                      Tree.construct(
                        Tree.builtin("TypeError"),
                        [
                          Tree.primitive("Class constructor cannot be invoked without 'new'")])))))),
            Tree.primitive("length"),
            Tree.object(
              Tree.primitive(null),
              [
                [
                  Tree.primitive("value"),
                  Tree.primitive(0)],
                [
                  Tree.primitive("configurable"),
                  Tree.primitive(true)]])]),
        Tree.primitive("name"),
        Tree.object(
          Tree.primitive(null),
          [
            [
              Tree.primitive("value"),
              (
                name_nullable_box === null ?
                Tree.primitive("") :
                Scope.get(scope, name_nullable_box))],
            [
              Tree.primitive("configurable"),
              Tree.primitive(true)]])])),
  (constructor_box, _closure) => (
    _closure = (expression, node) => Scope.box(
      scope,
      "name",
      false,
      (
        node.computed ?
        Expression.visit(scope, node.key, false, null) :
        Tree.primitive(node.key.name)),
      (name_box) => Tree.apply(
        Tree.builtin("Object.defineProperty"),
        Tree.primitive(void 0),
        [
          expression,
          Scope.get(scope, name_box),
          Tree.object(
            Tree.primitive(null),
            (
              node.kind === "method" ?
              [
                [
                  Tree.primitive("value"),
                  Closure.closure(scope, node.value, Completion._method, name_box, super_nullable_box)],
                [
                  Tree.primitive("writable"),
                  Tree.primitive(true)],
                [
                  Tree.primitive("configurable"),
                  Tree.primitive(true)]] :
              [
                [
                  Tree.primitive(node.kind),
                  Closure.closure(scope, node.value, Completion._method, name_box, super_nullable_box)],
                [
                  Tree.primitive("configurable"),
                  Tree.primitive(true)]]))])),
    ArrayLite.reduce(
      ArrayLite.filter(
        node.body.body,
        Query._is_static_method),
      _closure,
      Tree.apply(
        Tree.builtin("Object.defineProperty"),
        Tree.primitive(void 0),
        [
          Scope.get(scope, constructor_box),
          Tree.primitive("prototype"),
          Tree.object(
            Tree.primitive(null),
            [
              [
                Tree.primitive("value"),
                ArrayLite.reduce(
                  ArrayLite.filter(
                    node.body.body,
                    Query._is_instance_method),
                  _closure,
                  Tree.apply(
                    Tree.builtin("Object.defineProperty"),
                    Tree.primitive(void 0),
                    [
                      Tree.object(
                        (
                          super_nullable_box === null ?
                          Tree.builtin("Object.prototype") :
                          Tree.conditional(
                            Tree.binary(
                              "===",
                              Scope.get(scope, super_nullable_box),
                              Tree.primitive(null)),
                            Tree.primitive(null),
                            Tree.apply(
                              Tree.builtin("Reflect.get"),
                              Tree.primitive(void 0),
                              [
                                Scope.get(scope, super_nullable_box),
                                Tree.primitive("prototype")]))),
                        []),
                      Tree.primitive("constructor"),
                      Tree.object(
                        Tree.primitive(null),
                        [
                          [
                            Tree.primitive("value"),
                            Scope.get(scope, constructor_box)],
                          [
                            Tree.primitive("writable"),
                            Tree.primitive(true)],
                          [
                            Tree.primitive("configurable"),
                            Tree.primitive(true)]])]))],
                [
                  Tree.primitive("writable"),
                  Tree.primitive(true)]])]))));
