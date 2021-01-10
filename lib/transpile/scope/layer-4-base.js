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

exports._make_root = Meta._make_root;
exports.EXTEND_STATIC = Meta.EXTEND_STATIC;
exports._extend_closure = Meta._extend_closure;
exports._extend_binding = Meta._extend_binding;
exports._fetch_binding = Meta._fetch_binding;
exports.eval = Meta.eval;
exports.input = Meta.input;
exports._get_depth = Meta._get_depth;

exports.Box = Meta.Box;
exports.ImportBox = Meta.ImportBox;
exports.box = Meta.box;
exports.get = Meta.get;
exports.set = Meta.set;
exports._test_box = Meta._test_box;
exports._primitive_box = Meta._primitive_box;
exports._intrinsic_box = Meta._intrinsic_box;

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

const update_export = (variable, read, write, expression) => ArrayLite.reduce(
  variable.exports,
  (expression, specifier) => Tree.sequence(
    expression,
    Tree.export(
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
  static: function (variable) { return is_loose_kind(this.kind) && is_loose_kind(variable.kind) } };

const get_tag = ({tag}) => tag;

exports._is_available = (scope, kind, identifier, _nullable_frame_array) => (
  _nullable_frame_array = Meta._is_available(
    scope,
    kind,
    identifier,
    {
      __proto__: is_available_callback_prototype,
      kind}),
  (
    _nullable_frame_array === null ?
    null :
    ArrayLite.map(_nullable_frame_array, get_tag)));

/////////////////////
// _extend_dynamic //
/////////////////////

exports._extend_dynamic = (scope, kinds, tag, unscopables, box) => (
  Throw.assert(
    (
      ArrayLite.every(kinds, is_loose_kind) ||
      ArrayLite.every(kinds, is_rigid_kind)),
    null,
    `Cannot mix rigid variables and loose variables inside dynamic frame`),
  Meta._extend_dynamic(
    scope,
    kinds,
    {
      loose: ArrayLite.every(kinds, is_loose_kind),
      tag,
      unscopables,
      box}));

/////////////
// Declare //
/////////////

exports.Declare = (scope, variable, configurable, enclave, _result) => (
  Throw.assert(!variable.ghost || !is_loose_kind(variable.kind), null, `Ghost variable cannot be of loose kind`),
  _result = Meta._declare(scope, variable),
  Throw.assert(!variable.ghost || _result.type === "static", null, `Ghost variables must be static`),
  (
    _result.type === "static" ?
    (
      _result.conflict === null ?
      (
        is_loose_kind(variable.kind) ?
        (
          _result = Meta._initialize(scope, variable.kind, variable.name),
          // console.assert(_result.type === "static")
          Tree.Lift(
            update_export(_result.variable, _result.read, _result.initialize, Tree.primitive(void 0)))) :
        Tree.Bundle([])) :
      (
        Throw.assert(
          (
            is_loose_kind(variable.kind) &&
            is_loose_kind(_result.conflict.kind)),
          null,
          `Duplicate variable declaration`),
        Tree.Bundle([]))) :
    (
      _result.type === "dynamic" ?
      // console.assert(_result.value.loose === is_loose_kind(variable.kind))
      Tree.Lift(
        (
          variable.kind === "function" ?
          Intrinsic.define_property(
            Meta.get(scope, _result.frame.box),
            Tree.primitive(variable.name),
            {
              __proto__: null,
              // fresh value to trigger type error
              value: Intrinsic.construct_symbol("function-placeholder"),
              writable: true,
              enumerable: true,
              configurable: (
                configurable ?
                Meta.box(
                  scope,
                  false,
                  "ScopeBaseDeclareFunctionDescriptor",
                  Intrinsic.get_own_property_descriptor(
                    Meta.get(scope, _result.frame.box),
                    Tree.primitive(variable.name)),
                  (descriptor_box) => Tree.conditional(
                    Meta.get(scope, descriptor_box),
                    Intrinsic.get(
                      Meta.get(scope, descriptor_box),
                      Tree.primitive("configurable"),
                      null),
                    Tree.primitive(true))) :
                Tree.primitive(false))},
            true,
            Intrinsic._target_result) :
          Tree.conditional(
            Intrinsic.get_own_property_descriptor(
              Meta.get(scope, _result.frame.box),
              Tree.primitive(variable.name)),
            (
              variable.kind === "var" ?
              Tree.primitive(void 0) :
              // console.assert(!is_loose_kind(variable.kind))
              Intrinsic.throw_syntax_error(`Rigid variable of kind ${variable.kind} named '${variable.name}' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)`)),
            Intrinsic.define_property(
              Meta.get(scope, _result.frame.box),
              Tree.primitive(variable.name),
              {
                __proto__: null,
                value: (
                  _result.frame.loose ?
                  Tree.primitive(void 0) :
                  Intrinsic.grab("aran.deadzoneMarker")),
                writable: is_writable_kind(variable.kind),
                enumerable: true,
                configurable: configurable},
              true,
              Intrinsic._target_result)))) :
      // console.assert(_result.type === "enclave")
      (
        Throw.assert(variable.exports.length === 0, `Cannot enclave export-linked variables`),
        (
          is_loose_kind(variable.kind) ?
          enclave(
            scope,
            variable.kind,
            variable.name,
            Tree.primitive(void 0)) :
          Tree.Bundle([]))))));

////////////////
// initialize //
////////////////

exports.Initialize = (scope, kind, identifier, expression, maybe, write, enclave, _result) => (
  is_loose_kind(kind) ?
  Tree.Lift(
    write(scope, identifier, expression)) :
  (
    _result = Meta._initialize(scope, kind, identifier, maybe),
    (
      _result.type === "static" ?
      Tree.Lift(
        update_export(_result.variable, _result.read, _result.initialize, expression)) :
      (
        _result.type === "dynamic" ?
        Tree.Lift(
          Tree.conditional(
            Intrinsic.has(
              Meta.get(scope, _result.frame.box),
              Tree.primitive(identifier)),
            Tree.conditional(
              Tree.binary(
                "===",
                Intrinsic.get(
                  Meta.get(scope, _result.frame.box),
                  Tree.primitive(identifier),
                  null),
                Intrinsic.grab("aran.deadzoneMarker")),
              Intrinsic.define_property(
                Meta.get(scope, _result.frame.box),
                Tree.primitive(identifier),
                {
                  __proto__: null,
                  value: expression},
                false,
                Intrinsic._success_result),
              Intrinsic.throw_syntax_error(`Variable named '${identifier}' has already been initialized (this should never happen, please consider submitting a bug repport)`)),
            Intrinsic.throw_syntax_error(`Variable named '${identifier}' has not yet been declared (this should never happen, please consider submitting a bug repport)`))) :
        // console.assert(_result.type === "enclave")
        enclave(scope, kind, identifier, expression)))));

////////////
// lookup //
////////////

const lookup_callback_prototype = {
  on_miss: function () { return this.callbacks.on_miss() },
  on_static_live_hit: function (variable, read, write) { return this.callbacks.on_static_live_hit(
    variable,
    read,
    (expression) => update_export(variable, read, write, expression)); },
  on_static_dead_hit: function (variable) { return this.callbacks.on_static_dead_hit(variable); },
  on_dynamic_frame: function (frame, expression3, _expression1, _expression2) { return (
    this.bypass ?
    expression3 :
    (
      // Switch order of evaluation to let layer-5 throw early and not create unscopable identifier
      _expression2 = this.callbacks.on_dynamic_live_hit(frame.tag, frame.box),
      _expression1 = Intrinsic.has(
        Meta.get(this.scope, frame.box),
        Tree.primitive(this.identifier)),
      _expression1 = (
        frame.unscopables ?
        Tree.conditional(
          _expression1,
          Meta.box(
            this.scope,
            false,
            "ScopeBaseUnscopables",
            Intrinsic.get(
              Meta.get(this.scope, frame.box),
              Intrinsic.grab("Symbol.unscopables"),
              null),
            (box) => Tree.conditional(
              Tree.conditional(
                Tree.binary(
                  "===",
                  Tree.unary(
                    "typeof",
                    Meta.get(this.scope, box)),
                  Tree.primitive("object")),
                Meta.get(this.scope, box),
                Tree.binary(
                  "===",
                  Tree.unary(
                    "typeof",
                    Meta.get(this.scope, box)),
                  Tree.primitive("function"))),
              Tree.unary(
                "!",
                Intrinsic.get(
                  Meta.get(this.scope, box),
                  Tree.primitive(this.identifier),
                  null)),
              Tree.primitive(true))),
          Tree.primitive(false)) :
        _expression1),
      _expression2 = (
        frame.loose ?
        _expression2 :
        Tree.conditional(
          Tree.binary(
            "===",
            Intrinsic.get(
              Meta.get(this.scope, frame.box),
              Tree.primitive(this.identifier),
              null),
            Intrinsic.grab("aran.deadzoneMarker")),
          this.callbacks.on_dynamic_dead_hit(),
          _expression2)),
      Tree.conditional(_expression1, _expression2, expression3))); }};

exports.lookup = (scope, identifier, callbacks) => (
  Throw.assert(
    (
      (callbacks.on_dynamic_dead_hit === null) ===
      (callbacks.on_dynamic_live_hit === null)),
    null,
    `Invalid lookup callback object`),
  Meta.lookup(
    scope,
    identifier,
    {
      __proto__: lookup_callback_prototype,
      bypass: callbacks.on_dynamic_dead_hit === null,
      scope,
      identifier,
      callbacks}));
