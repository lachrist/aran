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
// Kind //
//////////

const is_loose_kind = ({kind}) => (
  kind === "var" ||
  kind === "function");

const is_rigid_kind = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "param");

/////////
// Tag //
/////////

const GLOBAL_OBJECT_TAG = "global-object";
const GLOBAL_DECLARATIVE_TAG = "global-declarative";
const WITH_TAG = "with";
const CLOSURE_TAG = "closure";

/////////
// Key //
/////////

const STRICT_KEY = "strict";
const SWITCH_KEY = "switch";
const CLOSURE_KEY = "closure";
const COMPLETION_KEY = "completion";

/////////////
// Forward //
/////////////

exports.get = Base.get;
exports.set = Base.set;
exports.box = Base.box;
exports.Box = Base.Box;
exports.eval = Base.eval;
exports.parameter = Base.parameter;

/////////////
// Binding //
/////////////

const from_nullable_box = (nullable_box) => (
  nullable_box === null ?
  abort("Missing box") :
  nullable_box);

exports._is_strict = (scope) => Base._get_binding(scope, STRICT_KEY);

exports._has_new_target = (scope) => Base._get_binding(scope, CLOSURE_KEY).newtarget;

exports._has_completion = (scope) => Base._get_binding(scope, COMPLETION_KEY) === null;
exports.get_completion = (scope) => Base.get(
  scope,
  from_nullable_box(
    Base._get_binding(scope, COMPLETION_KEY)));
exports.set_completion = (scope, expression) => Base.set(
  scope,
  from_nullable_box(
    Base._get_binding(scope, COMPLETION_KEY)),
  expression);

exports._has_super = (scope) => Base._get_binding(scope, CLOSURE_KEY).super !== null;
exports.get_super = (scope, _nullable_box) => Base.get(
  scope,
  from_nullable_box(
    Base._get_binding(scope, CLOSURE_KEY).super));

exports._has_self = (scope) => Base._get_binding(scope, CLOSURE_KEY).self !== null;
exports.get_self = (scope, _nullable_box) => Base.get(
  scope,
  from_nullable_box(
    Base._get_binding(scope, CLOSURE_KEY).self));

exports._get_closure_kind = (scope) => Base._get_binding(scope, CLOSURE_KEY).kind;

////////////////
// initialize //
////////////////

exports.initialize = (scope, kind, identifier, expression) => (
  is_loose_kind(kind) ?
  exports.write(scope, identifier, expression) :
  Base.initialize(
    scope,
    kind,
    identifier,
    expression,
    Base._get_binding(scope, SWITCH_KEY)));

///////////////////
// _is_available //
///////////////////

const is_available_callback_prototype = {
  static: function (kind) { return this.loose && is_loose_kind(kind) },
  dynamic: function (tag) { return (
    tag === GLOBAL_DECLARATIVE_TAG ?
    ArrayLite.every(
      this.static_global_record,
      (variable) => (
        variable.name !== this.variable.name ||
        this.static(variable.kind))) :
    true) }};

exports._is_available = (scope, variable, static_global_record) => Base._is_available(
  scope,
  kind
  identifier,
  {
    __proto__: is_available_callback_prototype,
    loos: is_loose_kind(kind),
    identifier,
    static_global_declarative_record});

///////////////
// Exentsion //
///////////////

const populate = (scope, variables, callback) => Tree.Bundle(
  [
    Tree.Bundle(
      ArrayLite.flatMap(
        variables,
        (variable) => (
          is_loose_kind(variable.kind) ?
          Base.DeclareInitialize(scope, variable.kind, variable.name, false) :
          Base.Declare(scope, variable.kind, variable.name)))),
    callback(scope)]);

const populate_completion = (scope, completion, variables, callback) => (
  completion ?
  Base.Box(
    scope,
    true,
    "Completion",
    Tree.primitive(void 0),
    (box) => populate(
      Base._extend_binding(scope, COMPLETION_KEY, box),
      variables,
      callback)) :
  populate(
    Base._extend_binding(scope, COMPLETION_KEY, null),
    variables,
    callbacks));

const stain = (scope) => Scope._extend_binding(scope, SWITCH_KEY, true);
const clean = (scope) => (
  Scope._get_binding(scope, SWITCH_KEY) ?
  Scope._extend_binding(scope, SWITCH_KEY, false) :
  scope);

