"use strict";

// type Writable = Boolean
// type Tag = Writable
// type Expression = lang.Expression
// type Identifier = normalize.scope.stratum.Identifier
// type Scope = normalize.scope.inner.Scope
// type BaseContext = normalize.scope.base.Context
// type MetaContext = normalize.scope.meta.Context
// type Depth = Number
// type Counter = Number

const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Core = require("./layer-1-core.js");
const Stratum = require("../../stratum.js");

////////////
// Intact //
////////////

exports._make_root = Core._make_root;
exports._get_depth = Core._get_depth;
exports._extend_closure = Core._extend_closure;
exports._extend_binding = Core._extend_binding;
exports._get_binding = Core._get_binding;
exports.eval = Core.eval;
exports.parameter = Core.parameter;

///////////
// Split //
///////////

exports._extend_dynamic = (scope, kinds1, kinds2, dynamic_frame) => Core._extend_dynamic(
  scope,
  ArrayLite.concat(
    ArrayLite.map(kinds1, Stratum._base),
    ArrayLite.map(kinds1, Stratum._meta)),
  dynamic_frame);

exports.EXTEND_STATIC = (scope, kinds1, kinds2, callback) => Core.EXTEND_STATIC(
  scope,
  ArrayLite.concat(
    ArrayLite.map(kinds1, Stratum._base),
    ArrayLite.map(kinds2, Stratum._meta)),
  callback);

// exports._is_writable_base = (scope, identifier) => Core._get_tag(scope, Stratum._base(identifier));
// exports._is_writable_meta = (scope, identifier) => Core._get_tag(scope, Stratum._meta(identifier));

// exports._get_collision_base = (scope) => ArrayLite.map(
//   ArrayLite.filter(
//     Core._get_foreground(scope),
//     Stratum._is_base),
//   Stratum._get_body);

const is_available_callback_prototype = {
  static: function (kind) { return this.callbacks.static(Stratum._get_body(kind)) },
  dynamic: function (frame) { return this.callbacks.dynamic(frame) } };
exports._is_available_base = (scope, kind, identifier, callbacks) => Core._is_available(
  scope,
  Stratum._base(kind),
  Stratum._base(identifier),
  {
    __proto__: is_available_callback_prototype,
    callbacks});
exports._is_available_meta = (scope, kind, identifier, callbacks) => Core._is_available(
  scope,
  Stratum._meta(kind),
  Stratum._meta(identifier),
  {
    __proto__: is_available_callback_prototype,
    callbacks});

// const get_collisions_map = (collision) => (
//   typeof collision === "string" ?
//   Stratum._get_body(collision) :
//   collision);
// exports._get_collisions_base = (scope, kind, identifier) => ArrayLite.map(
//   Core._get_collisions(
//     scope,
//     Stratum._base(identifier),
//     Stratum._base(identifier)),
//   get_collisions_map);
// exports._get_collisions_meta = (scope, kind, identifier) => ArrayLite.map(
//   Core._get_collisions(
//     scope,
//     Stratum._meta(identifier),
//     Stratum._meta(identifier)),
//   get_collisions_map);

exports._declare_base = (scope, kind, identifier) => Core._declare(
  scope,
  Stratum._base(kind),
  Stratum._base(identifier));
exports._declare_meta = (scope, kind, identifier) => Core._declare(
  scope,
  Stratum._meta(kind),
  Stratum._meta(identifier));

//   const success = Core._declare(scope, Stratum._base(identifier), writable);
//   if (success === true) {
//     return null;
//   }
//   if (success === false) {
//     throw new global_Error("Duplicate base variable declaration");
//   }
//   return success;
// };
//  exports._declare_meta = (scope, identifier, writable, callback) => {
//   if (identifier === "new.target") {
//     identifier = "new_target";
//   }
//   identifier += "_" + global_String(Core._get_depth(scope)) + "_";
//   let counter = 0;
//   while (true) {
//     counter++;
//     const collisions = Core._get_collisions();
//   }
//
//   let success = false;
//   while (!success) {
//     counter++;
//     success = Core._declare(scope, Stratum._meta(identifier + global_String(counter)), writable);
//     if (typeof success !== "boolean") {
//       throw new global_Error("Cannot declare meta variable on dynamic frame");
//     }
//   }
//   return identifier + global_String(counter);
// };

exports._initialize_base = (scope, kind, identifier, expression, maybe) => Core._initialize(
  scope,
  Stratum._base(kind),
  Stratum._base(identifier),
  expression,
  maybe);
exports._initialize_meta = (scope, kind, identifier, expression, maybe) => Core._initialize(
  scope,
  Stratum._meta(kind),
  Stratum._meta(identifier),
  expression,
  maybe);

const lookup_callback_prototype = {
  on_miss: function () { return this.callbacks.on_miss() },
  on_live_hit: function (kind, access) { return this.callbacks.on_live_hit(
    Stratum._get_body(kind),
    access) },
  on_dead_hit: function (kind) { return this.callbacks.on_dead_hit(
    Stratum._get_body(kind)) },
  on_dynamic_frame: function (frame, expression) { return this.callbacks.on_dynamic_frame(frame, expression) }};
exports.lookup_base = (scope, identifier, callbacks) => Core.lookup(
  scope,
  Stratum._base(identifier),
  {
    __proto__: lookup_callback_prototype,
    callbacks});
exports.lookup_meta = (scope, identifier, callbacks) => Core.lookup(
  scope,
  Stratum._meta(identifier),
  {
    __proto__: lookup_callback_prototype,
    callbacks});
