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


exports.class = (scope, node, name_nullable_box) => (
  node.superClass === null ?
  stage1(scope, node, name_nullable_box, null) :
  Scope.box(
    scope,
    "ClassSuper",
    false,
    Expression.visit(scope, node.superClass, false, null),
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
    "ClassName",
    false,
    Tree.primitive(node.id.name),
    (name_box) => stage3(scope, node, name_box, super_nullable_box)));

const stage3 = (scope, node, name_nullable_box, super_nullable_box) => Scope.box(
  scope,
  "constructor",
  false,
  (
    ArrayLite.some(node.body.body, Query._is_constructor_method) ?
    Expression.visit(
      scope,
      ArrayLite.find(node.body.body, Query._is_constructor_method).value,
      {
        __proto__: null,
        completion: (
          node.superClass === null ?
          Completion._constructor :
          Completion._derived_constructor),
        name: name_nullable_box,
        super: super_nullable_box}) :
    Builtin.define_property(
      Builtin.define_property(
        Tree.function(
          Scope.EXTEND_STATIC(
            scope,
            {__proto__:null},
            (scope) => Tree.Return(
              Tree.conditional(
                Scope.parameter(scope, "new.target"),
                // N.B {__proto__: #Reflect.get(NEW_TARGET, "prototype")} === #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET)
                Builtin.construct(
                  (
                    super_nullable_box === null ?
                    Builtin.grab("Object") :
                    Scope.get(scope, super_nullable_box)),
                  Scope.parameter(scope, "arguments"),
                  Scope.parameter(scope, "new.target")),
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
          name_nullable_box === null ?
          Tree.primitive("") :
          Scope.get(scope, name_nullable_box)),
        writable: false,
        enumerable: false,
        configurable: true},
      true,
      Builtin._target_result)),
  (constructor_box, _closure) => (
    _closure = (node, _name_box) => [
      Scope.box(
        scope,
        "ClassMethodName",
        false,
        (
          node.computed ?
          Expression.visit(scope, node.key, false, null) :
          Tree.primitive(node.key.name)),
        (name_box) => (
          _name_box = name_box,
          Scope.get(scope, name_box))),
      {
        __proto__: null,
        [node.kind === "method" ? "value" : node.kind]: Expression.visit(
          scope,
          node.value,
          {
            __proto__: null,
            completion: Completion._method,
            name: _name_box,
            super: super_nullable_box}),
        [node.kind === "method" ? "writable" : "foobar"]: true,
        enumerable: false,
        configurable: true}],
    // _closure = (expression, node) => Scope.box(
    //   scope,
    //   "ClassMethodName",
    //   false,
    //   (
    //     node.computed ?
    //     Expression.visit(scope, node.key, false, null) :
    //     Tree.primitive(node.key.name)),
    //   (name_box) => Mop.defineProperty(
    //     expression,
    //     Scope.get(scope, name_box),
    //     {
    //       __proto__: null,
    //       [node.kind === "method" ? "value" : node.kind]: Expression.visit(
    //         scope,
    //         node.value,
    //         {
    //           __proto__: null,
    //           completion: Completion._method,
    //           name: name_box,
    //           super: super_nullable_box}),
    //       [node.kind === "method" ? "writable" : "foobar"]: true,
    //       enumerable: false,
    //       configurable: true},
    //     false,
    //     Mop._target_result)),
    ArrayLite.reduce(
      ArrayLite.filter(
        node.body.body,
        Query._is_static_method),
      (expression, node, _pair) => (
        _pair = _closure(node),
        Builtin.define_property(
          expression,
          _pair[0],
          _pair[1],
          true,
          Builtin._target_result)),
      Builtin.define_property(
        Scope.get(scope, constructor_box),
        Tree.primitive("prototype"),
        {
          __proto__: null,
          value: Builtin.construct_object(
            (
              super_nullable_box === null ?
              Builtin.grab("Object.prototype") :
              Tree.conditional(
                Tree.binary(
                  "===",
                  Scope.get(scope, super_nullable_box),
                  Tree.primitive(null)),
                Tree.primitive(null),
                Builtin.get(
                  Scope.get(scope, super_nullable_box),
                  Tree.primitive("prototype"),
                  null))),
            ArrayLite.concat(
              [
                [
                  Tree.primitive("constructor"),
                  {
                    __proto__: null,
                    value: Scope.get(scope, constructor_box),
                    writable: true,
                    enumerable: false,
                    configurable: true}]],
              ArrayLite.map(
                ArrayLite.filter(
                  node.body.body,
                  Query._is_instance_method),
                _closure))),
          writable: true,
          enumerable: false,
          configurable: false},
        true,
        Builtin._target_result))));
