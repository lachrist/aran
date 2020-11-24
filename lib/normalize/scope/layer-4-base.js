"use strict";

const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");
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

const abort = (message) => { throw new global_Error(message) };

/////////////
// Forward //
/////////////

exports._make_root = Meta._make_root;
exports.EXTEND_STATIC = Meta.EXTEND_STATIC;
exports._extend_closure = Meta._extend_closure;
exports._extend_binding = Meta._extend_binding;
exports._get_binding = Meta._get_binding;
exports.eval = Meta.eval;
exports.parameter = Meta.parameter;

exports.Box = Meta.Box;
exports.ImportBox = Meta.ImportBox;
exports.box = Meta.box;
exports.get = Meta.get;
exports.set = Meta.set;
exports._primitive_box = Meta._primitive_box;
exports._builtin_box = Meta._builtin_box;

/////////
// Tag //
/////////

const GLOBAL_DECLARATIVE_TAG = "global-declarative";
const GLOBAL_OBJECT_TAG = "global-object";
const WITH_TAG = "with";
const CLOSURE_TAG = "closure";

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

const is_constant_kind = (kind) => (
  kind === "const" ||
  kind === "class" ||
  kind === "import");

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
  static: function (kind) { return this.loose && is_loose_kind(kind) },
  dynamic: function (frame, nullable_kind) { return !(
    this.loose ?
    this.callbacks.has_rigid_variable(frame.tag) :
    (
      this.callbacks.has_loose_variable(frame.tag) ||
      this.callbacks.has_rigid_variable(frame.tag))) }};

exports._is_available = (scope, kind, identifier, callbacks) => Meta._is_available(
  scope,
  kind,
  identifier,
  {
    __proto__: is_available_callback_prototype,
    loose: is_loose_kind(kind),
    callbacks});

/////////////////////
// _extend_dynamic //
/////////////////////

exports._extend_dynamic = (scope, kinds, tag, unscopables, box) => (
  (
    ArrayLite.some(kinds, is_loose_kind) &&
    ArrayLite.some(kinds, is_rigid_kind)) ?
  abort("Cannot mix rigid variables and loose variables inside dynamic frame") :
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

exports.Declare = (scope, kind, identifier, _result) => (
  _result = Meta._declare(scope, kind, identifier),
  (
    _result.static ?
    (
      _result.value === null ?
      (
        is_loose_kind(kind) ?
        Tree.Lift(
          Meta._initialize(
            scope,
            kind,
            identifier,
            Tree.primitive(void 0),
            false).value) :
        Tree.Bundle([])) :
      (
        (
          is_loose_kind(kind) &&
          is_loose_kind(_result.value)) ?
        Tree.Bundle([]) :
        abort("Duplicate variable declaration"))) :
    // console.assert(_result.value.loose === is_loose_kind(kind))
    Tree.Lift(
      Tree.conditional(
        Builtin.has(
          Meta.get(scope, _result.value.box),
          Tree.primitive(identifier)),
        (
          _result.value.loose ?
          Tree.primitive(void 0) :
          Builtin.throw_syntax_error(`Variable '${identifier}' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)`)),
        Builtin.define_property(
          Meta.get(scope, _result.value.box),
          Tree.primitive(identifier),
          {
            __proto__: null,
            value: (
              _result.value.loose ?
              Tree.primitive(void 0) :
              Builtin.grab("aran.deadzoneMarker")),
            writable: is_writable_kind(kind),
            enumerable: true,
            configurable: false},
          false,
          Builtin._success_result)))));

////////////////
// initialize //
////////////////

exports.initialize = (scope, kind, identifier, expression, maybe, write, _result) => (
  kind === "import" ?
  abort("Must used import initialization for import variable") :
  (
    is_loose_kind(kind) ?
    write(scope, identifier, expression) :
    (
      _result = Meta._initialize(scope, kind, identifier, expression, maybe),
      (
        _result.static ?
        _result.value :
        Tree.conditional(
          Builtin.has(
            Meta.get(scope, _result.value.box),
            Tree.primitive(identifier)),
          Tree.conditional(
            Tree.binary(
              "===",
              Builtin.get(
                Meta.get(scope, _result.value.box),
                Tree.primitive(identifier),
                null),
              Builtin.grab("aran.deadzoneMarker")),
            Builtin.define_property(
              Meta.get(scope, _result.value.box),
              Tree.primitive(identifier),
              {
                __proto__: null,
                value: expression},
              false,
              Builtin._success_result),
            Builtin.throw_syntax_error(`Variable '${identifier}' has already been initialized (this should never happen, please consider submitting a bug repport)`)),
          Builtin.throw_syntax_error(`Variable '${identifier}' has not yet been declared (this should never happen, please consider submitting a bug repport)`))))));

exports.ImportInitialize = (scope, identifier, source, maybe) => Meta.ImportInitialize(
  scope,
  "import",
  identifier,
  source,
  maybe);

////////////
// lookup //
////////////

const lookup_callback_prototype_special = {
  on_miss: () => abort("Missing special identifier"),
  on_live_hit: function (kind, access) { return this.callbacks.on_live_hit(
    is_writable_kind(kind),
    access) },
  on_dead_hit: () => abort("Special identifier in deadzone"),
  on_dynamic_frame: (frame, expression) => expression};

const lookup_callback_prototype_regular = {
  on_miss: function () { return this.callbacks.on_miss() },
  on_live_hit: function (kind, access) { return this.callbacks.on_live_hit(
    is_writable_kind(kind),
    access) },
  on_dead_hit: function (kind) { return this.callbacks.on_dead_hit() },
  on_dynamic_frame: function (frame, expression3, _expression1, _expression2) { return (
    _expression1 = Builtin.has(
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
          Builtin.get(
            Meta.get(this.scope, frame.box),
            Builtin.grab("Symbol.unscopables"),
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
              Builtin.get(
                Meta.get(this.scope, box),
                Tree.primitive(this.identifier),
                null)),
            Tree.primitive(true))),
        Tree.primitive(false)) :
      _expression1),
    _expression2 = this.callbacks.on_dynamic_hit(frame.tag, frame.box),
    _expression2 = (
      frame.loose ?
      _expression2 :
      Tree.conditional(
        Tree.binary(
          "===",
          Builtin.get(
            Meta.get(this.scope, frame.box),
            Tree.primitive(this.identifier),
            null),
          Builtin.grab("aran.deadzoneMarker")),
        this.callbacks.on_dead_hit(),
        _expression2)),
    Tree.conditional(_expression1, _expression2, expression3)) }};

exports.lookup = (scope, identifier, callbacks) => Meta.lookup(
  scope,
  identifier,
  {
    __proto__: (
      (
        identifier === "this" ||
        identifier === "new.target" ||
        identifier === "import.meta") ?
      lookup_callback_prototype_special :
      lookup_callback_prototype_regular),
    scope,
    identifier,
    callbacks});
