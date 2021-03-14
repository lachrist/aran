"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");
const Meta = require("./layer-3-meta.js");
const Variable = require("../../variable.js");

// type DynamicFrame = (ObjectBox, UnscopablesBox)
// type ObjectBox = Box
// type UnscopablesBox = Maybe Box

// type MetaCallbacks = .outer.Callbacks
// type RegularContext = (Scope, Identifier, Callbacks)
// type Callbacks = (OnMiss, OnLiveHit, OnDeadHit, OnDynamicHit)
// type OnMiss = Scope -> Identifier -> Right -> AranExpression
// type OnLiveHit = Scope -> Identifier -> Right -> Tag -> Access -> AranExpression
// type OnDeadHit = Scope -> Identifier -> Right -> Tag -> AranExpression
// type OnDynamicHit = Scope -> Identifier -> Right -> Box -> AranExpression
// type Right = *

// Order of operations:
//
// const p = new Proxy({}, {
//   proto__: null,
//   defineProperty: (target, key, property) => (console.log("defineProperty " + String(key)), Reflect.defineProperty(target, key, property)),
//   getOwnPropertyDescriptor: (target, key) => (console.log("getOwnPropertyDescriptor " + String(key)), Reflect.getOwnPropertyDescriptor(target, key)),
//   getPrototypeOf: (target) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(target)),
//   setPrototypeOf: (target, prototype) => (console.log("setPrototypeOf"), Reflect.setPrototypeOf(target, prototype)),
//   deleteProperty: (target, key) => (console.log("deleteProperty " + String(key)), Reflect.deleteProperty(target, key)),
//   has: (target, key) => (console.log("has " + String(key)), Reflect.has(target, key)),
//   set: (target, key, value, receiver) => (console.log("set " + String(key)), Reflect.set(target, key, value, receiver)),
//   get: (target, key, receiver) => (console.log("set " + String(key)), Reflect.get(target, key, receiver)),
//   ownKeys: (target) => (console.log("ownKeys " + String(key)), Reflect.ownKeys(target)),
//   preventExtensions: (target) => (console.log("preventExtensions"), Reflect.preventExtensions(target))
// });
// with (p) { flat }
// has flat
// get Symbol(Symbol.unscopables)
// Thrown:
// ReferenceError: flat is not defined

/////////////
// Forward //
/////////////

exports.RootScope = Meta.RootScope;
exports.makeBlock = Meta.makeBlock;
exports.ClosureScope = Meta.ClosureScope;
exports.PropertyScope = Meta.PropertyScope;
exports.getPropertyValue = Meta.getPropertyValue;
exports.makeEvalExpression = Meta.makeEvalExpression;
exports.makeInputExpression = Meta.makeInputExpression;

exports.makeBoxStatement = Meta.makeBoxStatement;
exports.makeBoxExpression = Meta.makeBoxExpression;
exports.makeOpenExpression = Meta.makeOpenExpression;
exports.makeCloseExpression = Meta.makeCloseExpression;
exports.TestBox = Meta.TestBox;
exports.PrimitiveBox = Meta.PrimitiveBox;
exports.IntrinsicBox = Meta.IntrinsicBox;

////////////
// Helper //
////////////

const isEmpty = (array) => array.length === 0;

const updateExport = (scope, specifiers, box, write) => ArrayLite.reduce(
  specifiers,
  (expression, specifier) => Tree.SequenceExpression(
    expression,
    Tree.ExportExpression(
      specifier,
      Meta.makeOpenExpression(scope, box))),
  write(
    Meta.makeOpenExpression(scope, box)));

//////////////////
// DynamicScope //
//////////////////

exports.DynamicScope = (scope, data, deadzone, unscopables, box) => Meta.DynamicScope(
  scope,
  {
    data,
    deadzone,
    unscopables,
    box});

/////////////
// Declare //
/////////////

