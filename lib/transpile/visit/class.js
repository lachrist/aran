"use strict";

const global_Error = global.Error;
const global_String = global.String;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const Scope = require("../scope/index.js");
const Query = require("../query/index.js");
const Completion = require("../completion.js");
const Builtin = require("../builtin.js");
const Visit = require("./index.js");

const is_constructor_method = (method) => method.kind === "constructor";

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
  Throw.assert(
    (
      node.type === "ClassDeclaration" ||
      node.type === "ClassExpression"),
    null,
    `Invalid class node`),
  context = global_Object_assign(
    {name:null},
    context),
  scope = Scope._use_strict(scope),
  (
    node.superClass === null ?
    stage1(
      scope,
      node,
      context.name,
      null) :
    Scope.box(
      scope,
      false,
      "ClassSuper",
      Visit.expression(scope, node.superClass, null),
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
                  Tree.primitive(0)]]),
            Scope.get(scope, super_box))),
        stage1(
          scope,
          node,
          context.name,
          super_box)))));

const stage1 = (scope, node, name_nullable_box, super_nullable_box) => (
  node.id === null ?
  stage2(scope, node, name_nullable_box, super_nullable_box) :
  Tree.apply(
    Tree.arrow(
      Scope.CLOSURE_HEAD(
        scope,
        {
          sort: "arrow",
          super: null,
          self: null,
          newtarget: false},
        false,
        [
          {kind:"param", name:node.id.name, ghost:false, exports:[]}],
        (scope) => Tree.Bundle(
          [
            Tree.Return(
              Tree.sequence(
                Scope.initialize(
                  scope,
                  "param",
                  node.id.name,
                  Scope.box(
                    scope,
                    false,
                    "ClassName",
                    Tree.primitive(node.id.name),
                    (name_box) => stage2(
                      scope,
                      node,
                      name_box,
                      super_nullable_box))),
                Scope.read(scope, node.id.name)))]),
        false)),
    Tree.primitive(void 0),
    []));

const stage2 = (scope, node, name_nullable_box, super_nullable_box) => Scope.box(
  scope,
  false,
  "ClassPrototype",
  Builtin.construct_object(
    (
      super_nullable_box === null ?
      Builtin.grab("Object.prototype") :
      Builtin.get(
        Scope.get(scope, super_nullable_box),
        Tree.primitive("prototype"),
        null)),
    []),
  (prototype_box) => Scope.box(
    scope,
    false,
    "ClassConstructor",
    (
      ArrayLite.some(
        node.body.body,
        is_constructor_method) ?
      Visit.closure(
        scope,
        ArrayLite.find(
          node.body.body,
          is_constructor_method).value,
        {
          sort: "constructor",
          self: prototype_box,
          name: name_nullable_box,
          super: super_nullable_box,
          prototype: prototype_box,
          accessor: null}) :
      Builtin.get(
        Builtin.define_property(
          Scope.get(scope, prototype_box),
          Tree.primitive("constructor"),
          {
            value: Builtin.define_property(
              Builtin.define_property(
                Builtin.define_property(
                  Tree.constructor(
                    Scope.CLOSURE_HEAD(
                      scope,
                      {
                        __proto__: null,
                        sort: "constructor",
                        super: super_nullable_box,
                        self: prototype_box,
                        newtarget: true},
                      false,
                      [],
                      (scope) => Tree.Return(
                        Tree.conditional(
                          Scope.parameter(scope, "new.target"),
                          // N.B.: {__proto__: #Reflect.get(NEW_TARGET, "prototype")} === #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET)
                          (
                            super_nullable_box === null ?
                            Builtin.construct_object(
                              Builtin.get(
                                Scope.parameter(scope, "new.target"),
                                Tree.primitive("prototype"),
                                null),
                              []) :
                            Builtin.construct(
                              Scope.get(scope, super_nullable_box),
                              Scope.parameter(scope, "arguments"),
                              Scope.parameter(scope, "new.target"))),
                          Builtin.throw_type_error("Generated closure must be invoked as a constructor"))))),
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
                Builtin._target_result),
              Tree.primitive("prototype"),
              {
                __proto__: null,
                value: Scope.get(scope, prototype_box),
                writable: false,
                enumerable: false,
                configurable: false},
              true,
              Builtin._target_result),
            writable: true,
            enumerable: false,
            configurable: true},
          true,
          Builtin._target_result),
        Tree.primitive("constructor"),
        null)),
    (constructor_box) => ArrayLite.reduce(
      node.body.body,
      (expression, node) => (
        node.kind === "constructor" ?
        expression :
        Tree.sequence(
          Scope.box(
            scope,
            false,
            "ClassMethodKey",
            Visit.key(scope, node.key, {computed:node.computed}),
            (key_box) => Builtin.define_property(
              Scope.get(
                scope,
                node.static ? constructor_box : prototype_box),
              Scope.get(scope, key_box),
              (
                node.kind === "method" ?
                {
                  __proto__: null,
                  value: Visit.closure(
                    scope,
                    node.value,
                    {
                      sort: "method",
                      self: prototype_box,
                      name: key_box}),
                  writable: true,
                  enumerable: false,
                  configurable: true} :
                {
                  __proto__: null,
                  [node.kind]: Visit.closure(
                    scope,
                    node.value,
                    {
                      sort: "method",
                      self: prototype_box,
                      accessor: node.kind,
                      name: key_box}),
                  enumerable: false,
                  configurable: true}),
              true, // to detect: class C {  [(console.log("foo"), "prototype")] () {} }
              Builtin._target_result)),
          expression)),
      Scope.get(scope, constructor_box))));
