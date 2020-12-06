"use strict";

// https://tc39.es/ecma262/#sec-arguments-exotic-objects
//
// type Hoisting = Map ExtendedIdentifier Writable
// type Writable = Boolean
// type TypeofRight = ()
// type DeleteRight = ()
// type ReadRight = ()
// type OptimisticWriteRight = AranExpression
// type PessimisticWriteRight = Box

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");
const Base = require("./layer-4-base.js");

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
const CASE_KEY = "case";
const CLOSURE_KEY = "closure";
const COMPLETION_KEY = "completion";

/////////////
// Forward //
/////////////

exports.get = Base.get;
exports.set = Base.set;
exports.box = Base.box;
exports.Box = Base.Box;
exports.ImportBox = Base.ImportBox;
exports._primitive_box = Base._primitive_box;
exports._builtin_box = Base._builtin_box;
exports._test_box = Base._test_box;
exports.eval = Base.eval;
exports.parameter = Base.parameter;

///////////////
// Extension //
///////////////

const make_check_variable = (kinds) => ({kind}) => Throw.assert(
  ArrayLite.includes(kinds, kind),
  null,
  `Invalid variable`);

const populate = (scope, variables, callback) => Tree.Bundle(
  [
    Tree.Bundle(
      ArrayLite.map(
        variables,
        (variable) => Base.Declare(scope, variable.kind, variable.name))),
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
    callback));

const clean_case = (scope) => (
  Base._get_binding(scope, CASE_KEY) ?
  Base._extend_binding(scope, CASE_KEY, false) :
  scope);

exports._make_test_root = (options, _scope) => (
  options = global_Object_assign(
    {
      strict: false,
      case: false,
      completion: null,
      sort: "program",
      super: null,
      self: null,
      newtarget: false},
    options),
  _scope = Base._make_root(),
  _scope = Base._extend_binding(_scope, STRICT_KEY, options.strict),
  _scope = Base._extend_binding(_scope, CASE_KEY, options.case),
  _scope = Base._extend_binding(
    _scope,
    CLOSURE_KEY,
    {
      sort: options.sort,
      super: options.super,
      self: options.self,
      newtarget: options.newtarget}),
  _scope);

exports._make_root = (_scope) => (
  _scope = Base._make_root(),
  _scope = Base._extend_binding(_scope, STRICT_KEY, false),
  _scope = Base._extend_binding(_scope, CASE_KEY, false),
  _scope = Base._extend_binding(
    _scope,
    CLOSURE_KEY,
    {
      sort: "program",
      super: null,
      self: null,
      newtarget: false}),
  _scope);

exports._extend_dynamic_global = (scope) => (
  scope = clean_case(scope),
  scope = Base._extend_dynamic(
    scope,
    ["var", "function"],
    GLOBAL_OBJECT_TAG,
    false,
    Base._builtin_box("aran.globalObjectRecord")),
  scope = Base._extend_dynamic(
    scope,
    ["let", "const", "class"],
    GLOBAL_DECLARATIVE_TAG,
    false,
    Base._builtin_box("aran.globalDeclarativeRecord")),
  scope);

exports._extend_dynamic_with = (scope, box) => Base._extend_dynamic(
  clean_case(scope),
  [],
  WITH_TAG,
  true,
  box);

// Normally modules should always be in strict mode and not have completions.
// We let these options open for testing purposes.
const module_kind_array = ["var", "function", "import", "let", "const", "class"];
const check_module_variable = make_check_variable(module_kind_array);
exports.MODULE = (scope, completion, variables, callback) => (
  ArrayLite.forEach(variables, check_module_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    module_kind_array,
    (scope) => populate_completion(scope, completion, variables, callback)));

const script_kind_array = ["var", "function", "let", "const", "class"];
const check_script_variable = make_check_variable(script_kind_array);
exports.SCRIPT = (scope, completion, variables, callback) => (
  ArrayLite.forEach(variables, check_script_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    [],
    (scope) => populate_completion(scope, completion, variables, callback)));

