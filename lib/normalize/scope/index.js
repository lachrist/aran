"use strict";

// We could make parameters optional but that would require recursive identifier elimination which we do not support atm.
// e.g.: Constructing `$arguments` requires performing lookups on `args`.
//       If `args` is not otherwise used, removing `$arguments` enables removing `args` as well.
//       `function () { return "foo" }``
//       `function (...args) => { $arguments = ...; return "foo" }`

// https://tc39.es/ecma262/#sec-arguments-exotic-objects

// type Hoisting = Map ExtendedIdentifier Writable
// type Writable = Boolean
// type TypeofRight = ()
// type DeleteRight = ()
// type ReadRight = ()
// type OptimisticWriteRight = AranExpression
// type PessimisticWriteRight = Box

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");
const Outer = require("./outer.js");
const Meta = require("./meta.js");
const Base = require("./base.js");

/////////
// Box //
/////////

exports.get = Meta.get;

exports.set = Meta.set;

exports.box = Meta.box;

exports.Box = Meta.Box;

//////////
// Make //
//////////

exports._make_global = (_scope) => (
  _scope = Outer._make_root(),
  _scope = Outer._extend_dynamic_closure(_scope, Meta._builtin_box("#globalObjectRecord")),
  _scope = Outer._extend_dynamic_program(_scope, Meta._builtin_box("#globalDeclarativeRecord")),
  _scope = Outer._extend_binding(_scope, "strict-mode", false),
  _scope = Outer._extend_binding(_scope, "function-expression-ancestor", false),
  _scope = Outer._extend_binding(_scope, "closure-context", "program"),
  _scope = Outer._extend_binding(_scope, "completion-box", null),
  _scope = Outer._extend_binding(_scope, "super-box", null),
  _scope = Outer._extend_binding(_scope, "self-box", null),
  _scope);

exports._make_local = Outer._make_eval;

/////////////
// Binding //
/////////////

exports._extend_use_strict = (scope) => Outer._extend_binding(scope, "strict", true);

exports._is_strict = (scope) => Outer.get_binding(scope, "strict");

ArrayLite.forEach(
  [
    "last",
    "tag",
    "super",
    "self"],
  (key) => (
    exports["_extend_binding_" +key] = (scope, value) => Outer._extend_binding(scope, key, value),
    exports["_get_binding_" + key] = (scope) => Outer._get_binding(scope, key)));

////////////
// Extend //
////////////

exports._extend_boundary_closure = Outer._extend_closure;

exports._extend_dynamic_closure = Base._extend_dynamic_closure;

exports._extend_dynamic_with = Base._extend_dynamic_with;

exports._extend_dynamic_block = Base._extend_dynamic_block;

exports.EXTEND_STATIC = (scope, hoisting, kontinuation) => Outer.EXTEND_STATIC(scope, (scope) => {
  for (let identifier in hoisting) {
    Base._declare(scope, identifier, hoisting[identifier]);
  }
  return kontinuation(scope);
});

///////////
// Other //
///////////

exports.eval = Outer.eval;

exports.parameter = Outer.parameter;

exports._get_static_closure_block_variable_array_base = Outer._get_static_closure_block_variable_array_base;

///////////////////////////
// Initialize && Declare //
///////////////////////////

exports.initialize = Base.initialize;

exports.Declare = Base.Declare;

exports.DeclareInitialize = Base.DeclareInitialize;

////////////
// Delete //
////////////

const delete_callbacks = {
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, delete_right) => Tree.primitive(true),
  on_live_hit: (scope, identifier, delete_right, writable, access) => Tree.primitive(true),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dead_hit: (scope, identifier, delete_right) => Tree.primitive(true),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, delete_right, box, check) => Builtin.delete_property(
    Meta.get(scope, box),
    Tree.primitive(identifier),
    Outer._is_strict(scope),
    Builtin._success_result)};

