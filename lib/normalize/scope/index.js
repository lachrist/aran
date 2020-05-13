"use strict";

// We could make parameters optional but that would require recursive identifier elimination which we do not support atm.
// e.g.: Constructing `$arguments` requires performing lookups on `args`.
//       If `args` is not otherwise used, removing `$arguments` enables removing `args` as well.
//       `function () { return "foo" }``
//       `function (...args) => { $arguments = ...; return "foo" }`

// https://tc39.es/ecma262/#sec-arguments-exotic-objects

// type Context = (Scope, Identifier)
// type OptimisticWriteContext = (scope, Identifier, AranExpression)
// type PessimisticWriteContext = (Scope, Identifier, RightHandIdentfier)
// type RightHandIdentifier = Identifier
// type Writable = Boolean
// type Dynamic = (ObjectContainer, UnscopablesContainer)
// type ObjectContainer = Container
// type UnscopablesContainer = Container

const meta = require("./container.js");
const Layer = require("./layer.js");

const global_Object_assign = global.Object.assign;

const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;
const global_Reflect_setPrototypeOf = global.Reflect.setPrototypeOf;
const global_Object_hasOwnProperty = global.Object.hasOwnProperty;
const global_Object_assign = global.Object.assign;
const global_JSON_stringify = global.JSON.stringify;
const global_JSON_parse = global.JSON.parse;
const global_Array_from = global.Array.from;
const global_Error = global.Error;
const global_Symbol = global.Symbol;

///////////////
// Container //
///////////////

exports.get = Container.get;

exports.set = Container.set;

exports.container = Container.container;

exports.Container = Container.Container;

///////////////
// Parameter //
///////////////

exports.parameter = Layer.parameter;

///////////
// Block //
///////////

const hoisting = (extended_identifier_array_1, extended_identifier_array_2, kontinuation) => (scope) => {
  for (let index = 0; index < extended_identifier_array_1.length; index++) {
    Layer.declare_base(scope, extended_identifier_array_1[index], false);
  }
  for (let index = 0; index < extended_identifier_array_2.length; index++) {
    Layer.declare_base(scope, extended_identifier_array_2[index], true);
  }
  return kontinuation(scope);
};

exports.GLOBAL = (is_use_strict, extended_identifier_array_1, extended_identifier_array_2, kontinuation) => {
  return Layer.GLOBAL(is_use_strict, hoisting(extended_identifier_array_1, extended_identifier_array_2, kontinuation));
};

exports.DYNAMIC = (scope, dynamic, extended_identifier_array_1, extended_identifier_array_2, kontinuation) => {
  return Layer.DYNAMIC(scope, dynamic, hoisting(extended_identifier_array_1, extended_identifier_array_2, kontinuation));
};

exports.REGULAR = (scope, extended_identifier_array_1, extended_identifier_array_2, kontinuation) => {
  return Layer.REGULAR(scope, hoisting(extended_identifier_array_1, extended_identifier_array_2, kontinuation));
};

exports.EVAL = (frame_array, is_use_strict, extended_identifier_array_1, extended_identifier_array_2, kontinuation) => {
  return Layer.EVAL(frame_array, is_use_strict, hoisting(extended_identifier_array_1, extended_identifier_array_2, kontinuation));
};

exports.CLOSURE = (scope, is_use_strict, extended_identifier_array_1, extended_identifier_array_2, kontinuation) => {
  return Layer.CLOSURE(scope, is_use_strict, hoisting(extended_identifier_array_1, extended_identifier_array_2, kontinuation));
};

////////////////
// Initialize //
////////////////

exports.initialize = Layer.initialize_base;

///////////////////////////////////////
// Delete && Typeof && Read && Write //
///////////////////////////////////////

// Order of operations:
//
// const p = new Proxy(Array.prototype, {
//   proto__: null,
//   has: (tgt, key) => (console.log("has", key), Reflect.has(tgt, key)),
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
//   set: (tgt, key, val, rec) => (console.log("set", key), Reflect.set(tgt, key, val, rec)),
//   ownKeys: (tgt) => (console.log("keys"), Reflect.ownKeys(tgt)),
//   getOwnPropertyDescriptor: (tgt, key) =>
//     (console.log("getOwnPropertyDescriptor", key), Reflect.getOwnPropertyDescriptor(tgt, key)),
//   getPrototypeOf: (tgt) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(tgt))
// });
// with (p) { flat }
// has flat
// get Symbol(Symbol.unscopables)
// Thrown:
// ReferenceError: flat is not defined

const make_on_dynamic = (make_aran_expression) => (context, dynamic, aran_expression) => Build.conditional(
  Build.conditional(
    Object.has(
      Container.get(context.scope, dynamic.object_container),
      Build.primitive(context.identifier)),
    Build.sequence(
      Container.set(
        context.scope,
        dynamic.unscopables_container,
        Object.get(
          Container.get(context.scope, dynamic.object_container),
          Build.builtin("Symbol.unscopables"))),
      Build.conditional(
        Build.conditional(
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Container.get(context.scope, dynamic.unscopables_container)),
            Build.primitive("object")),
          Container.get(context.scope, dynamic.unscopables_container),
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Container.get(context.scope, dynamic.unscopables_container)),
            Build.primitive("function"))),
        Build.unary(
          "!",
          Object.get(
            Container.get(context.scope, dynamic.unscopables_container),
            Build.primitive(context.identifier))),
        Build.primitive(true))),
    Build.primitive(false)),
  aran_expression,
  make_aran_expression(context, dynamic.object_container));

////////////
// Delete //
////////////

