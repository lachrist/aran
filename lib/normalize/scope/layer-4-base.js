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

const abort = (message) => { throw new global_Error(message) };

exports._extend_closure = Meta._extend_closure;
exports._extend_binding = Meta._extend_binding;
exports._get_binding = Meta._get_binding;
exports.eval = Meta.eval;
exports.parameter = Meta.parameter;
exports._is_available = Meta._is_available;

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

// const special_outer_callbacks = {
//   on_miss: (context) => {
//     throw new global_Error("Missing special identifier");
//   },
//   on_dead_hit: (context, writable) => {
//     throw new global_Error("Special identifier in deadzone");
//   },
//   on_frame: (context, frame, expression) => expression,
//   on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context, scope, context.identifier, context.right, writable, access)
// };

const is_special_identifier = (identifier) => (
  identifier === "this" ||
  identifier === "new.target");

const is_available_callback_prototype = {
  static: function (kind) { return  this.callbacks.static(kind) },
  dynamic: function (frame) { return this.callbacks.dynamic(frame.tag) }};
exports._is_available = (scope, kind, identifier, callbacks) => Meta._is_available(
  scope,
  kind,
  identifier,
  {
    __proto__: is_available_callback_prototype,
    callbacks});

exports._extend_dynamic = (scope, kinds, tag, deadzone, unscopables, box) => Meta._extend_dynamic(
  scope,
  kinds,
  {
    tag,
    unscopables,
    deadzone,
    box});

exports.DeclareInitialize = (scope, kind, identifier, maybe, _result) => (
  _result = Meta._declare(scope, kind, identifier),
  (
    _result.static ?
    (
      _result.value ?
      Tree.Lift(
        Meta._initialize(
          scope,
          kind,
          identifier,
          maybe,
          Tree.primitive(void 0)).value) :
      Tree.Bundle([])) :
    Tree.Lift(
      Tree.conditional(
        Builtin.has(
          Meta.get(scope, _result.value),
          Tree.primitive(identifier)),
        Tree.primitive(void 0),
        Builtin.define_property(
          Meta.get(scope, _result.value),
          Tree.primitive(identifier),
          {
            __proto__: null,
            value: Tree.primitive(void 0),
            writable: true,
            enumerable: true,
            configurable: false},
          false,
          Builtin._success_result)))));

exports.Declare = (scope, kind, identifier, _result) => (
  _result = Meta._declare(scope, kind, identifier),
  (
    _result.static ?
    (
      _result.value ?
      Tree.Bundle([]) :
      abort("Duplicate variable declaration")) :
    (
      _result.value.deadzone ?
      Tree.Lift(
        Tree.conditional(
          Builtin.has(
            Meta.get(scope, _result.value),
            Tree.primitive(identifier)),
          Builtin.throw_reference_error(`Variable '${identifier}' has already been declared (this should have been detected as a early syntax error, please consider submitting a bug repport)`),
          Builtin.define_property(
            Meta.get(scope, _result.value),
            Tree.primitive(identifier),
            {
              __proto__: null,
              value: Builtin.grab("@deadzone"),
              writable: true,
              enumerable: true,
              configurable: false},
            false,
            Builtin._success_result))) :
      abort("Dynamic frame does not support deadzone and cannot declare a variable without initialization"))));

exports.initialize = (scope, kind, identifier, expression, maybe, _result) => (
  _result = Meta._initialize(scope, kind, identifier, expression, maybe),
  (
    _result.static ?
    Tree.Lift(_result.value) :
    (
      _result.value.deadzone ?
      Tree.Lift(
        Tree.conditional(
          Builtin.has(
            Meta.get(scope, _result.value.box),
            Tree.primitive(identifier)),
          Tree.conditional(
            Builtin.binary(
              "===",
              Builtin.get(
                Meta.get(scope, _result.value.box),
                Tree.primitive(identifier),
                null),
              Builtin.grab("@deadzone")),
            Builtin.define_property(
              Meta.get(scope, _result.value),
              Tree.primitive(identifier),
              {
                __proto__: null,
                value: expression,
                writable: true,
                enumerable: true,
                configurable: false},
              false,
              Builtin._success_result),
            Builtin.throw_reference_error(`Variable '${identifier}' has already been initialized (this should have been detected as a early syntax error, please consider submitting a bug repport)`)),
          Builtin.throw_reference_error(`Variable '${identifier}' has not yet been declared (this should have been detected as a early syntax error, please consider submitting a bug repport)`))) :
      abort("Dynamic frame does not support deadzone and cannot initialize a variable without declaration"))));

const lookup_callback_prototype = {
  on_miss: function () { return (
    is_special_identifier(this.identifier) ?
    abort("Missing special identifier") :
    this.callbacks.on_miss()) },
  on_live_hit: function (kind, access) { return this.on_live_hit(kind, access) },
  on_dead_hit: function (kind) { return (
    is_special_identifier(context.identifier) ?
    abort("Special identifier in deadzone") :
    this.callbacks.on_dead_hit(kind)) },
  on_dynamic_frame: function (frame, expression3, _expression1, _expression2) { return (
    _expression1 = Builtin.has(
      Meta.get(this.scope, frame.box),
      Tree.primitive(this.identifier)),
    _expression1 = (
      frame.unscopables ?
      Tree.conditional(
        expression1,
        Meta.box(
          this.scope,
          "ScopeBaseUnscopables",
          false,
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
      frame.deadzone ?
      Tree.conditional(
        Tree.binary(
          "===",
          Builtin.get(
            Meta.get(this.scope, frame.box),
            Tree.primitive(this.identifier),
            null),
          Builtin.grab("@deadzone")),
        this.callbacks.on_dead_hit(null),
        _expression2) :
      _expression2),
    Tree.conditional(_expression1, _expression2, expression3)) } };

exports.lookup = (scope, identifier, right, callbacks) => Meta.lookup_base(
  scope,
  identifier,
  {
    __proto__: lookup_callback_prototype,
    scope,
    identifier,
    right,
    callbacks});
