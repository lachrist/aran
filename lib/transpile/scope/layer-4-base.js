"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");
const Meta = require("./layer-3-meta.js");

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
exports.BindingScope = Meta.BindingScope;
exports.fetchBinding = Meta.fetchBinding;
exports.lookupAll = Meta.lookupAll;
exports.makeInputExpression = Meta.makeInputExpression;
exports.getDepth = Meta.getDepth;

exports.makeBoxStatement = Meta.makeBoxStatement;
exports.makeBoxExpression = Meta.makeBoxExpression;
exports.makeOpenExpression = Meta.makeOpenExpression;
exports.makeCloseExpression = Meta.makeCloseExpression;
exports.TestBox = Meta.TestBox;
exports.PrimitiveBox = Meta.PrimitiveBox;
exports.IntrinsicBox = Meta.IntrinsicBox;

//////////
// Kind //
//////////

const is_loose_kind = (kind) => (
  kind === "var" ||
  kind === "function");

const is_rigid_kind = (kind) => (
  kind === "param" ||
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "import");

const is_writable_kind = (kind) => (
  kind === "var" ||
  kind === "function" ||
  kind === "param" ||
  kind === "let");

// const is_constant_kind = (kind) => (
//   kind === "const" ||
//   kind === "class" ||
//   kind === "import");

const updateExportLink = (variable, read, write, expression) => ArrayLite.reduce(
  variable.exports,
  (expression, specifier) => Tree.SequenceExpression(
    expression,
    Tree.ExportExpression(
      specifier,
      read())),
  write(expression));

///////////////////
// _is_available //
///////////////////

// This export is the mean provided by this module to signal duplicate variable
// declarations as early syntax error.
//
// Unfortunatelly, although the the global declarative record can only contains
// let/const/class variables, it also bookkeeps var/function variables to detect
// variable duplication.
//
// Hence the following does not work:
//
// const is_available_callback_prototype = {
//   static: function (kind) { return this.loose && is_loose_kind(kind) },
//   dynamic: function (frame, nullable_kind) { return
//     (
//       this.loose &&
//       frame.loose) ||
//     !this.callbacks.has_variable(frame.tag) }};

const is_available_callback_prototype = {
  static (variable) { return (
    is_loose_kind(this.kind) &&
    is_loose_kind(variable.kind)); } };

const get_tag = ({tag}) => tag;

const get_loose = ({loose}) => loose;

const get_empty = ({empty}) => empty;

exports.isAvailable = (scope, kind, identifier, _nullable_frame_array) => (
  _nullable_frame_array = Meta.isAvailable(
    scope,
    kind,
    identifier,
    {
      __proto__: is_available_callback_prototype,
      kind}),
  (
    _nullable_frame_array === null ?
    null :
    ArrayLite.map(
      ArrayLite.filterOut(
        (
          is_loose_kind(kind) ?
          ArrayLite.filterOut(_nullable_frame_array, get_loose) :
          _nullable_frame_array),
        get_empty),
      get_tag)));

//////////////////
// DynamicScope //
//////////////////

exports.DynamicScope = (scope, kinds, tag, unscopables, box) => (
  Throw.assert(
    (
      ArrayLite.every(kinds, is_loose_kind) ||
      ArrayLite.every(kinds, is_rigid_kind)),
    null,
    `Cannot mix rigid variables and loose variables inside dynamic frame`),
  Meta.DynamicScope(
    scope,
    kinds,
    {
      loose: ArrayLite.every(kinds, is_loose_kind),
      empty: kinds.length === 0,
      tag,
      unscopables,
      box}));

/////////////
// Declare //
/////////////