const delete_callbacks = {
  on_miss: (context) => Object.del(
    Layer.is_strict(scope),
    Build.builtin("global"),
    Build.primitive(context.identifier)),
  on_live_hit: (context) => Build.primitive(true),
  on_dead_hit: (context) => Build.primitive(true),
  on_dynamic: make_on_dynamic(
    (context, container) => Object.del(
      Layer.is_strict(scope),
      Container.get(context.scope, meta_identifier),
      Build.primitive(context.identifier)))};

exports.delete = (scope, extended_identifier) => (
  (extended_identifier === "this" || extended_identifier === "new.target") ?
  Build.primitive(true) :
  Layer.lookup_base(scope, identifier, delete_callbacks, {scope, identifier:extended_identifier}));

/////////////////////////////
// Read && Typeof && Write //
/////////////////////////////

const on_deadzone = (context) => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + context.identifier + "' before initialization")]));

////////////////////
// Read && Typeof //
////////////////////

const special_read_callbacks = {
  on_miss: (unit) => { throw new global_Error("Missing this or new.target") },
  on_deadzone: (unit, writable) => { throw new global_Error("Dynamic deadzone for this or new.target") },
  on_dynamic: (unit, aran_expression, dynamic) => aran_expression,
  on_initialized: (unit, writable, access) => Build.unary(
    "typeof",
    access(null))};

////////////
// Typeof //
////////////

const typeof_callbacks = {
  on_deadzone,
  on_miss: (context) => Build.unary(
    "typeof",
    Object.get(
      Build.builtin("global"),
      Build.primitive(context.identifier))),
  on_hit: (context, writable, access) => Build.unary(
    "typeof",
    access(null)),
  on_dynamic: make_on_dynamic(
    (context, container) => Build.unary(
      "typeof",
      Object.get(
        Container.get(context.scope, container),
        Build.primitive(context.identifier))))};

exports.typeof = (scope, extended_identifier) => (
  (extended_identifier === "this" || extended_identifier === "new.target") ?
  Build.unary(
    "typeof",
    Layer.lookup_base(scope, extended_identifier, special_read_callbacks, null)) :
  Layer.lookup_base(scope, extended_identifier, typeof_callbacks, {scope, identifier:extended_identifier}));

//////////
// Read //
//////////

const regular_read_callbacks = {
  on_deadzone,
  on_miss: (context) => Build.conditional(
    Object.has(
      Build.builtin("global"),
      Build.primitive(context.identifier)),
    Object.get(
      Build.builtin("global"),
      Build.primitive(context.identifier)),
    Build.throw(
      Build.construct(
        Build.builtin("ReferenceError"),
        [
          Build.primitive(context.identifier + " is not defined")]))),
  on_initialized: (context, writable, access) => access(null),
  on_dynamic: make_on_dynamic(
    (context, container) => Object.get(
      Container.get(context.scope, container),
      Build.primitive(context.identifier)))};

exports.read = (scope, extended_identifier) => (
  (extended_identifier === "this" || extended_identifier === "new.target") ?
  Layer.lookup_base(scope, extended_identifier, special_read_callbacks, null) :
  Layer.lookup_base(scope, extended_identifier, regular_read_callbacls, {scope, identifier:extended_identifier}));

///////////
// Write //
///////////

const MARKER = {};

const optimistic_write_regular_callbacks = {
  on_miss: (optimistic_write_context) => { throw MARKER },
  on_initialized: (optimistic_write_context, writable, access) => (
    writable ?
    access(optimistic_write_context.right) :
    Build.sequence(
      optimistic_write_context.right,
      Build.throw(
        Build.construct(
          Build.builtin("TypeError"),
          [
            Build.primitive("Assignment to constant variable.")])))),
  on_deadzone: (optimistic_write_context, writable) => Build.sequence(
    optimistic_write_context.right,
    on_deadzone(optimistic_write_context)),
  // It is  safe to drop the aran_expression because it has no side effect (on the scope)
  on_dynamic: (optimistic_write_context, aran_expression, dynamic) => { throw MARKER }};

const pessimistic_write_regular_callbacks = {
  on_miss: (pessimistic_write_context) => (
    Layer.is_strict(pessimistic_write_context.scope) ?
    Build.conditional(
      Object.has(
        Build.builtin("global"),
        Build.primitive(pessimistic_write_context.identifier)),
      Object.set(
        true,
        Build.builtin("global"),
        Build.primitive(pessimistic_write_context.identifier),
        Split.access_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null)),
      Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive(pessimistic_write_context.identifier + " is not defined")]))) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(pessimistic_write_context.identifier),
      Split.access_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null))),
  on_initialized: (pessimistic_write_context, writable, access) => (
    writable ?
    access(
      Layer.access_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null)) :
    Build.throw(
      Build.construct(
        Build.builtin("TypeError"),
        [
          Build.primitive("Assignment to constant variable.")]))),
  on_deadzone,
  on_dynamic: make_on_dynamic(
    (pessimistic_write_context, container) => Object.set(
      Layer.is_strict(pessimistic_write_context.scope),
      Container.get(pessimistic_write_context.scope, container, null),
      Build.primitive(pessimistic_write_context.identifier),
      Scope.access_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null)))};

exports.write = (scope, identifier, aran_expression) => {
  try {
    return Layer.lookup_base(scope, identifier, optimistic_write_regular_callbacks, {scope, identifier, aran_expression});
  } catch (error) {
    if (error !== MARKER) {
      throw error;
    }
    const {aran_expression:aran_expression_, identifier:right_hand_identifier} = Layer.declare_initialize_(scope, "right_hand_side", aran_expression_1);
    return Build.sequence(
      Layer.initialize_meta(scope, identifier, aran_expression),
      Layer.lookup_base(scope, identifier, pessimistic_write_regular_callbacks, {scope, identifier, right_hand_identifier}));
  }
};
