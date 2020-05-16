"use strict";

// We could make parameters optional but that would require recursive identifier elimination which we do not support atm.
// e.g.: Constructing `$arguments` requires performing lookups on `args`.
//       If `args` is not otherwise used, removing `$arguments` enables removing `args` as well.
//       `function () { return "foo" }``
//       `function (...args) => { $arguments = ...; return "foo" }`

// https://tc39.es/ecma262/#sec-arguments-exotic-objects

// type Context = (Scope, Identifier)
// type OptimisticWriteContext = (scope, Identifier, OptimisticRight)
// type PessimisticWriteContext = (Scope, Identifier, PessimisticRight)
// type RightHandIdentifier = Identifier
// type Writable = Boolean
// type Dynamic = (ObjectContainer, UnscopablesContainer)
// type ObjectContainer = Container
// type UnscopablesContainer = Container

const Container = require("./container.js");
const Layer = require("./layer.js");
const Build = require("../build.js");
const Object = require("../object.js");

const global_Error = global.Error;

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

exports.read_parameter = Layer.parameter;

///////////
// Block //
///////////

const hoist = (hoisting, kontinuation) => (scope) => {
  for (let index = 0; index < hoisting.const.length; index++) {
    Layer._declare_base(scope, hoisting.const[index], false);
  }
  for (let index = 0; index < hoisting.let.length; index++) {
    Layer._declare_base(scope, hoisting.let[index], true);
  }
  return kontinuation(scope);
};

exports.GLOBAL = (is_use_strict, hoisting, kontinuation) => Layer.GLOBAL(
  is_use_strict,
  hoist(hoisting, kontinuation));

exports.CLOSURE = (scope, is_use_strict, hoisting, kontinuation) => Layer.CLOSURE(
  scope,
  is_use_strict,
  hoist(hoisting, kontinuation));

exports.REGULAR = (scope, hoisting, kontinuation) => Layer.REGULAR(
  scope,
  hoist(hoisting, kontinuation));

exports.DYNAMIC = (scope, dynamic, hoisting, kontinuation) => Layer.DYNAMIC(
  scope,
  dynamic,
  hoist(hoisting, kontinuation));

exports.EVAL = (frame_array, is_use_strict, hoisting, kontinuation) => Layer.EVAL(
  frame_array,
  is_use_strict,
  hoist(hoisting, kontinuation));

////////////////
// Initialize //
////////////////

exports.initialize = Layer.initialize_base;

///////////////////////////////////////
// Delete && Typeof && Read && Write //
///////////////////////////////////////

const on_dead_hit = (context) => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + context.identifier + "' before initialization")]));

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

