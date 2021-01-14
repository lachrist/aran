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

exports.visitClass = (scope, node, context) => (
  Throw.assert(
    (
      node.type === "ClassDeclaration" ||
      node.type === "ClassExpression"),
    null,
    `Invalid class node`),
  context = global_Object_assign(
    {name:null},
    context),
  scope = Scope.StrictBindingScope(scope),
  (
    node.superClass === null ?
    stage1(
      scope,
      node,
      "constructor",
      Scope.IntrinsicBox("Object"),
      context.name) :
    Scope.makeBoxExpression(
      scope,
      false,
      "ClassSuperConstructor",
      Visit.visitExpression(scope, node.superClass, null),
      (super_constructor_box) => Tree.SequenceExpression(
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Scope.makeOpenExpression(scope, super_constructor_box),
            Tree.PrimitiveExpression(null)),
          Tree.PrimitiveExpression(void 0),
          Intrinsic.makeConstructExpression(
            Intrinsic.makeGrabExpression("Object"),
            Intrinsic.makeObjectExpression(
              Tree.PrimitiveExpression(null),
              [
                [
                  Tree.PrimitiveExpression("length"),
                  Tree.PrimitiveExpression(0)]]),
            Scope.makeOpenExpression(scope, super_constructor_box))),
        stage1(
          scope,
          node,
          "derived-constructor",
          super_constructor_box,
          context.name)))));

const stage1 = (scope, node, sort, super_constructor_box, name_nullable_box) => (
  node.id === null ?
  stage2(scope, node, sort, super_constructor_box, name_nullable_box) :
  Tree.ApplyExpression(
    Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Scope.makeHeadClosureBlock(
        scope,
        {
          sort: "arrow",
          super: null,
          self: null,
          newtarget: false},
        false,
        [
          {kind:"param", name:node.id.name, ghost:false, exports:[]}],
        (scope) => Tree.BundleStatement(
          [
            Scope.makeInitializeStatement(
              scope,
              "param",
              node.id.name,
              Scope.makeBoxExpression(
                scope,
                false,
                "ClassName",
                Tree.PrimitiveExpression(node.id.name),
                (name_box) => stage2(
                  scope,
                  node,
                  sort,
                  super_constructor_box,
                  name_box))),
            Tree.ReturnStatement(
              Scope.makeReadExpression(scope, node.id.name))]),
        (scope) => Tree.PrimitiveExpression(void 0))),
    Tree.PrimitiveExpression(void 0),
    []));

const stage2 = (scope, node, sort, super_constructor_box, name_nullable_box) => Scope.makeBoxExpression(
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
  Intrinsic.makeObjectExpression(
    Intrinsic.makeGetExpression(
      Scope.makeOpenExpression(scope, super_constructor_box),
      Tree.PrimitiveExpression("prototype"),
      null),
    []),
  (prototype_box) => Scope.makeBoxExpression(
    scope,
    false,
    "ClassSuper",
    Intrinsic.makeObjectExpression(
      Tree.PrimitiveExpression(null),
      [
        [
          Tree.PrimitiveExpression("constructor"),
          Scope.makeOpenExpression(scope, super_constructor_box)],
        [
          Tree.PrimitiveExpression("prototype"),
          Scope.makeOpenExpression(scope, prototype_box)]]),
    (super_box) => Scope.makeBoxExpression(
      scope,
      false,
      "ClassConstructor",
      (
        ArrayLite.some(
          node.body.body,
          is_constructor_method) ?
        Visit.visitClosure(
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
        Intrinsic.makeGetExpression(
          Intrinsic.makeDefinePropertyExpression(
            Scope.makeOpenExpression(scope, prototype_box),
            Tree.PrimitiveExpression("constructor"),
            {
              value: Intrinsic.makeDefinePropertyExpression(
                Intrinsic.makeDefinePropertyExpression(
                  Intrinsic.makeDefinePropertyExpression(
                    Tree.ClosureExpression(
                      "constructor",
                      false,
                      false,
                      Scope.makeHeadClosureBlock(
                        scope,
                        sort,
                        false,
                        [],
                        (scope) => Tree.BundleStatement([]),
                        (scope) => Tree.ConditionalExpression(
                          Scope.makeInputExpression(scope, "new.target"),
                          // N.B.: {__proto__: #Reflect.get(NEW_TARGET, "prototype")} === #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET)
                          Intrinsic.makeConstructExpression(
                            Scope.makeOpenExpression(scope, super_constructor_box),
                            Scope.makeInputExpression(scope, "arguments"),
                            Scope.makeInputExpression(scope, "new.target")),
                          Intrinsic.makeThrowTypeErrorExpression("Generated closure must be invoked as a constructor")))),
                    Tree.PrimitiveExpression("length"),
                    {
                      __proto__: null,
                      value: Tree.PrimitiveExpression(0),
                      writable: false,
                      enumerable: false,
                      configurable: true},
                    true,
                    Intrinsic.TARGET_RESULT),
                  Tree.PrimitiveExpression("name"),
                  {
                    __proto__: null,
                    value: (
                      name_nullable_box === null ?
                      Tree.PrimitiveExpression("") :
                      Scope.makeOpenExpression(scope, name_nullable_box)),
                    writable: false,
                    enumerable: false,
                    configurable: true},
                  true,
                  Intrinsic.TARGET_RESULT),
                Tree.PrimitiveExpression("prototype"),
                {
                  __proto__: null,
                  value: Scope.makeOpenExpression(scope, prototype_box),
                  writable: false,
                  enumerable: false,
                  configurable: false},
                true,
                Intrinsic.TARGET_RESULT),
              writable: true,
              enumerable: false,
              configurable: true},
            true,
            Intrinsic.TARGET_RESULT),
          Tree.PrimitiveExpression("constructor"),
          null)),
      (constructor_box) => ArrayLite.reduce(
        ArrayLite.reverse(node.body.body),
        (expression, node) => (
          node.kind === "constructor" ?
          expression :
          Tree.SequenceExpression(
            Scope.makeBoxExpression(
              scope,
              false,
              "ClassMethodKey",
              Visit.visitKey(scope, node.key, {computed:node.computed}),
              (key_box) => Intrinsic.makeDefinePropertyExpression(
                Scope.makeOpenExpression(
                  scope,
                  node.static ? constructor_box : prototype_box),
                Scope.makeOpenExpression(scope, key_box),
                (
                  node.kind === "method" ?
                  {
                    __proto__: null,
                    value: Visit.visitClosure(
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
                    [node.kind]: Visit.visitClosure(
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
                Intrinsic.TARGET_RESULT)),
            expression)),
        (
          node.superClass === null ? 
          Scope.makeOpenExpression(scope, constructor_box) :
          Intrinsic.makeSetPrototypeOfExpression(
            Scope.makeOpenExpression(scope, constructor_box),
            Scope.makeOpenExpression(scope, super_constructor_box),
            true,
            Intrinsic.TARGET_RESULT))))));
