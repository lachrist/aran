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
const Tree = require("../tree.js");
const Mop = require("../mop.js");

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

exports.eval = Outer.eval;

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
  on_miss: (scope, identifier, delete_right) => Mop.deleteProperty(
    Tree.builtin("global"),
    Tree.primitive(identifier),
    Outer._is_strict(scope)),
  on_live_hit: (scope, identifier, delete_right, writable, access) => Tree.primitive(true),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dead_hit: (scope, identifier, delete_right) => Tree.primitive(true),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, delete_right, box) => Mop.deleteProperty(
    Meta.get(scope, box),
    Tree.primitive(identifier),
    Outer._is_strict(scope))};

exports.delete = (scope, identifier) => Base.lookup(scope, identifier, null, delete_callbacks);

/////////////////////////////
// Typeof && Read && Write //
/////////////////////////////

// console.assert(identifier !== "this" && identifier !== "new.target");
const on_dead_hit = (scope, identifier) => Tree.throw(
  Tree.construct(
    Tree.builtin("ReferenceError"),
    [
      Tree.primitive("Cannot access '" + identifier + "' before initialization")]));

////////////
// Typeof //
////////////

const typeof_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, typeof_right) => Tree.unary(
    "typeof",
    Mop.get(
      Tree.builtin("global"),
      Tree.primitive(identifier),
      null)),
  on_live_hit: (scope, identifier, typeof_right, writable, access) => Tree.unary(
    "typeof",
    access(null)),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, typeof_right, box) => Tree.unary(
    "typeof",
    Mop.get(
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
  on_miss: (scope, identifier, read_right) => Tree.conditional(
    Mop.has(
      Tree.builtin("global"),
      Tree.primitive(identifier)),
    Mop.get(
      Tree.builtin("global"),
      Tree.primitive(identifier),
      null),
    Tree.throw(
    Tree.construct(
      Tree.builtin("ReferenceError"),
      [
        Tree.primitive(identifier + " is not defined")]))),
  on_live_hit: (scope, identifier, read_right, writable, access) => access(null),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, read_right, box) => Mop.get(
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
    ((() => { throw MARKER }) ()) :
    Mop.set(
      Tree.builtin("global"),
      Tree.primitive(identifier),
      optimistic_write_right,
      null,
      Outer._is_strict(scope))),
  on_live_hit: (scope, identifier, optimistic_write_right, writable, access) => (
    writable ?
    access(optimistic_write_right) :
    Tree.sequence(
      optimistic_write_right,
      Tree.throw(
        Tree.construct(
          Tree.builtin("TypeError"),
          [
            Tree.primitive("Assignment to constant variable.")])))),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dead_hit: (scope, identifier, optimistic_write_right, writable) => Tree.sequence(
    optimistic_write_right,
    on_dead_hit(scope, identifier)),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, optimistic_write_right, box) => { throw MARKER }};

const pessimistic_write_callbacks = {
  on_dead_hit,
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_miss: (scope, identifier, pessimistic_write_right) => (
    Outer._is_strict(scope) ?
    Tree.conditional(
      Mop.has(
        Tree.builtin("global"),
        Tree.primitive(identifier)),
      Mop.set(
        Tree.builtin("global"),
        Tree.primitive(identifier),
        Meta.get(scope, pessimistic_write_right),
        null,
        Outer._is_strict(scope)),
      Tree.throw(
        Tree.construct(
          Tree.builtin("ReferenceError"),
          [
            Tree.primitive(identifier + " is not defined")]))) :
    Mop.set(
      Tree.builtin("global"),
      Tree.primitive(identifier),
      Meta.get(scope, pessimistic_write_right),
      null,
      Outer._is_strict(scope))),
  on_live_hit: (scope, identifier, pessimistic_write_right, writable, access) => (
    writable ?
    access(
      Meta.get(scope, pessimistic_write_right)) :
    Tree.throw(
      Tree.construct(
        Tree.builtin("TypeError"),
        [
          Tree.primitive("Assignment to constant variable.")]))),
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: (scope, identifier, pessimistic_write_right, box) => Mop.set(
    Meta.get(scope, box),
    Tree.primitive(identifier),
    Meta.get(scope, pessimistic_write_right),
    null,
    Outer._is_strict(scope))};

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