exports.makeDeclareStatement = (scope, variable, configurable, enclave, _result) => (
  Throw.assert(!variable.ghost || !is_loose_kind(variable.kind), null, `Ghost variable cannot be of loose kind`),
  _result = Meta.declare(scope, variable),
  Throw.assert(!variable.ghost || _result.type === "static", null, `Ghost variables must be static`),
  (
    _result.type === "static" ?
    (
      _result.conflict === null ?
      (
        is_loose_kind(variable.kind) ?
        (
          _result = Meta.initialize(scope, variable.kind, variable.name),
          // console.assert(_result.type === "static")
          Tree.ExpressionStatement(
            updateExportLink(_result.variable, _result.read, _result.initialize, Tree.PrimitiveExpression(void 0)))) :
        Tree.ListStatement([])) :
      (
        Throw.assert(
          (
            is_loose_kind(variable.kind) &&
            is_loose_kind(_result.conflict.kind)),
          null,
          `Duplicate variable declaration`),
        Tree.ListStatement([]))) :
    (
      _result.type === "dynamic" ?
      // console.assert(_result.value.loose === is_loose_kind(variable.kind))
      Tree.ExpressionStatement(
        (
          variable.kind === "function" ?
          Intrinsic.makeDefinePropertyExpression(
            Meta.makeOpenExpression(scope, _result.frame.box),
            Tree.PrimitiveExpression(variable.name),
            {
              __proto__: null,
              // fresh value to trigger type error
              value: Intrinsic.makeSymbolExpression("function-placeholder"),
              writable: true,
              enumerable: true,
              configurable: (
                configurable ?
                Meta.makeBoxExpression(
                  scope,
                  false,
                  "ScopeBaseDeclareFunctionDescriptor",
                  Intrinsic.makeGetOwnPropertyDescriptorExpression(
                    Meta.makeOpenExpression(scope, _result.frame.box),
                    Tree.PrimitiveExpression(variable.name)),
                  (descriptor_box) => Tree.ConditionalExpression(
                    Meta.makeOpenExpression(scope, descriptor_box),
                    Intrinsic.makeGetExpression(
                      Meta.makeOpenExpression(scope, descriptor_box),
                      Tree.PrimitiveExpression("configurable"),
                      null),
                    Tree.PrimitiveExpression(true))) :
                Tree.PrimitiveExpression(false))},
            true,
            Intrinsic.TARGET_RESULT) :
          Tree.ConditionalExpression(
            Intrinsic.makeGetOwnPropertyDescriptorExpression(
              Meta.makeOpenExpression(scope, _result.frame.box),
              Tree.PrimitiveExpression(variable.name)),
            (
              variable.kind === "var" ?
              Tree.PrimitiveExpression(void 0) :
              // console.assert(!is_loose_kind(variable.kind))
              Intrinsic.makeThrowSyntaxErrorExpression(`Rigid variable of kind ${variable.kind} named '${variable.name}' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)`)),
            Intrinsic.makeDefinePropertyExpression(
              Meta.makeOpenExpression(scope, _result.frame.box),
              Tree.PrimitiveExpression(variable.name),
              {
                __proto__: null,
                value: (
                  _result.frame.loose ?
                  Tree.PrimitiveExpression(void 0) :
                  Intrinsic.makeGrabExpression("aran.deadzoneMarker")),
                writable: is_writable_kind(variable.kind),
                enumerable: true,
                configurable: configurable},
              true,
              Intrinsic.TARGET_RESULT)))) :
      // console.assert(_result.type === "enclave")
      (
        Throw.assert(variable.exports.length === 0, `Cannot enclave export-linked variables`),
        (
          is_loose_kind(variable.kind) ?
          enclave(
            scope,
            variable.kind,
            variable.name,
            Tree.PrimitiveExpression(void 0)) :
          Tree.ListStatement([]))))));

////////////////
// initialize //
////////////////

exports.makeInitializeStatement = (scope, kind, identifier, expression, maybe, write, enclave, _result) => (
  is_loose_kind(kind) ?
  Tree.ExpressionStatement(
    write(scope, identifier, expression)) :
  (
    _result = Meta.initialize(scope, kind, identifier, maybe),
    (
      _result.type === "static" ?
      Tree.ExpressionStatement(
        updateExportLink(_result.variable, _result.read, _result.initialize, expression)) :
      (
        _result.type === "dynamic" ?
        Tree.ExpressionStatement(
          Tree.ConditionalExpression(
            Intrinsic.makeHasExpression(
              Meta.makeOpenExpression(scope, _result.frame.box),
              Tree.PrimitiveExpression(identifier)),
            Tree.ConditionalExpression(
              Tree.BinaryExpression(
                "===",
                Intrinsic.makeGetExpression(
                  Meta.makeOpenExpression(scope, _result.frame.box),
                  Tree.PrimitiveExpression(identifier),
                  null),
                Intrinsic.makeGrabExpression("aran.deadzoneMarker")),
              Intrinsic.makeDefinePropertyExpression(
                Meta.makeOpenExpression(scope, _result.frame.box),
                Tree.PrimitiveExpression(identifier),
                {
                  __proto__: null,
                  value: expression},
                false,
                Intrinsic.SUCCESS_RESULT),
              Intrinsic.makeThrowSyntaxErrorExpression(`Variable named '${identifier}' has already been initialized (this should never happen, please consider submitting a bug repport)`)),
            Intrinsic.makeThrowSyntaxErrorExpression(`Variable named '${identifier}' has not yet been declared (this should never happen, please consider submitting a bug repport)`))) :
        // console.assert(_result.type === "enclave")
        enclave(scope, kind, identifier, expression)))));

////////////
// lookup //
////////////

const lookup_callback_prototype = {
  on_miss () { return this.callbacks.on_miss(); },
  on_static_live_hit (variable, read, write) { return this.callbacks.on_static_live_hit(
    variable,
    read,
    (expression) => updateExportLink(variable, read, write, expression)); },
  on_static_dead_hit (variable) { return this.callbacks.on_static_dead_hit(variable); },
  on_dynamic_frame (frame, expression3, _expression1, _expression2) { return (
    this.bypass ?
    expression3 :
    (
      // Switch order of evaluation to let layer-5 throw early and not create unscopable identifier
      _expression2 = this.callbacks.on_dynamic_live_hit(frame.tag, frame.box),
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
      _expression2 = (
        frame.loose ?
        _expression2 :
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Intrinsic.makeGetExpression(
              Meta.makeOpenExpression(this.scope, frame.box),
              Tree.PrimitiveExpression(this.identifier),
              null),
            Intrinsic.makeGrabExpression("aran.deadzoneMarker")),
          this.callbacks.on_dynamic_dead_hit(),
          _expression2)),
      Tree.ConditionalExpression(_expression1, _expression2, expression3))); }};

exports.makeLookupExpression = (scope, identifier, callbacks) => (
  Throw.assert(
    (
      (callbacks.on_dynamic_dead_hit === null) ===
      (callbacks.on_dynamic_live_hit === null)),
    null,
    `Invalid lookup callback object`),
  Meta.makeLookupExpression(
    scope,
    identifier,
    {
      __proto__: lookup_callback_prototype,
      bypass: callbacks.on_dynamic_dead_hit === null,
      scope,
      identifier,
      callbacks}));