const eval_kind_array = ["var", "function", "let", "const", "class"];
const check_eval_variable = make_check_variable(script_kind_array);
exports.EVAL = (scope, completion, variables, callback) => (
  ArrayLite.forEach(variables, check_eval_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    (
      Base._get_binding(scope, STRICT_KEY) ?
      ["var", "function", "let", "const", "class"] :
      ["let", "const", "class"]),
    (scope) => populate_completion(scope, completion, variables, callback)));

exports.CASE = (scope, callback) => Base.EXTEND_STATIC(
  Base._extend_binding(scope, CASE_KEY, true),
  [],
  callback);

const block_kind_array = ["param", "let", "const", "class"];
const block_check_variable = make_check_variable(block_kind_array);
exports.BLOCK = (scope, variables, callback) => (
  ArrayLite.forEach(variables, block_check_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    block_kind_array,
    (scope) => populate(scope, variables, callback)));

const closure_head_kind_array = ["param", "var", "function"];
const check_closure_head_variable = make_check_variable(closure_head_kind_array);
exports.CLOSURE_HEAD = (scope, context, dynamic, variables, callback, _box) => (
  ArrayLite.forEach(variables, check_closure_head_variable),
  scope = clean_case(scope),
  scope = Base._extend_closure(scope),
  scope = Base._extend_binding(
    scope,
    CLOSURE_KEY,
    {
      sort: context.sort,
      super: context.super,
      self: context.self,
      newtarget: (
        context.newtarget ||
        Base._get_binding(scope, CLOSURE_KEY).newtarget)}),
  (
    dynamic ?
    (
      _box = Base._primitive_box("dummy-primitive-box"),
      Base.EXTEND_STATIC(
        Base._extend_dynamic(
          scope,
          ["var", "function"],
          CLOSURE_TAG,
          false,
          _box),
        ["param"],
        (scope) => Base.Box(
          scope,
          false,
          "HeadClosureFrame",
          Builtin.construct_object(
            Tree.primitive(null),
            []),
          (box) => (
            global_Object_assign(_box, box),
            populate(scope, variables, callback))))) :
    Base.EXTEND_STATIC(
      scope,
      closure_head_kind_array,
      (scope) => populate(scope, variables, callback))));

const closure_body_kind_array = ["var", "function", "let", "const", "class"];
const check_closure_body_variable = make_check_variable(closure_body_kind_array);
exports.CLOSURE_BODY = (scope, dynamic, variables, callback, _box) => (
  ArrayLite.forEach(variables, check_closure_body_variable),
  scope = clean_case(scope),
  (
    dynamic ?
    (
      _box = Base._primitive_box("dummy-primitive-box"),
      Base.EXTEND_STATIC(
        Base._extend_dynamic(
          scope,
          ["var", "function"],
          CLOSURE_TAG,
          false,
          _box),
        ["let", "const", "class"],
        (scope) => Base.Box(
          scope,
          false,
          "BodyClosureFrame",
          Builtin.construct_object(
            Tree.primitive(null),
            []),
          (box) => (
            global_Object_assign(_box, box),
            populate(scope, variables, callback))))) :
    Base.EXTEND_STATIC(
      scope,
      closure_body_kind_array,
      (scope) => populate(scope, variables, callback))));

// https://www.ecma-international.org/ecma-262/#sec-functiondeclarationinstantiation
// 27. NOTE: Only a single lexical environment is needed for the parameters and top-level vars.
// 28. NOTE: A separate Environment Record is needed to ensure that closures created by expressions
//     in the formal parameter list do not have visibility of declarations in the function body.
// 28. NOTE: A var with the same name as a formal parameter initially has the same value as the
//     corresponding initialized parameter.
// 30. NOTE: Non-strict functions use a separate lexical Environment Record for top-level lexical
//     declarations so that a direct eval can determine whether any var scoped declarations introduced
//     by the eval code conflict with pre-existing top-level lexically scoped declarations. This is not
//     needed for strict functions because a strict direct eval always places all declarations into a
//     new Environment Record.