const make_on_dynamic_frame = (make_aran_expression) => (context, dynamic, aran_expression) => Build.conditional(
  Build.conditional(
    Object.has(
      Container.get(context.scope, dynamic.frame_container),
      Build.primitive(context.identifier)),
    Build.sequence(
      Container.set(
        context.scope,
        dynamic.unscopables_container,
        Object.get(
          Container.get(context.scope, dynamic.frame_container),
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
  make_aran_expression(context, dynamic.frame_container),
  aran_expression);

////////////
// Delete //
////////////

const delete_callbacks = {
  on_miss: (context) => Object.del(
    Layer._is_strict(context.scope),
    Build.builtin("global"),
    Build.primitive(context.identifier),
    null),
  on_live_hit: (context) => Build.primitive(true),
  on_dead_hit: (context) => Build.primitive(true),
  on_dynamic_frame: make_on_dynamic_frame(
    (context, container) => Object.del(
      Layer._is_strict(context.scope),
      Container.get(context.scope, container),
      Build.primitive(context.identifier),
      null))};

exports.delete = (scope, identifier) => Layer.lookup_base(scope, identifier, delete_callbacks, {scope, identifier});

////////////
// Typeof //
////////////

const typeof_callbacks = {
  on_dead_hit,
  on_miss: (context) => Build.unary(
    "typeof",
    Object.get(
      Build.builtin("global"),
      Build.primitive(context.identifier))),
  on_live_hit: (context, writable, access) => Build.unary(
    "typeof",
    access(null)),
  on_dynamic_frame: make_on_dynamic_frame(
    (context, container) => Build.unary(
      "typeof",
      Object.get(
        Container.get(context.scope, container),
        Build.primitive(context.identifier))))};

exports.typeof = (scope, identifier) => Layer.lookup_base(scope, identifier, typeof_callbacks, {scope, identifier});

//////////
// Read //
//////////

const regular_read_callbacks = {
  on_dead_hit,
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
  on_live_hit: (context, writable, access) => access(null),
  on_dynamic_frame: make_on_dynamic_frame(
    (context, container) => Object.get(
      Container.get(context.scope, container),
      Build.primitive(context.identifier)))};

const special_read_callbacks = {
  on_miss: (unit) => { throw new global_Error("Missing `this` or `new.target`") },
  on_dead_hit: (unit, writable) => { throw new global_Error("Deadzone hit for `this` or `new.target`") },
  on_dynamic_frame: (unit, dynamic, aran_expression) => aran_expression,
  on_live_hit: (unit, writable, access) => access(null)};

exports.read = (scope, identifier) => Layer.lookup_base(scope, identifier, regular_read_callbacks, {scope, identifier});

exports.read_this = (scope) => Layer.lookup_base(scope, "this", special_read_callbacks, null);

exports.read_new_target = (scope) => Layer.lookup_base(scope, "new.target", special_read_callbacks, null);

///////////
// Write //
///////////

const MARKER = {};

const optimistic_write_regular_callbacks = {
  on_miss: (optimistic_write_context) => (
    Layer._is_strict(optimistic_write_context.scope) ?
    ((() => { throw MARKER }) ()) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(optimistic_write_context.identifier),
      optimistic_write_context.optimistic_right,
      null)),
  on_live_hit: (optimistic_write_context, writable, access) => (
    writable ?
    access(optimistic_write_context.optimistic_right) :
    Build.sequence(
      optimistic_write_context.optimistic_right,
      Build.throw(
        Build.construct(
          Build.builtin("TypeError"),
          [
            Build.primitive("Assignment to constant variable.")])))),
  on_dead_hit: (optimistic_write_context, writable) => Build.sequence(
    optimistic_write_context.optimistic_right,
    on_dead_hit(optimistic_write_context)),
  // It is  safe to drop the aran_expression because it has no side effect (on the scope)
  on_dynamic_frame: (optimistic_write_context, aran_expression, dynamic) => { throw MARKER }};

const pessimistic_write_regular_callbacks = {
  on_miss: (pessimistic_write_context) => (
    Layer._is_strict(pessimistic_write_context.scope) ?
    Build.conditional(
      Object.has(
        Build.builtin("global"),
        Build.primitive(pessimistic_write_context.identifier)),
      Object.set(
        true,
        Build.builtin("global"),
        Build.primitive(pessimistic_write_context.identifier),
        Layer.access_meta(pessimistic_write_context.scope, pessimistic_write_context.pessimistic_right, null),
        null),
      Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive(pessimistic_write_context.identifier + " is not defined")]))) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(pessimistic_write_context.identifier),
      Layer.access_meta(pessimistic_write_context.scope, pessimistic_write_context.pessimistic_right, null),
      null)),
  on_live_hit: (pessimistic_write_context, writable, access) => (
    writable ?
    access(
      Layer.access_meta(pessimistic_write_context.scope, pessimistic_write_context.pessimistic_right, null)) :
    Build.throw(
      Build.construct(
        Build.builtin("TypeError"),
        [
          Build.primitive("Assignment to constant variable.")]))),
  on_dead_hit,
  on_dynamic_frame: make_on_dynamic_frame(
    (pessimistic_write_context, container) => Object.set(
      Layer._is_strict(pessimistic_write_context.scope),
      Container.get(pessimistic_write_context.scope, container, null),
      Build.primitive(pessimistic_write_context.identifier),
      Layer.access_meta(pessimistic_write_context.scope, pessimistic_write_context.pessimistic_right, null),
      null))};

exports.write = (scope, identifier1, aran_expression_1) => {
  try {
    return Layer.lookup_base(
      scope,
      identifier1,
      optimistic_write_regular_callbacks,
      {scope, identifier:identifier1, optimistic_right:aran_expression_1});
  } catch (error) {
    /* istanbul ignore next */
    if (error !== MARKER) {
      throw error;
    }
    const {identifier:identifier2, aran_expression:aran_expression_2} = Layer.declare_initialize_meta(scope, "right_hand_side", aran_expression_1);
    return Build.sequence(
      aran_expression_2,
      Layer.lookup_base(
        scope,
        identifier1,
        pessimistic_write_regular_callbacks,
        {scope, identifier:identifier1, pessimistic_right:identifier2}));
  }
};
