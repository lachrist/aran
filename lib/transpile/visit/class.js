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
const Intrinsic = require("../intrinsic.js");
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
      "constructor",
      Scope._intrinsic_box("Object"),
      context.name) :
    Scope.box(
      scope,
      false,
      "ClassSuperConstructor",
      Visit.expression(scope, node.superClass, null),
      (super_constructor_box) => Tree.sequence(
        Tree.conditional(
          Tree.binary(
            "===",
            Scope.get(scope, super_constructor_box),
            Tree.primitive(null)),
          Tree.primitive(void 0),
          Intrinsic.construct(
            Intrinsic.grab("Object"),
            Intrinsic.construct_object(
              Tree.primitive(null),
              [
                [
                  Tree.primitive("length"),
                  Tree.primitive(0)]]),
            Scope.get(scope, super_constructor_box))),
        stage1(
          scope,
          node,
          "derived-constructor",
          super_constructor_box,
          context.name)))));

const stage1 = (scope, node, sort, super_constructor_box, name_nullable_box) => (
  node.id === null ?
  stage2(scope, node, sort, super_constructor_box, name_nullable_box) :
  Tree.apply(
    Tree.closure(
      "arrow",
      false,
      false,
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
                      sort,
                      super_constructor_box,
                      name_box))),
                Scope.read(scope, node.id.name)))]),
        false)),
    Tree.primitive(void 0),
    []));

const stage2 = (scope, node, sort, super_constructor_box, name_nullable_box) => Scope.box(
  scope,
  false,
  "ClassPrototype",
  // > Reflect.getOwnPropertyDescriptor(Object, "prototype")
  // {
  //   value: [Object: null prototype] {},
  //   writable: false,
  //   enumerable: false,
  //   configurable: false
  // }
  Intrinsic.construct_object(
    Intrinsic.get(
      Scope.get(scope, super_constructor_box),
      Tree.primitive("prototype"),
      null),
    []),
  (prototype_box) => Scope.box(
    scope,
    false,
    "ClassSuper",
    Intrinsic.construct_object(
      Tree.primitive(null),
      [
        [
          Tree.primitive("constructor"),
          Scope.get(scope, super_constructor_box)],
        [
          Tree.primitive("prototype"),
          Scope.get(scope, prototype_box)]]),
    (super_box) => Scope.box(
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
            sort,
            super: super_box,
            name: name_nullable_box,
            prototype: prototype_box,
            accessor: null}) :
        Intrinsic.get(
          Intrinsic.define_property(
            Scope.get(scope, prototype_box),
            Tree.primitive("constructor"),
            {
              value: Intrinsic.define_property(
                Intrinsic.define_property(
                  Intrinsic.define_property(
                    Tree.closure(
                      "constructor",
                      false,
                      false,
                      Scope.CLOSURE_HEAD(
                        scope,
                        sort,
                        false,
                        [],
                        (scope) => Tree.Return(
                          Tree.conditional(
                            Scope.input(scope, "new.target"),
                            // N.B.: {__proto__: #Reflect.get(NEW_TARGET, "prototype")} === #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET)
                            Intrinsic.construct(
                              Scope.get(scope, super_constructor_box),
                              Scope.input(scope, "arguments"),
                              Scope.input(scope, "new.target")),
                            Intrinsic.throw_type_error("Generated closure must be invoked as a constructor"))))),
                    Tree.primitive("length"),
                    {
                      __proto__: null,
                      value: Tree.primitive(0),
                      writable: false,
                      enumerable: false,
                      configurable: true},
                    true,
                    Intrinsic._target_result),
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
                  Intrinsic._target_result),
                Tree.primitive("prototype"),
                {
                  __proto__: null,
                  value: Scope.get(scope, prototype_box),
                  writable: false,
                  enumerable: false,
                  configurable: false},
                true,
                Intrinsic._target_result),
              writable: true,
              enumerable: false,
              configurable: true},
            true,
            Intrinsic._target_result),
          Tree.primitive("constructor"),
          null)),
      (constructor_box) => ArrayLite.reduce(
        ArrayLite.reverse(node.body.body),
        (expression, node) => (
          node.kind === "constructor" ?
          expression :
          Tree.sequence(
            Scope.box(
              scope,
              false,
              "ClassMethodKey",
              Visit.key(scope, node.key, {computed:node.computed}),
              (key_box) => Intrinsic.define_property(
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
                        super: super_box,
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
                        super: super_box,
                        accessor: node.kind,
                        name: key_box}),
                    enumerable: false,
                    configurable: true}),
                true, // to detect: class C {  [(console.log("foo"), "prototype")] () {} }
                Intrinsic._target_result)),
            expression)),
        (
          node.superClass === null ? 
          Scope.get(scope, constructor_box) :
          Intrinsic.set_prototype_of(
            Scope.get(scope, constructor_box),
            Scope.get(scope, super_constructor_box),
            true,
            Intrinsic._target_result))))));
