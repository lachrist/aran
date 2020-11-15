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
const Base = require("./base.js");

//////////
// Meta //
//////////

exports.get = Base.get;

exports.set = Base.set;

exports.box = Base.box;

exports.Box = Base.Box;

/////////////
// Binding //
/////////////

// Internal //
const BACKGROUND_BINDING_KEY = "background";
const STRICT_MODE_BINDING_KEY = "strict-mode";
const FUNCTION_EXPRESSION_ANCESTOR_BINDING_KEY = "function-expression-ancestor";
const CLOSURE_CONTEXT_BINDING_KEY = "closure-context";
const COMPLETION_BOX_BINDING_KEY = "completion-box";

exports._is_strict = (scope) => Base._get_binding(scope, STRICT_MODE_BINDING_KEY);
exports._get_super_box = (scope) => Base._get_binding(scope, SUPER_BOX_BINDING_KEY);
exports._get_self_box = (scope) => Base._get_binding(scope, SELF_BOX_BINDING_KEY);
exports._get_closure_kind = (scope) => Base._get_binding(scope, CLOSURE_KIND_BINDING_KEY);
exports._has_function_expression_ancestor = (scope) => Base._get_binding(scope, FUNCTION_EXPRESSION_ANCESTOR_BINDING_KEY);
exports._get_completion_box = (scope) => Base._get_completion_box(scope, COMPLETION_BOX_BINDING_KEY);

///////////////////////////
// Declare && Initialize //
///////////////////////////

const is_closure_variable = ({kind}) => (
  kind === "var" ||
  kind === "function");

const is_block_variable = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "param");

const declare = (scope) => (variable) => (
  is_closure_variable(variable) ?
  Base.DeclareInitialize(scope, variable.name, kind) :
  Base.Declare(scope, variable.name, kind));

exports.initialize = (scope, kind, identifier, expression) => (
  is_closure_variable({kind}) ?
  exports.write(scope, identifier, expression) :
  Base.initialize(
    (
      Base._get_binding(scope, BACKGROUND_BINDING_KEY) ?
      Base._get_background(scope) :
      scope),
    kind,
    identifier,
    expression));

//////////
// Make //
//////////

// Callback :: Scope -> aran.Statement
const horizon = (scope, hoisting1, hoisting2, callback) => Scope.EXTEND_STATIC(
  scope,
  (scope) => ArrayLite.concat(
    ArrayLite.map(
      hoisting1,
      declare(
        Base._get_background(scope))),
    ArrayLite.map(
      hoisting2,
      declare(scope)),
    [
      callback(
        (
          ArrayLite.some(hoisting1, is_block_variable) ?
          (
            ArrayLite.some(hoisting2, is_block_variable) ?
            abort("Block variables cannot be both in background hoisting and foreground hoisting") :
            Scope._extend_binding(scope, BACKGROUND_BINDING_KEY, true)) :
          scope))]));

// Strict :: Boolean
// Callback :: Scope -> aran.Block
exports.GLOBAL = (strict, hoisting1, hoisting2, callback, _scope) => (
  _scope = Base._make_root(),
  _scope = Base._extend_binding(_scope, BACKGROUND_BINDING_KEY, false),
  _scope = (
    strict ?
    Base._extend_binding(_scope, STRICT_MODE_BINDING_KEY) :
    strict),
  _scope = Base._extend_binding(
    _scope,
    CLOSURE_CONTEXT_BINDING_KEY,
    {
      closure_kind: "program",
      super_box: null,
      self_box: null,
      function_expression_ancestor: false}),
  _scope = Base._extend_dynamic_local(
    _scope,
    Base._builtin_box("#globalObjectRecord")),
  _scope = Base._extend_dynamic_global(_scope),
  _scope = Base._extend_horizon(_scope),
  horizon(
    scope,
    hoisting1,
    hoisting2,
    callback));

exports.LOCAL = (scope, strict, hoisting1, hoisting2, callback) => horizon(
  (
    strict ?
    Scope.extend_binding(scope, STRICT_MODE_BINDING_KEY, true) :
    scope),
  hoisting1,
  hoisting2,
  callback);

// Callback :: Scope -> aran.Statement
exports.HORIZON = (scope, hoisting1, hoisting2, callback) => Scope.EXTEND_STATIC(
  Scope._extend_binding(scope, BACKGROUND_BINDING_KEY, false),
  (scope) => Base.Box(
    scope,
    "ScopeCrustObjectRecord",
    false,
    Builtin.construct_object(
      Tree.primitive(null),
      []),
    (box) => Tree.Lone(
      [],
      horizon(
        Base._extend_horizon(
          Base._extend_dynamic_local(scope, box)),
        hoisting1,
        hoisting2,
        callback))));

// Callback :: Scope -> aran.Block
// Strict :: Boolean
// Context :: {
//   kind: "arrow" | "function" | "method" | "constructor" | "derived-constructor",
//   super: null | Box,
//   self: null | Box
//   strict
// }
exports.CLOSURE = (scope, strict, context, callback) => (
  Scope._extend_binding(scope, BACKGROUND_BINDING_KEY, false),
  scope = Outer._extend_closure(scope),
  scope = (
    strict ?
    Base._extend_binding(scope, STRICT_MODE_BINDING_KEY, true) :
    scope),
  scope = Scope._extend_binding(
    scope,
    CLOSURE_CONTEXT_BINDING_KEY,
    {
      closure_kind: context.kind,
      super_box: context.super,
      self_box: context.self,
      function_expression_ancestor: (
        context.kind === "function" ||
        context.kind === "method" ||
        context.kind === "constructor" ||
        context.kind === "derived-constructor" ||
        Scope._get_binding(scope, CLOSURE_CONTEXT_BINDING_KEY).function_expression_ancestor)}),
  callback(scope));

// Callback :: Scope -> aran.Statement
exports.WITH = (scope, box, hoisting, callback) => Scope.EXTEND_STATIC(
  Scope._extend_dynamic_with(
    Scope._extend_binding(scope, BACKGROUND_BINDING_KEY, false),
    box),
  (scope) => ArrayLite.concat(
    ArrayLite.map(
      hoisting,
      declare(scope)),
    [
      callback(scope)]));

// Callback :: Scope -> aran.Statement
exports.BLOCK = (scope, hoisting, callback) => Scope.EXTEND_STATIC(
  Scope._extend_binding(scope, BACKGROUND_BINDING_KEY, false),
  (scope) => ArrayLite.concat(
    ArrayLite.map(
      hoisting,
      declare(scope)),
    [
      callback(scope)]));

exports.EMPTY = (scope, callback) => Scope.EXTEND_EMPTY(
  Scope._extend_binding(scope, BACKGROUND_BINDING_KEY, false),
  callback);

///////////
// Other //
///////////

exports.eval = Base.eval;

exports.parameter = Base.parameter;

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