// exports.CLOSURE = (scope, context, has_direct_eval_call_1, variables1, callback1, has_direct_eval_call_2, variables2, callback2, _closure) => (
//   (
//     ArrayLite.some(variables1, is_block_variable) ?
//     abort("Closure head block should not contain block variables") :
//     null),
//   (
//     ArrayLite.some(variables1, is_import_variable) ?
//     abort("Closure head block should not contain import variables") :
//     null),
//   (
//     ArrayLite.some(variables2, is_param_variable) ?
//     abort("Closure body block should not contain parameter variables") :
//     null),
//   (
//     ArrayLite.some(variables2, is_import_variable) ?
//     abort("Closure body block should not contain import variables") :
//     null),
//   (
//
//     Base._get_binding(scope, STRICT_KEY) ?
//     (
//       has_direct_eval_call_1 = false,
//       has_direct_eval_call_2 = false) :
//     null),
//   scope = clean_case(scope),
//   scope = Base._extend_closure(scope),
//   scope = Base._extend_binding(
//     scope,
//     CLOSURE_KEY,
//     {
//       sort: context.sort,
//       super: context.super,
//       self: context.self,
//       newtarget: (
//         context.newtarget ||
//         Base._get_binding(scope, CLOSURE_KEY).newtarget)}),
//   _closure = (scope) => Tree.Bundle(
//     [
//       populate(scope, variables1, callback1),
//       (
//         has_direct_eval_call_2 ?
//         Base.Box(
//           scope,
//           false,
//           "DynamicBodyClosureFrame",
//           Builtin.construct_object(
//             Tree.primitive(null),
//             []),
//           (box) => Tree.Lone(
//             [],
//             Base.EXTEND_STATIC(
//               Base._extend_dynamic(scope, ["var", "function"], CLOSURE_TAG, false, box),
//               ["let", "const", "class"],
//               (scope) => populate(scope, variables2, callback2)))) :
//         Tree.Lone(
//           [],
//           Base.EXTEND_STATIC(
//             scope,
//             ["var", "function", "let", "const", "class"],
//             (scope) => populate(scope, variables2, callback2))))]),
//   (
//     has_direct_eval_call_1 ?
//     Base.EXTEND_STATIC(
//       scope,
//       [],
//       (scope) => Base.Box(
//         scope,
//         false,
//         "DynamicHeadClosureFrame",
//         Builtin.construct_object(
//           Tree.primitive(null),
//           []),
//         (box) => Tree.Lone(
//           [],
//           Base.EXTEND_STATIC(
//             scope,
//             ["param"],
//             _closure)))) :
//     Base.EXTEND_STATIC(
//       scope,
//       ["var", "function", "param"],
//       _closure)));

////////////////
// initialize //
////////////////

exports.initialize = (scope, kind, identifier, expression) => Base.initialize(
  scope,
  kind,
  identifier,
  expression,
  Base._get_binding(scope, CASE_KEY),
  exports.write);

////////////
// Import //
////////////

exports.ImportInitialize = (scope, identifier, source) => Base.ImportInitialize(
  scope,
  identifier,
  source,
  Base._get_binding(scope, CASE_KEY));

/////////////
// Binding //
/////////////

const from_nullable_box = (nullable_box) => (
  Throw.assert(nullable_box !== null, null, `Missing box`),
  nullable_box);

exports._is_strict = (scope) => Base._get_binding(scope, STRICT_KEY);
exports._use_strict = (scope) => Base._extend_binding(scope, STRICT_KEY, true);

exports._has_new_target = (scope) => Base._get_binding(scope, CLOSURE_KEY).newtarget;

exports._has_completion = (scope) => Base._get_binding(scope, COMPLETION_KEY) !== null;
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

exports._get_sort = (scope) => Base._get_binding(scope, CLOSURE_KEY).sort;

