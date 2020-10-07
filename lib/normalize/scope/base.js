"use strict";

const ArrayLite = require("array-lite");
const Outer = require("./outer.js");
const Meta = require("./meta.js")
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");

const global_Error = global.Error;

// type DynamicFrame = (ObjectBox, UnscopablesBox)
// type ObjectBox = Box
// type UnscopablesBox = Maybe Box

// type OuterCallbacks = .outer.Callbacks
// type RegularContext = (Scope, Identifier, Callbacks)
// type Callbacks = (OnMiss, OnLiveHit, OnDeadHit, OnDynamicHit)
// type OnMiss = Scope -> Identifier -> Right -> AranExpression
// type OnLiveHit = Scope -> Identifier -> Right -> Tag -> Access -> AranExpression
// type OnDeadHit = Scope -> Identifier -> Right -> Tag -> AranExpression
// type OnDynamicHit = Scope -> Identifier -> Right -> Box -> AranExpression
// type Right = *

exports._declare = Outer._declare_base;

exports.initialize = Outer.initialize_base;

exports._extend_dynamic = (scope, box, nullable_box) => Outer._extend_dynamic(scope, {
  object_box: box,
  unscopables_box: nullable_box
});

exports._get_dynamic = (scope, predicate, _nullable_dynamic_frame) => (
  _nullable_dynamic_frame = Outer._get_dynamic_frame(
    scope,
    (dynamic_frame) => predicate(dynamic_frame.object_box, dynamic_frame.unscopables_box)),
  (
    _nullable_dynamic_frame === null ?
    null :
    [_nullable_dynamic_frame.object_box, _nullable_dynamic_frame.unscopables_box]));

// exports._get_dynamic_unscopables

// exports._extend_with = (scope, box1, box2) => Outer._extend_dynamic(scope, {
//   object_box: box1,
//   unscopables_box: box2
// });

// exports._is_global = (scope) => (scope) =>
// const is_eval_dynamic_frame = (dynamic_frame) => dynamic_frame.unscopables_box === null;
// exports._get_eval = (scope, _nullable_dynamic_frame) => (
//   _nullable_dynamic_frame = Outer._get_dynamic_frame(scope, is_eval_dynamic_frame),
//   (
//     _nullable_dynamic_frame === null ?
//     (
//       (
//         () => { throw new global_Error("Missing eval dynamic frame") })
//       ()) :
//     _nullable_dynamic_frame.object_box));

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
//   on_dynamic_frame: (context, dynamic_frame, expression) => expression,
//   on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context, scope, context.identifier, context.right, writable, access)
// };

const is_special_identifier = (identifier) => (
  identifier === "this" ||
  identifier === "new.target" ||
  identifier === "super");

const outer_callbacks = {
  on_miss: (context) => (
    is_special_identifier(context.identifier) ?
    (
      (
        () => { throw new global_Error("Missing special identifier") })
        ()) :
    context.callbacks.on_miss(context.scope, context.identifier, context.right)),
  on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context.scope, context.identifier, context.right, writable, access),
  on_dead_hit: (context, writable) => (
    is_special_identifier(context.identifier) ?
    (
      (
        () => { throw new global_Error("Special identifier in deadzone") })
        ()) :
    context.callbacks.on_dead_hit(context.scope, context.identifier, context.right, writable)),
  on_dynamic_frame: (context, dynamic_frame, expression) => (
    is_special_identifier(context.identifier) ?
    expression :
    (
      dynamic_frame.unscopables_box === null ?
      Tree.conditional(
        Builtin.has(
          Meta.get(context.scope, dynamic_frame.object_box),
          Tree.primitive(context.identifier)),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.object_box),
        expression) :
      Tree.conditional(
        Tree.conditional(
          Builtin.has(
            Meta.get(context.scope, dynamic_frame.object_box),
            Tree.primitive(context.identifier)),
          Tree.sequence(
            Meta.set(
              context.scope,
              dynamic_frame.unscopables_box,
              Builtin.get(
                Meta.get(context.scope, dynamic_frame.object_box),
                Builtin.grab("Symbol.unscopables"),
                null)),
            Tree.conditional(
              Tree.conditional(
                Tree.binary(
                  "===",
                  Tree.unary(
                    "typeof",
                    Meta.get(context.scope, dynamic_frame.unscopables_box)),
                  Tree.primitive("object")),
                Meta.get(context.scope, dynamic_frame.unscopables_box),
                Tree.binary(
                  "===",
                  Tree.unary(
                    "typeof",
                    Meta.get(context.scope, dynamic_frame.unscopables_box)),
                  Tree.primitive("function"))),
              Builtin.get(
                Meta.get(context.scope, dynamic_frame.unscopables_box),
                Tree.primitive(context.identifier),
                null),
              Tree.primitive(false))),
          Tree.primitive(true)),
        expression,
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.object_box))))};

exports.lookup = (scope, identifier, right, callbacks) => Outer.lookup_base(scope, identifier, {
  scope,
  identifier,
  right,
  callbacks
}, outer_callbacks);