exports.makeDeclareStatement = (scope, variable, ghost, _frame) => (
  Meta.isStatic(scope) ?
  (
    Meta.declareStaticVariable(
      scope,
      Variable.getName(variable),
      Variable.isImport(variable) || ghost,
      {
        writable: Variable.isWritable(variable),
        import: (
          Variable.isImport(variable) ?
          {
            specifier: Variable.getImportSpecifier(variable),
            source: Variable.getImportSource(variable)} :
          null),
        exports: Variable.getExportSpecifierArray(variable)}),
    (
      Variable.isLoose(variable) ?
      // console.assert(!Variable.isImport(variable))
      Tree.ExpressionStatement(
        updateExport(
          scope,
          Variable.getExportSpecifierArray(variable),
          Meta.PrimitiveBox(void 0),
          (expression) => Meta.makeStaticInitializeExpression(
            scope,
            Variable.getName(variable),
            Tree.PrimitiveExpression(void 0)))) :
      Tree.ListStatement([]))) :
  (
    Throw.assert(
      !ghost,
      null,
      `Non-static ghost variable`),
    Throw.assert(
      isEmpty(
        Variable.getExportSpecifierArray(variable)),
      null,
      `Non-static export variable`),
    Throw.assert(
      !Variable.isImport(variable),
      null,
      `Non-static import variable`),
    (
      Meta.isDynamic(scope) ?
      (
        _frame = Meta.getDynamicFrame(scope),
        Throw.assert(
          (
            Variable.isLoose(variable) ||
            _frame.deadzone),
          null,
          `Invalid dynamic frame for rigid variable (declaration)`),
        Tree.ExpressionStatement(
          Tree.ConditionalExpression(
            Intrinsic.makeGetOwnPropertyDescriptorExpression(
              Intrinsic.makeOpenExpression(scope, _frame.box),
              Tree.PrimitiveExpression(
                Variable.getName(variable))),
            (
              Variable.isLoose(variable) ?
              Tree.PrimitiveExpression(void 0) :
              Intrinsic.makeThrowReferenceErrorExpression(`Duplicate rigid variable declaration (this should never happen, please consider submitting a bug report)`)),
            Intrinsic.makeDefinePropertyExpression(
              Intrinsic.makeOpenExpression(scope, _frame.box),
              Tree.PrimitiveExpression(
                Variable.getName(variable)),
              {
                __proto__:null,
                value: (
                  Variable.isLoose(variable) ?
                  Tree.PrimitiveExpression(void 0) :
                  Intrinsic.makeGrabExpression("aran.deadzoneSymbol")),
                writable: Variable.isWritable(variable),
                enumerable: true,
                configurable: Variable.isRigid(variable)},
              false,
              Intrinsic.SUCCESS_RESULT)))) :
      // console.assert(Meta.isRoot(scope))
      Tree.ListStatement([]))));

////////////////
// Initialize //
////////////////

// Loose variable initialization is a regular write:
//
// function f () {
//   var o = {x:123};
//   var p = new Proxy(o, {
//     get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
//     set: (tgt, key, val, rec) => (console.log("set", key, val), Reflect.set(tgt, key, val, rec)),
//     has: (tgt, key) => (console.log("has", key), Reflect.get(tgt, key)),
//   });
//   with (p) {
//     var x = 456;
//   }
//   return o;
// }
// f();
// has x
// get Symbol(Symbol.unscopables)
// set x 123
// { x: 123 }

const declare_enclave_mapping = {
  __proto__: null,
  "var": "var",
  "function": "var",
  "let": "let",
  "const": "const",
  "class": "const"};

