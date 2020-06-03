"use strict";

const ArrayLite = require("array-lite");
const Outer = require("./outer.js");
const Meta = require("./meta.js")
const Lang = require("../lang.js");
const Object = require("../object.js");

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

exports._extend_dynamic = (scope, object_box, unscopables_box) => Outer._extend_dynamic(scope, {
  object_box,
  unscopables_box
});

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

const outer_callbacks = {
  on_miss: (context) => (
    (context.identifier === "this" || context.identifier === "new.target") ?
    ((() => { throw new global_Error("Missing special identifier") }) ()) :
    context.callbacks.on_miss(context.scope, context.identifier, context.right)),
  on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context.scope, context.identifier, context.right, writable, access),
  on_dead_hit: (context, writable) => (
    (context.identifier === "this" || context.identifier === "new.target") ?
    ((() => { throw new global_Error("Special identifier in deadzone") }) ()) :
    context.callbacks.on_dead_hit(context.scope, context.identifier, context.right, writable)),
  on_dynamic_frame: (context, dynamic_frame, expression) => (
    (context.identifier === "this" || context.identifier === "new.target") ?
    expression :
    (
      dynamic_frame.unscopables_box === null ?
      Lang.conditional(
        Object.has(
          Meta.get(context.scope, dynamic_frame.object_box),
          Lang.primitive(context.identifier)),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.object_box),
        expression) :
      Lang.conditional(
        Lang.conditional(
          Object.has(
            Meta.get(context.scope, dynamic_frame.object_box),
            Lang.primitive(context.identifier)),
          Lang.sequence(
            Meta.set(
              context.scope,
              dynamic_frame.unscopables_box,
              Object.get(
                Meta.get(context.scope, dynamic_frame.object_box),
                Lang.builtin("Symbol.unscopables"))),
            Lang.conditional(
              Lang.conditional(
                Lang.binary(
                  "===",
                  Lang.unary(
                    "typeof",
                    Meta.get(context.scope, dynamic_frame.unscopables_box)),
                  Lang.primitive("object")),
                Meta.get(context.scope, dynamic_frame.unscopables_box),
                Lang.binary(
                  "===",
                  Lang.unary(
                    "typeof",
                    Meta.get(context.scope, dynamic_frame.unscopables_box)),
                  Lang.primitive("function"))),
              Lang.unary(
                "!",
                Object.get(
                  Meta.get(context.scope, dynamic_frame.unscopables_box),
                  Lang.primitive(context.identifier))),
              Lang.primitive(true))),
          Lang.primitive(false)),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.object_box),
        expression)))};

exports.lookup = (scope, identifier, right, callbacks) => Outer.lookup_base(scope, identifier, {
  scope,
  identifier,
  right,
  callbacks
}, outer_callbacks);
