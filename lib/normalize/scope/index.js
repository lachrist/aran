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
const Outer = require("./outer.js");
const Lang = require("../lang.js");
const Object = require("../object.js");

const global_Error = global.Error;

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

exports._make_root = Outer._make_root;

exports._make_eval = Outer._make_eval;

////////////
// Extend //
////////////

exports._extend_use_strict = Outer._extend_use_strict;

exports._extend_closure = Outer._extend_closure;

exports._extend_dynamic = Base._extend_dynamic;

exports.EXTEND_STATIC = (scope, hoisting, kontinuation) => Outer.EXTEND_STATIC(scope, (scope) => {
  for (let identifier in hoisting) {
    Base._declare(scope, identifier, hoisting[identifier]);
  }
  return kontinuation(scope);
});

///////////
// Other //
///////////

exports._is_eval = Outer._is_eval;

exports._is_strict = Outer._is_strict;

////////////////
// Initialize //
////////////////

exports.initialize = Base.initialize;

///////////////
// Parameter //
///////////////

exports.parameter = Outer.parameter;

////////////
// Delete //
////////////

const delete_callbacks = {
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, delete_right) => Object.del(
    Outer._is_strict(scope),
    Lang.builtin("global"),
    Lang.primitive(identifier),
    null),
  on_live_hit: (scope, identifier, delete_right, writable, access) => Lang.primitive(true),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dead_hit: (scope, identifier, delete_right) => Lang.primitive(true),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, delete_right, box) => Object.del(
    Outer._is_strict(scope),
    Meta.get(scope, box),
    Lang.primitive(identifier),
    null)};

exports.delete = (scope, identifier) => Base.lookup(scope, identifier, null, delete_callbacks);

/////////////////////////////
// Typeof && Read && Write //
/////////////////////////////

// console.assert(identifier !== "this" && identifier !== "new.target");
const on_dead_hit = (scope, identifier) => Lang.throw(
  Lang.construct(
    Lang.builtin("ReferenceError"),
    [
      Lang.primitive("Cannot access '" + identifier + "' before initialization")]));

////////////
// Typeof //
////////////

const typeof_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, typeof_right) => Lang.unary(
    "typeof",
    Object.get(
      Lang.builtin("global"),
      Lang.primitive(identifier))),
  on_live_hit: (scope, identifier, typeof_right, writable, access) => Lang.unary(
    "typeof",
    access(null)),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, typeof_right, box) => Lang.unary(
    "typeof",
    Object.get(
      Meta.get(scope, box),
      Lang.primitive(identifier)))};

exports.typeof = (scope, identifier) => Base.lookup(scope, identifier, null, typeof_callbacks);

//////////
// Read //
//////////

const read_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, read_right) => Lang.conditional(
    Object.has(
      Lang.builtin("global"),
      Lang.primitive(identifier)),
    Object.get(
      Lang.builtin("global"),
      Lang.primitive(identifier)),
    Lang.throw(
    Lang.construct(
      Lang.builtin("ReferenceError"),
      [
        Lang.primitive(identifier + " is not defined")]))),
  on_live_hit: (scope, identifier, read_right, writable, access) => access(null),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, read_right, box) => Object.get(
    Meta.get(scope, box),
    Lang.primitive(identifier))};

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
    ((() => { throw MARKER }) ()) :
    Object.set(
      false,
      Lang.builtin("global"),
      Lang.primitive(identifier),
      optimistic_write_right,
      null)),
  on_live_hit: (scope, identifier, optimistic_write_right, writable, access) => (
    writable ?
    access(optimistic_write_right) :
    Lang.sequence(
      optimistic_write_right,
      Lang.throw(
        Lang.construct(
          Lang.builtin("TypeError"),
          [
            Lang.primitive("Assignment to constant variable.")])))),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dead_hit: (scope, identifier, optimistic_write_right, writable) => Lang.sequence(
    optimistic_write_right,
    on_dead_hit(scope, identifier)),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, optimistic_write_right, box) => { throw MARKER }};

const pessimistic_write_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, pessimistic_write_right) => (
    Outer._is_strict(scope) ?
    Lang.conditional(
      Object.has(
        Lang.builtin("global"),
        Lang.primitive(identifier)),
      Object.set(
        true,
        Lang.builtin("global"),
        Lang.primitive(identifier),
        Meta.get(scope, pessimistic_write_right),
        null),
      Lang.throw(
        Lang.construct(
          Lang.builtin("ReferenceError"),
          [
            Lang.primitive(identifier + " is not defined")]))) :
    Object.set(
      false,
      Lang.builtin("global"),
      Lang.primitive(identifier),
      Meta.get(scope, pessimistic_write_right),
      null)),
  on_live_hit: (scope, identifier, pessimistic_write_right, writable, access) => (
    writable ?
    access(
      Meta.get(scope, pessimistic_write_right)) :
    Lang.throw(
      Lang.construct(
        Lang.builtin("TypeError"),
        [
          Lang.primitive("Assignment to constant variable.")]))),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, pessimistic_write_right, box) => Object.set(
    Outer._is_strict(scope),
    Meta.get(scope, box),
    Lang.primitive(identifier),
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
    return Meta.box(scope, "right_hand_side", false, optimistic_write_right, (pessimistic_write_right) => {
      return Base.lookup(scope, identifier, pessimistic_write_right, pessimistic_write_callbacks);
    });
  }
};