exports.makeInitializeStatement = (scope, kind, identifier, box, write, _frame) => (
  Meta.isRoot(scope) ?
  (
    Throw.assert(kind in declare_enclave_mapping, null, `Invalid variable kind for enclave declaration`),
    Tree.__DeclareEnclaveStatement__(
      declare_enclave_mapping[kind],
      identifier,
      Meta.makeOpenExpression(scope, box))) :
  (
    Variable.isLoose(
      Variable[Variable.getConstructorName(kind)](identifier)) ?
    Tree.ExpressionStatement(
      write(scope, identifier, box)) :
    (
      Meta.isStatic(scope) ?
      Tree.ExpressionStatement(
        updateExport(
          scope,
          Meta.getStaticData(scope, identifier).exports,
          box,
          (expression) => Meta.makeStaticInitializeExpression(scope, identifier, expression))) :
      // console.assert(Meta.isDynamic(scope))
      (
        _frame = Meta.getDynamicFrame(scope),
        Throw.assert(_frame.deadzone, null, `Cannot initialize rigid variable on deadzone-disabled dynamic frame`),
        Throw.assert(!_frame.unscopables, null, `Cannot initialize rigid variable on unscopables-enabled dynamic frame`),
        Tree.ExpressionStatement(
          Tree.ConditionalExpression(
            Tree.BinaryExpression(
              "===",
              Intrinsic.makeGetExpression(
                Meta.makeOpenExpression(scope, _frame.box),
                Tree.PrimitiveExpression(identifier)),
              Intrinsic.makeGrabExpression(`aran.deadzoneSymbol`)),
            Intrinsic.makeDefinePropertyExpression(
              Intrinsic.makeOpenExpression(scope, _frame.box),
              Tree.PrimitiveExpression(
                Variable.getName(variable)),
              {
                __proto__: null,
                value: expression,
                configurable: false},
              false,
              Intrinsic.SUCCESS_RESULT),
            Intrinsic.makeThrowReferenceErrorExpression(`Invalid rigid variable initialization (this should never happen, please consider submitting a bug report)`)))))));

////////////
// lookup //
////////////

const isSpecialIdentifier = (identifier) => (
  identifier === "this" ||
  identifier === "new.target" ||
  identifier === "import.meta");

const lookup_callback_prototype = {
  onMiss () { return this.callbacks.onMiss(); },
  onStaticLiveHit (data, read, write) { return this.callbacks.onStaticLiveHit(
    read,
    (box) => (
      data.writable ?
      // console.assert(data.import === null)
      updateExport(this.scope, data.exports, box, write) :
      Intrinsic.makeThrowTypeErrorExpression(`Assignment to constant variable`))); }, 
  onStaticDeadHit (data) { return this.callbacks.onStaticDeadHit(); },
  onDynamicFrame (frame, expression3, _expression1, _expression2) { return (
    isSpecialIdentifier(this.identifier) ?
    expression3 :
    (
      _expression1 = Intrinsic.makeHasExpression(
        Meta.makeOpenExpression(this.scope, frame.box),
        Tree.PrimitiveExpression(this.identifier)),
      _expression1 = (
        frame.unscopables ?
        Tree.ConditionalExpression(
          _expression1,
          Meta.makeBoxExpression(
            this.scope,
            false,
            "ScopeBaseUnscopables",
            Intrinsic.makeGetExpression(
              Meta.makeOpenExpression(this.scope, frame.box),
              Intrinsic.makeGrabExpression("Symbol.unscopables"),
              null),
            (box) => Tree.ConditionalExpression(
              Tree.ConditionalExpression(
                Tree.BinaryExpression(
                  "===",
                  Tree.UnaryExpression(
                    "typeof",
                    Meta.makeOpenExpression(this.scope, box)),
                  Tree.PrimitiveExpression("object")),
                Meta.makeOpenExpression(this.scope, box),
                Tree.BinaryExpression(
                  "===",
                  Tree.UnaryExpression(
                    "typeof",
                    Meta.makeOpenExpression(this.scope, box)),
                  Tree.PrimitiveExpression("function"))),
              Tree.UnaryExpression(
                "!",
                Intrinsic.makeGetExpression(
                  Meta.makeOpenExpression(this.scope, box),
                  Tree.PrimitiveExpression(this.identifier),
                  null)),
              Tree.PrimitiveExpression(true))),
          Tree.PrimitiveExpression(false)) :
        _expression1),
      _expression2 = this.callbacks.onDynamicLiveHit(frame.data, frame.box),
      _expression2 = (
        frame.deadzone ?
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Intrinsic.makeGetExpression(
              Meta.makeOpenExpression(this.scope, frame.box),
              Tree.PrimitiveExpression(this.identifier),
              null),
            Intrinsic.makeGrabExpression("aran.deadzoneMarker")),
          this.callbacks.onDynamicDeadHit(frame.data, frame.box),
          _expression2) :
        _expression2),
      Tree.ConditionalExpression(_expression1, _expression2, expression3))); }};

exports.makeLookupExpression = (scope, identifier, callbacks) => Meta.makeLookupExpression(
  scope,
  identifier,
  {
    __proto__: lookup_callback_prototype,
    scope,
    identifier,
    callbacks});