const make_global = (kinds, strict, completion, variables, callback, _scope) => (
  _scope = Base._make_root(),
  _scope = Base._extend_binding(_scope, SWITCH_KEY, false),
  _scope = Base._extend_binding(_scope, STRICT_KEY, strict),
  _scope = Base._extend_binding(
    _scope,
    CLOSURE_CONTEXT_BINDING_KEY,
    {
      kind: "program",
      super: null,
      self: null,
      newtarget: false}),
  _scope = Base._extend_dynamic(
    _scope,
    ["var", "function"],
    GLOBAL_OBJECT_TAG,
    false,
    false,
    Base._builtin_box("#globalObjectRecord")),
  _scope = Base._extend_dynamic(
    _scope,
    ["let", "const", "class"],
    GLOBAL_DECLARATIVE_TAG,
    true,
    false,
    Base._builtin_box("#globalDeclarativeRecord")),
  Base.EXTEND_STATIC(
    _scope,
    kinds,
    (scope) => populate_completion(scope, completion, variables, callback)));

exports.MODULE = (strict, completion, variables, callback) => make_global(
  ["var", "function", "let", "const", "class"],
  true,
  completion,
  variables,
  callback);

exports.SCRIPT = (strict, completion, variables, callback) => make_global(
  [],
  strict,
  completion,
  variables,
  callback);

exports.EVAL = (scope, strict, completion, variables, callback) => Base.EXTEND_STATIC(
  clean(
    (
      strict ?
      Base._extend_binding(scope, STRICT_KEY, true) :
      scope)),
  (
    (
      strict ||
      Scope._get_binding(scope, STRICT_KEY)) ?
    ["var", "function", "let", "const", "class"] :
    ["let", "const", "class"]),
  (scope) => populate_completion(scope, completion, variables, callback));

exports.BLOCK = (scope, variables, callback) => Base.EXTEND_STATIC(
  clean(scope),
  ["let", "const", "class"],
  (scope) => populate(scope, variables, callback));

exports.WITH = (scope, box, variables, callback) => Base.EXTEND_STATIC(
  Base._extend_dynamic(
    scope,
    [],
    WITH_TAG,
    false,
    true,
    clean(scope)),
  ["let", "const", "class"],
  (scope) => populate(scope, variables, callback));

exports.SWITCH = (scope, variables, callback) => Base.EXTEND_STATIC(
  stain(scope),
  ["let", "const", "class"],
  (scope) => populate(variables, callback));

exports.CASE = (scope, callback) => Base.EXTEND_STATIC(_scope, [], callback);

exports.CLOSURE = (scope, strict, context, dynamic, variables1, callback1, variables2, callback2) => (
  scope = clean(scope),
  scope = Base._extend_closure(scope),
  scope = (
    strict ?
    Base._extend_binding(scope, STRICT_KEY, true) :
    scope),
  scope = Base._extend_binding(
    scope,
    CLOSURE_KEY,
    {
      kind: context.kind,
      super: context.super,
      self: context.self,
      newtarget: (
        context.newtarget ||
        Base._get_binding(scope, CLOSURE_KEY).newtarget)}),
  (
    dynamic ?
    Base.EXTEND_STATIC(
      scope,
      ["param", "let", "const", "class"],
      (scope) => Base.Box(
        scope,
        false,
        "ScopeLayer5Index",
        Builtin.construct_object(
          Tree.primitive(null),
          []),
        (box, _scope) => (
          _scope = Base._extend_dynamic(scope, ["var", "function"], CLOSURE_TAG, false, false, box),
          Tree.Bundle(
            [
              populate(_scope, variables1, callback1),
              populate(_scope, variables2, callback2)])))) :
  Base.EXTEND_STATIC(
    scope,
    ["param", "var", "function", "let", "const", "class"],
    (scope) => Tree.Bundle(
      [
        populate(scope, variables1, callback1),
        populate(scope, variables2, callback2)]))));

////////////
// Delete //
////////////