///////////////////
// _is_available //
///////////////////

exports._is_available = (scope, kind, identifier, _nullable_tag_array) => (
  _nullable_tag_array = Base._is_available(scope, kind, identifier),
  (
    _nullable_tag_array !== null &&
    (
      (
        kind === "var" ||
        kind === "function" ||
        (
          Throw.assert(
            !ArrayLite.includes(_nullable_tag_array, GLOBAL_OBJECT_TAG),
            null,
            `The global object frame cannot be query for rigid variable availability`),
          Throw.assert(
            !ArrayLite.includes(_nullable_tag_array, CLOSURE_TAG),
            null,
            `Dynamic closure frame cannot be query for rigid variable availability`))),
      (
        ArrayLite.includes(_nullable_tag_array, GLOBAL_DECLARATIVE_TAG) ?
        null :
        true))));

////////////
// Delete //
////////////

const delete_callback_prototype = {
  on_miss: () => Tree.primitive(true),
  on_dead_hit: (writable) => Tree.primitive(false),
  on_live_hit: (writable, access) => Tree.primitive(false),
  on_dynamic_hit: function (tag, box) { return (
    (
      tag === CLOSURE_TAG ||
      tag === GLOBAL_DECLARATIVE_TAG) ?
    Tree.primitive(false) :
    Builtin.delete_property(
      Base.get(this.scope, box),
      Tree.primitive(this.identifier),
      Base._get_binding(this.scope, STRICT_KEY),
      Builtin._success_result)) }};

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
  on_dynamic_hit: function (tag, box) { return Tree.unary(
    "typeof",
    Builtin.get(
      Base.get(this.scope, box),
      Tree.primitive(this.identifier),
      null)) }};

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
  on_dynamic_hit: function (tag, box) { return Builtin.get(
    Base.get(this.scope, box),
    Tree.primitive(this.identifier),
    null) }};

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
  on_miss: () => Tree.primitive("dummy-expression"),
  on_dead_hit: function () { return Tree.sequence(
    this.right,
    Builtin.throw_reference_error(`Cannot write to deadzone variable ${this.identifier}`)) },
  on_live_hit: function (writable, access) { return (
    writable ?
    access(this.right) :
    Tree.sequence(
      this.right,
      Builtin.throw_type_error(`Cannot write to constant variable ${this.identifier}`))) },
  on_dynamic_hit: (tag, box) => { throw MARKER }};

const pessimistic_write_callback_prototype = {
  on_miss: function () { return (
    Base._get_binding(this.scope, STRICT_KEY) ?
    Builtin.throw_reference_error(`Cannot write to missing variable ${this.identifier}`) :
    Builtin.define_property(
      Builtin.grab("aran.globalObjectRecord"),
      Tree.primitive(this.identifier),
      {
        __proto__: null,
        value: Base.get(this.scope, this.right),
        writable: true,
        enumerable: true,
        configurable: true},
      false,
      Builtin._success_result)) },
  on_dead_hit: function (kind) { return Builtin.throw_reference_error(`Cannot write to deadzone variable ${this.identifier}`) },
  on_live_hit: function (writable, access) { return (
    writable ?
    access(
      Base.get(this.scope, this.right)) :
    Builtin.throw_type_error(`Cannot write to constant variable ${this.identifier}`)) },
  // console.assert(identifier !== "this" && identifier !== "new.target");
  on_dynamic_hit: function (tag, box) { return Builtin.set(
    Base.get(this.scope, box),
    Tree.primitive(this.identifier),
    Base.get(this.scope, this.right),
    null,
    (
      tag === GLOBAL_DECLARATIVE_TAG ||
      Base._get_binding(this.scope, STRICT_KEY)),
    Builtin._success_result) }};

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
    return Base.box(
      scope,
      false,
      "RightHandSide",
      expression,
      (box) => Base.lookup(
        scope,
        identifier,
        {
          __proto__: pessimistic_write_callback_prototype,
          scope,
          identifier,
          right: box})) } };
