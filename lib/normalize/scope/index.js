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

const Meta = require("./meta.js");
const Base = require("./base.js");
const Core = require("./core.js");
const Build = require("../build.js");
const Object = require("../object.js");

const global_Error = global.Error;

/////////
// Box //
/////////

exports.get = Meta.get;

exports.set = Meta.set;

exports.box = Meta.box;

exports.Box = Meta.Box;

////////////
// Extend //
////////////

exports._extend_use_strict = Core._extend_use_strict;

exports._extend_closure = Core._extend_closure;

exports._extend_dynamic = Base._extend_dynamic;

exports.EXTEND_STATIC = (parent, hoisting, kontinuation) => Core.EXTEND_STATIC(parent, (scope) => {
  for (let extended_identifier in hoisting) {
    Base._declare(scope, extended_identifier, hoisting[extended_identifier]);
  }
  return kontinuation(scope);
});

////////////////
// Initialize //
////////////////

exports.initialize = Base.initialize;

///////////////
// Parameter //
///////////////

exports.parameter = Core.parameter;

////////////
// Delete //
////////////

const delete_callbacks = {
  on_miss: (scope, identifier, delete_right) => Object.del(
    Core._is_strict(scope),
    Build.builtin("global"),
    Build.primitive(identifier),
    null),
  on_live_hit: (scope, identifier, delete_right, writable, access) => Build.primitive(true),
  on_dead_hit: (scope, identifier, delete_right) => Build.primitive(true),
  on_dynamic_hit: (scope, identifier, delete_right, box) => Object.del(
    Core._is_strict(scope),
    Meta.get(scope, box),
    Build.primitive(identifier),
    null)};

exports.delete = (scope, identifier) => Base.lookup(scope, identifier, null, delete_callbacks);

/////////////////////////////
// Typeof && Read && Write //
/////////////////////////////

const on_dead_hit = (scope, identifier) => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + identifier + "' before initialization")]));

////////////
// Typeof //
////////////

const typeof_callbacks = {
  on_dead_hit,
  on_miss: (scope, identifier, typeof_right) => Build.unary(
    "typeof",
    Object.get(
      Build.builtin("global"),
      Build.primitive(identifier))),
  on_live_hit: (scope, identifier, typeof_right, writable, access) => Build.unary(
    "typeof",
    access(null)),
  on_dynamic_hit: (scope, identifier, typeof_right, box) => Build.unary(
    "typeof",
    Object.get(
      Meta.get(scope, box),
      Build.primitive(identifier)))};

exports.typeof = (scope, identifier) => Base.lookup(scope, identifier, null, typeof_callbacks);

//////////
// Read //
//////////

const read_callbacks = {
  on_dead_hit,
  on_miss: (scope, identifier, read_right) => Build.conditional(
    Object.has(
      Build.builtin("global"),
      Build.primitive(identifier)),
    Object.get(
      Build.builtin("global"),
      Build.primitive(identifier)),
    Build.throw(
    Build.construct(
      Build.builtin("ReferenceError"),
      [
        Build.primitive(identifier + " is not defined")]))),
  on_live_hit: (scope, identifier, read_right, writable, access) => access(null),
  on_dynamic_hit: (scope, identifier, read_right, box) => Object.get(
    Meta.get(scope, box),
    Build.primitive(identifier))};

exports.read = (scope, extended_identifier) => {
  if (extended_identifier === "this") {
    return Base.read_this(scope);
  }
  if (extended_identifier === "new.target") {
    return Base.read_new_target(scope);
  }
  return Base.lookup(scope, extended_identifier, null, read_callbacks);
};

///////////
// Write //
///////////

const MARKER = {};

// We can safely drop the ongoing created aran_expression because it has no side effect (on the scope).
const optimistic_write_callbacks = {
  on_miss: (scope, identifier, optimistic_write_right) => (
    Core._is_strict(scope) ?
    ((() => { throw MARKER }) ()) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(identifier),
      optimistic_write_right,
      null)),
  on_live_hit: (scope, identifier, optimistic_write_right, writable, access) => (
    writable ?
    access(optimistic_write_right) :
    Build.sequence(
      optimistic_write_right,
      Build.throw(
        Build.construct(
          Build.builtin("TypeError"),
          [
            Build.primitive("Assignment to constant variable.")])))),
  on_dead_hit: (scope, identifier, optimistic_write_right, writable) => Build.sequence(
    optimistic_write_right,
    on_dead_hit(scope, identifier)),
  on_dynamic_hit: (scope, identifier, optimistic_write_right, box) => { throw MARKER }};

const pessimistic_write_callbacks = {
  on_miss: (scope, identifier, pessimistic_write_right) => (
    Core._is_strict(scope) ?
    Build.conditional(
      Object.has(
        Build.builtin("global"),
        Build.primitive(identifier)),
      Object.set(
        true,
        Build.builtin("global"),
        Build.primitive(identifier),
        Meta.get(scope, pessimistic_write_right),
        null),
      Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive(identifier + " is not defined")]))) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(identifier),
      Meta.get(scope, pessimistic_write_right),
      null)),
  on_live_hit: (scope, identifier, pessimistic_write_right, writable, access) => (
    writable ?
    access(
      Meta.get(scope, pessimistic_write_right)) :
    Build.throw(
      Build.construct(
        Build.builtin("TypeError"),
        [
          Build.primitive("Assignment to constant variable.")]))),
  on_dead_hit,
  on_dynamic_hit: (scope, identifier, pessimistic_write_right, box) => Object.set(
      Core._is_strict(scope),
      Meta.get(scope, box),
      Build.primitive(identifier),
      Meta.get(scope, pessimistic_write_right),
      null)};

exports.write = (scope, identifier, optimistic_write_right) => {
  try {
    return Base.lookup(scope, identifier, optimistic_write_right, optimistic_write_callbacks);
  } catch (error) {
    /* istanbul ignore next */
    if (error !== MARKER) {
      throw error;
    }
    return Meta.box(scope, "right_hand_side", optimistic_write_right, (pessimistic_write_right) => {
      return Base.lookup(scope, identifier, pessimistic_write_right, pessimistic_write_callbacks);
    });
  }
};