exports.delete = (scope, identifier) => Base.lookup(scope, identifier, null, delete_callbacks);

/////////////////////////////
// Typeof && Read && Write //
/////////////////////////////

// console.assert(identifier !== "this" && identifier !== "new.target");
const on_dead_hit = (scope, identifier) => Builtin.throw_reference_error("Cannot access '" + identifier + "' before initialization");

////////////
// Typeof //
////////////

const typeof_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, typeof_right) => Tree.primitive("undefined"),
  on_live_hit: (scope, identifier, typeof_right, writable, access) => Tree.unary(
    "typeof",
    access(null)),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, typeof_right, box, check) => Tree.unary(
    "typeof",
    Builtin.get(
      Meta.get(scope, box),
      Tree.primitive(identifier),
      null))};

exports.typeof = (scope, identifier) => Base.lookup(scope, identifier, null, typeof_callbacks);

//////////
// Read //
//////////

const read_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, read_right) => Builtin.throw_reference_error(identifier + " is not defined"),
  on_live_hit: (scope, identifier, read_right, writable, access) => access(null),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, read_right, box, check) => Builtin.get(
    Meta.get(scope, box),
    Tree.primitive(identifier),
    null)};

exports.read = (scope, identifier) => Base.lookup(scope, identifier, null, read_callbacks);

///////////
// Write //
///////////

const MARKER = {};

// We can safely drop the ongoing created aran_expression because it has no side effect (on the scope).
const optimistic_write_callbacks = {
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, optimistic_write_right) => (
    Outer._is_strict(scope) ?
    Tree.sequence(
      optimistic_write_right,
      Builtin.throw_reference_error(identifier + " is not defined")) :
    Builtin.define_property(
      Builtin.grab("global"),
      Tree.primitive(identifier),
      {
        __proto__: null,
        value: optimistic_write_right,
        writable: true,
        enumerable: true,
        configurable: true},
      false,
      Builtin._success_result)),
  on_live_hit: (scope, identifier, optimistic_write_right, writable, access) => (
    writable ?
    access(optimistic_write_right) :
    Tree.sequence(
      optimistic_write_right,
      Builtin.throw_type_error("Assignment to constant variable."))),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dead_hit: (scope, identifier, optimistic_write_right, writable) => Tree.sequence(
    optimistic_write_right,
    on_dead_hit(scope, identifier)),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, optimistic_write_right, box, check) => { throw MARKER }};

const pessimistic_write_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, pessimistic_write_right) => (
    Outer._is_strict(scope) ?
    Builtin.throw_reference_error(identifier + " is not defined") :
    Builtin.define_property(
      Builtin.grab("global"),
      Tree.primitive(identifier),
      {
        __proto__: null,
        value: Meta.get(scope, pessimistic_write_right),
        writable: true,
        enumerable: true,
        configurable: true},
      false,
      Builtin._success_result)),
  on_live_hit: (scope, identifier, pessimistic_write_right, writable, access) => (
    writable ?
    access(
      Meta.get(scope, pessimistic_write_right)) :
    Builtin.throw_type_error("Assignment to constant variable.")),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, pessimistic_write_right, box, check) => Builtin.set(
    Meta.get(scope, box),
    Tree.primitive(identifier),
    Meta.get(scope, pessimistic_write_right),
    null,
    (
      check ||
      Outer._is_strict(scope)),
    Builtin._success_result)};

exports.write = (scope, identifier, optimistic_write_right) => {
  try {
    return Base.lookup(scope, identifier, optimistic_write_right, optimistic_write_callbacks);
  } catch (error) {
    /* istanbul ignore next */
    // console.assert(error === MARKER);
    if (error !== MARKER) {
      throw error;
    }
    return Meta.box(scope, "right_hand_side", false, optimistic_write_right, (pessimistic_write_right) => {
      return Base.lookup(scope, identifier, pessimistic_write_right, pessimistic_write_callbacks);
    });
  }
};
