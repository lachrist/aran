"use strict";

const global_Error = global.Error;
const global_String = global.String;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Scope = require("../../scope/index.js");
const Query = require("../../query/index.js");
const Completion = require("../../completion.js");
const Builtin = require("../../builtin.js");
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

exports.class = (scope, node, context) => (
  node.superClass === null ?
  stage1(
    scope,
    node,
    {
      __proto__: context,
      super: null}) :
  Scope.box(
    scope,
    "ClassSuper",
    false,
    Expression.visit(scope, node.superClass, Expression._default_context),
    (super_box) => Tree.sequence(
      Tree.conditional(
        Tree.binary(
          "===",
          Scope.get(scope, super_box),
          Tree.primitive(null)),
        Tree.primitive(void 0),
        Builtin.construct(
          Builtin.grab("Object"),
          Builtin.construct_object(
            Tree.primitive(null),
            [
              [
                Tree.primitive("length"),
                {
                  __proto__: null,
                  value: Tree.primitive(0),
                  writable: true,
                  enumerable: true,
                  configurable: true}]]),
          Scope.get(scope, super_box))),
      stage1(
        scope,
        node,
        {
          __proto__: context,
          super: super_box}))));

const stage1 = (scope, node, context) => (
  scope = Scope._extend_use_strict(scope),
  (
    node.id === null ?
    stage2(scope, node, context) :
    Tree.apply(
      Tree.arrow(
        Scope.EXTEND_STATIC(
          scope,
          {
            __proto__: null,
            [node.id.name]: false},
          (scope) => Tree.Bundle(
            [
              Tree.Return(
                Tree.sequence(
                  Scope.initialize(
                    scope,
                    node.id.name,
                    Scope.box(
                      scope,
                      "ClassName",
                      false,
                      Tree.primitive(node.id.name),
                      (name_box) => stage2(
                        scope,
                        node,
                        {
                          __proto__: context,
                          name: name_box}))),
                Scope.read(scope, node.id.name)))]))),
      Tree.primitive(void 0),
      [])));

const stage2 = (scope, node, context) => Scope.box(
  scope,
  "ClassPrototype",
  false,
  Builtin.construct_object(
    (
      context.super === null ?
      Builtin.grab("Object.prototype") :
      Builtin.get(
        Scope.get(scope, context.super),
        Tree.primitive("prototype"),
        null)),
    []),
  (prototype_box) => (
    context = {
      __proto__: context,
      self: prototype_box},
    Scope.box(
      scope,
      "ClassConstructor",
      false,
      (
        ArrayLite.some(
          node.body.body,
          (node) => node.kind === "constructor") ?
        Expression.visit(
          scope,
          ArrayLite.find(
            node.body.body,
            (node) => node.kind === "constructor").value,
          {
            __proto__: context,
            tag: "constructor",
            accessor: null}) :
        Builtin.define_property(
          Builtin.define_property(
            Tree.constructor(
              Scope.EXTEND_STATIC(
                scope,
                {__proto__:null},
                (scope) => Tree.Return(
                  Tree.conditional(
                    Scope.parameter(scope, "new.target"),
                    // N.B.: {__proto__: #Reflect.get(NEW_TARGET, "prototype")} === #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET)
                    (
                      context.super === null ?
                      Builtin.construct_object(
                        Builtin.get(
                          Scope.parameter(scope, "new.target"),
                          Tree.primitive("prototype"),
                          null),
                        []) :
                      Builtin.construct(
                        Scope.get(scope, context.super),
                        Scope.parameter(scope, "arguments"),
                        Scope.parameter(scope, "new.target"))),
                    Builtin.throw_type_error("Class constructor cannot be invoked without 'new'"))))),
            Tree.primitive("length"),
            {
              __proto__: null,
              value: Tree.primitive(0),
              writable: false,
              enumerable: false,
              configurable: true},
            true,
            Builtin._target_result),
          Tree.primitive("name"),
          {
            __proto__: null,
            value: (
              context.name === null ?
              Tree.primitive("") :
              Scope.get(scope, context.name)),
            writable: false,
            enumerable: false,
            configurable: true},
          true,
          Builtin._target_result)),
      (constructor_box) => Tree.sequence(
        Tree.sequence(
          Builtin.define_property(
            Scope.get(scope, prototype_box),
            Tree.primitive("constructor"),
            {
              __proto__: null,
              value: Scope.get(scope, constructor_box),
              writable: true,
              enumerable: false,
              configurable: true},
            false,
            Builtin._success_result),
          Builtin.define_property(
            Scope.get(scope, constructor_box),
            Tree.primitive("prototype"),
            {
              __proto__: null,
              value: Scope.get(scope, prototype_box),
              writable: false,
              enumerable: false,
              configurable: false},
            false,
            Builtin._success_result)),
        ArrayLite.reduce(
          node.body.body,
          (expression, node) => (
            node.kind === "constructor" ?
            expression :
            Tree.sequence(
              Scope.box(
                scope,
                "ClassMethodKey",
                false,
                (
                  node.computed ?
                  Expression.visit(scope, node.key, Expression._default_context) :
                  Tree.primitive(node.key.name)),
                (key_box) => Builtin.define_property(
                  Scope.get(
                    scope,
                    node.static ? constructor_box : prototype_box),
                  Scope.get(scope, key_box),
                  (
                    node.kind === "method" ?
                    {
                      __proto__: null,
                      value: Expression.visit(
                        scope,
                        node.value,
                        {
                          __proto__: null,
                          tag: "method",
                          accessor: null,
                          name: key_box}),
                      writable: true,
                      enumerable: false,
                      configurable: true} :
                    {
                      __proto__: null,
                      [node.kind]: Expression.visit(
                        scope,
                        node.value,
                        {
                          __proto__: null,
                          tag: "method",
                          accessor: node.kind,
                          name: key_box}),
                      enumerable: false,
                      configurable: true}),
                  true, // to detect: class C {  [(console.log("foo"), "prototype")] () {} }
                  Builtin._target_result)),
              expression)),
          Scope.get(scope, constructor_box))))));
