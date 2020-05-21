
"use strict";

// Invariant hypothesis: `Core._declare`, `Core.initialize`, and `Core.lookup` are only access in `Meta` and `Base`. 

const ArrayLite = require("array-lite");
const Core = require("./core.js");
const Meta = require("./meta.js")
const Build = require("../build.js");
const Object = require("../object.js");

const global_Error = global.Error;

// type DynamicFrame = (ObjectBox, UnscopablesBox)
// type ObjectBox = Box
// type UnscopablesBox = Maybe Box

// type SpecialContext = ()
// type RegularContext = (Scope, Identifier, Callbacks)
// type Callbacks = (OnMiss, OnLiveHit, OnDeadHit, OnDynamicHit)
// type OnMiss = Scope -> Identifier -> Right -> AranExpression
// type OnLiveHit = Scope -> Identifier -> Right -> Tag -> Access -> AranExpression
// type OnDeadHit = Scope -> Identifier -> Right -> Tag -> AranExpression
// type OnDynamicHit = Scope -> Identifier -> Right -> Box -> AranExpression
// type Right = *

const base = (extended_identifier) => extended_identifier === "new.target" ? "$0newtarget" : "$" + extended_identifier;

const BASE_THIS = base("this");

const BASE_NEW_TARGET = base("new.target");

exports._declare = (scope, extended_identifier, tag) => Core._declare(scope, base(extended_identifier), tag);

exports.initialize = (scope, extended_identifier, aran_expression) => Core.initialize(scope, base(extended_identifier), aran_expression);

exports._extend_dynamic = (scope, object_box, unscopables_box) => Core._extend_dynamic(scope, {
  object_box,
  unscopables_box
});

/////////////
// Regular //
/////////////

// // Order of operations:
// //
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

const regular_core_callbacks = {
  on_miss: (regular_context) => regular_context.callbacks.on_miss(regular_context.scope, regular_context.identifier, regular_context.right),
  on_live_hit: (regular_context, tag, access) => regular_context.callbacks.on_live_hit(regular_context.scope, regular_context.identifier, regular_context.right, tag, access),
  on_dead_hit: (regular_context, tag) => regular_context.callbacks.on_dead_hit(regular_context.scope, regular_context.identifier, regular_context.right, tag),
  on_dynamic_frame: (regular_context, dynamic_frame, aran_expression) => (
    dynamic_frame.unscopables_box === null ?
    Build.conditional(
      Object.has(
        Meta.get(regular_context.scope, dynamic_frame.object_box),
        Build.primitive(regular_context.identifier)),
      regular_context.callbacks.on_dynamic_hit(regular_context.scope, regular_context.identifier, regular_context.right, dynamic_frame.object_box),
      aran_expression) :
    Build.conditional(
      Build.conditional(
        Object.has(
          Meta.get(regular_context.scope, dynamic_frame.object_box),
          Build.primitive(regular_context.identifier)),
        Build.sequence(
          Meta.set(
            regular_context.scope,
            dynamic_frame.unscopables_box,
            Object.get(
              Meta.get(regular_context.scope, dynamic_frame.object_box),
              Build.builtin("Symbol.unscopables"))),
          Build.conditional(
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Meta.get(regular_context.scope, dynamic_frame.unscopables_box)),
                Build.primitive("object")),
              Meta.get(regular_context.scope, dynamic_frame.unscopables_box),
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Meta.get(regular_context.scope, dynamic_frame.unscopables_box)),
                Build.primitive("function"))),
            Build.unary(
              "!",
              Object.get(
                Meta.get(regular_context.scope, dynamic_frame.unscopables_box),
                Build.primitive(regular_context.identifier))),
            Build.primitive(true))),
        Build.primitive(false)),
      regular_context.callbacks.on_dynamic_hit(regular_context.scope, regular_context.identifier, regular_context.right, dynamic_frame.object_box),
      aran_expression))};

exports.lookup = (scope, identifier, right, callbacks) => Core.lookup(scope, base(identifier), {
  scope,
  identifier,
  right,
  callbacks
}, regular_core_callbacks);

//////////////////
// Special Read //
//////////////////

const special_core_callbacks = {
  on_miss: (special_context) => { throw new global_Error("Missing special identifier") },
  on_live_hit: (special_context, tag, access) => access(null),
  on_dead_hit: (special_context, tag) => { throw new global_Error("Special identifier in deadzone") },
  on_dynamic_frame: (special_context, dynamic_frame, aran_expression) => aran_expression
};

exports.read_this = (scope) => Core.lookup(scope, BASE_THIS, null, special_core_callbacks);

exports.read_new_target = (scope) => Core.lookup(scope, BASE_NEW_TARGET, null, special_core_callbacks);