const delete_callback_prototype = {
  on_miss: () => Tree.primitive(true),
  on_dead_hit: (kind) => Tree.primitive(true),
  on_live_hit: (kind, access) => Tree.primitive(true),
  on_dynamic_hit: function (tag, box) { return Builtin.delete_property(
    Meta.get(this.scope, box),
    Tree.primitive(this.identifier),
    Outer._is_strict(this.scope),
    Builtin._success_result) };

exports.delete = (scope, identifier) => Base.lookup(
  scope,
  identifier,
  {
    __proto__: delete_callback_prototype,
    scope,
    identifier});

////////////
// Typeof //
////////////

const typeof_callback_prototype = {
  on_miss: () => Tree.primitive("undefined"),
  on_dead_hit: function () { return Builtin.throw_reference_error(`Cannot read type from deadzone variable ${this.identifier}`) },
  on_live_hit: (kind, access) => Tree.unary(
    "typeof",
    access(null)),
  on_dynamic_hit: (tag, box) => Tree.unary(
    "typeof",
    Builtin.get(
      Meta.get(this.scope, box),
      Tree.primitive(this.identifier),
      null))};

exports.typeof = (scope, identifier) => Base.lookup(
  scope,
  identifier,
  {
    __proto__: typeof_callback_prototype,
    scope,
    identifier});

//////////
// Read //
//////////

const read_callback_prototype = {
  on_miss: function () { return Builtin.throw_reference_error(`Cannot read from missing variable ${this.identifier}`) },
  on_dead_hit: function () { return Builtin.throw_reference_error(`Cannot read from deadzone variable ${this.identifier}`) },
  on_live_hit: (kind, access) => access(null),
  on_dynamic_hit: (tag, box) => Builtin.get(
    Meta.get(this.scope, box),
    Tree.primitive(this.identifier),
    null)};

exports.read = (scope, identifier) => Base.lookup(
  scope,
  identifier,
  {
    __proto__: read_callback_prototype,
    scope,
    identifier});

///////////
// Write //
///////////

const MARKER = {};

// We can safely drop the ongoing created aran_expression because it has no side effect (on the scope).
const optimistic_write_callback_prototype = {
  on_miss: function () { return (
    Outer._is_strict(this.scope) ?
    Tree.sequence(
      this.right,
      Builtin.throw_reference_error(`Cannot write to missing variable ${this.identifier}`)) :
    Builtin.define_property(
      Builtin.grab("global"),
      Tree.primitive(this.identifier),
      {
        __proto__: null,
        value: this.right,
        writable: true,
        enumerable: true,
        configurable: true},
      false,
      Builtin._success_result)) },
  on_dead_hit: function (kind) { return Tree.sequence(
    this.right,
    Builtin.throw_reference_error(`Cannot write to deadzone variable ${this.identifier}`)) },
  on_live_hit: function (kind, access) { return (
    (
      kind === "const" ||
      kind === "class") ?
    Tree.sequence(
      this.right,
      Builtin.throw_type_error(`Cannot write to constant variable ${this.identifier}`)) :
    access(this.right)) },
  on_dynamic_hit: (tag, box) => { throw MARKER }};

const pessimistic_write_callback_prototype = {
  on_miss: function () { return (
    Outer._is_strict(this.scope) ?
    Builtin.throw_reference_error(`Cannot write to missing variable ${this.identifier}`) :
    Builtin.define_property(
      Builtin.grab("global"),
      Tree.primitive(this.identifier),
      {
        __proto__: null,
        value: Meta.get(this.scope, this.right),
        writable: true,
        enumerable: true,
        configurable: true},
      false,
      Builtin._success_result)) },
  on_dead_hit: function (kind) { return Builtin.throw_reference_error(`Cannot write to deadzone variable ${this.identifier}`) },
  on_live_hit: function (kind, access) { return (
    (
      kind === "const" ||
      kind === "class") ?
    Builtin.throw_type_error(`Cannot write to constant variable ${this.identifier}`) :
    access(
      Meta.get(this.scope, pessimistic_write_right))) },
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: function (tag, box) { return Builtin.set(
    Meta.get(this.scope, box),
    Tree.primitive(this.identifier),
    Meta.get(this.scope, this.right),
    null,
    (
      tag === GLOBAL_DECLARATIVE_TAG ||
      Outer._is_strict(this.scope)),
    Builtin._success_result) };

exports.write = (scope, identifier, expression) => {
  try {
    return Base.lookup(
      scope,
      identifier,
      {
        __proto__: optimistic_write_callback_prototype,
        scope,
        identifier,
        right: expression}) }
  catch (error) {
    /* istanbul ignore next */
    if (error !== MARKER) {
      throw error }
    return Meta.box(
      scope,
      false,
      "right_hand_side",
      expression,
      (box) => Base.lookup(
        scope,
        identifier,
        {
          __proto__: pessimistic_write_callbacks,
          scope,
          identifier,
          right: box})) } };
