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

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_startsWith = global.String.prototype.startsWith;
const global_JSON_stringify = global.JSON.stringify;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Intrinsic = require("../intrinsic.js");
const Base = require("./layer-4-base.js");

////////////////
// Identifier //
////////////////

const is_special_identifier = (identifier) => (
  identifier === "super" ||
  identifier === "new.target" ||
  identifier === "import.meta" ||
  identifier === "this");

const is_enclave_read_identifier = (identifier) => (
  identifier !== "await" &&
  identifier !== "let" &&
  identifier !== "static" &&
  identifier !== "yield" &&
  identifier !== "implements" &&
  identifier !== "package" &&
  identifier !== "protected" &&
  identifier !== "interface" &&
  identifier !== "private" &&
  identifier !== "public");

const is_enclave_write_identifier = (identifier) => (
  is_enclave_read_identifier(identifier) &&
  identifier !== "eval" &&
  identifier !== "arguments" &&
  !is_special_identifier(identifier));

//////////
// Kind //
//////////

const is_loose_kind = (kind) => (
  kind === "var" ||
  kind === "function");

const is_writable_kind = (kind) => (
  kind === "var" ||
  kind === "function" ||
  kind === "param" ||
  kind === "let");

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

const ENCLAVE_KEY = "enclave"; // boolean
const STRICT_KEY = "strict"; // boolean
const CASE_KEY = "case"; // boolean
const SORT_KEY = "closure"; // {arrow:boolean, function: "function" | "method" | "constructor" | "derived-constructor"}
const COMPLETION_KEY = "completion"; // null | scope.meta.Box
const LOOP_KEY = "loop-label"; // null | aran.Label

/////////////
// Forward //
/////////////

exports.get = Base.get;
exports.set = Base.set;
exports.box = Base.box;
exports.Box = Base.Box;
exports._primitive_box = Base._primitive_box;
exports._intrinsic_box = Base._intrinsic_box;
exports._test_box = Base._test_box;
exports.input = Base.input;
exports._get_depth = Base._get_depth;

///////////////
// Extension //
///////////////

const make_check_variable = (kinds) => ({kind}) => Throw.assert(
  ArrayLite.includes(kinds, kind),
  null,
  `Invalid variable`);

const populate = (scope, variables, configurable, callback) => Tree.Bundle(
  [
    Tree.Bundle(
      ArrayLite.map(
        variables,
        (variable) => Base.Declare(scope, variable, configurable))),
    callback(scope)]);

const clean_case = (scope) => (
  Base._fetch_binding(scope, CASE_KEY) ?
  Base._extend_binding(scope, CASE_KEY, false) :
  scope);

exports._make_root = (options, _scope) => (
  options = global_Object_assign(
    {
      enclave: false,
      strict: false,
      case: false,
      loop: null,
      completion: null,
      sort: "program"},
    options),
  _scope = Base._make_root(),
  _scope = Base._extend_binding(_scope, ENCLAVE_KEY, options.enclave),
  _scope = Base._extend_binding(_scope, STRICT_KEY, options.strict),
  _scope = Base._extend_binding(_scope, CASE_KEY, options.case),
  _scope = Base._extend_binding(_scope, COMPLETION_KEY, options.completion),
  _scope = Base._extend_binding(_scope, LOOP_KEY, options.loop),
  _scope = Base._extend_binding(
    _scope,
    SORT_KEY,
    (
      options.sort === "arrow" ?
      {
        arrow: true,
        function: "program"} :
      {
        arrow: false,
        function: options.sort})),
  _scope);

exports._extend_dynamic_global = (scope) => (
  scope = clean_case(scope),
  scope = Base._extend_dynamic(
    scope,
    ["var", "function"],
    GLOBAL_OBJECT_TAG,
    false,
    Base._intrinsic_box("aran.globalObjectRecord")),
  scope = Base._extend_dynamic(
    scope,
    ["let", "const", "class"],
    GLOBAL_DECLARATIVE_TAG,
    false,
    Base._intrinsic_box("aran.globalDeclarativeRecord")),
  scope);

exports._extend_dynamic_with = (scope, box) => Base._extend_dynamic(
  clean_case(scope),
  [],
  WITH_TAG,
  true,
  box);

// Normally modules should always be in strict mode and not have completions.
// We let these options open for testing purposes.
const module_kind_array = ["param", "var", "function", "import", "let", "const", "class"];
const check_module_variable = make_check_variable(module_kind_array);
exports.MODULE = (scope, variables, callback) => (
  ArrayLite.forEach(variables, check_module_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    [],
    module_kind_array,
    (scope) => populate(scope, variables, false, callback)));

const script_kind_array = ["param", "var", "function", "let", "const", "class"];
const check_script_variable = make_check_variable(script_kind_array);
exports.SCRIPT = (scope, variables, callback) => (
  ArrayLite.forEach(variables, check_script_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    [],
    ["param"],
    (scope) => populate(scope, variables, false, callback)));

const eval_kind_array = ["param", "var", "function", "let", "const", "class"];
const check_eval_variable = make_check_variable(script_kind_array);
exports.EVAL = (scope, variables, callback) => (
  ArrayLite.forEach(variables, check_eval_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    [],
    (
      Base._fetch_binding(scope, STRICT_KEY) ?
      ["param", "var", "function", "let", "const", "class"] :
      ["param", "let", "const", "class"]),
    (scope) => populate(scope, variables, true, callback)));

exports.CASE = (scope, callback) => Base.EXTEND_STATIC(
  Base._extend_binding(scope, CASE_KEY, true),
  [],
  [],
  callback);

const block_kind_array = ["param", "let", "const", "class"];
const block_check_variable = make_check_variable(block_kind_array);
exports.BLOCK = (scope, labels, variables, callback) => (
  ArrayLite.forEach(variables, block_check_variable),
  Base.EXTEND_STATIC(
    clean_case(scope),
    labels,
    block_kind_array,
    (scope) => populate(scope, variables, false, callback)));

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

const closure_head_kind_array = ["param", "var", "function"];
const check_closure_head_variable = make_check_variable(closure_head_kind_array);
exports.CLOSURE_HEAD = (scope, sort, dynamic, variables, callback, _box) => (
  ArrayLite.forEach(variables, check_closure_head_variable),
  scope = clean_case(scope),
  scope = Base._extend_closure(scope),
  scope = Base._extend_binding(
    scope,
    SORT_KEY,
    (
      sort === "arrow" ?
      {
        arrow: true,
        function: Base._fetch_binding(scope, SORT_KEY).function} :
      {
        arrow: false,
        function: sort})),
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
        [],
        ["param"],
        (scope) => Base.Box(
          scope,
          false,
          "HeadClosureFrame",
          Intrinsic.construct_object(
            Tree.primitive(null),
            []),
          (box) => (
            global_Object_assign(_box, box),
            populate(scope, variables, false, callback))))) :
    Base.EXTEND_STATIC(
      scope,
      [],
      closure_head_kind_array,
      (scope) => populate(scope, variables, false, callback))));

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
        [],
        ["let", "const", "class"],
        (scope) => Base.Box(
          scope,
          false,
          "BodyClosureFrame",
          Intrinsic.construct_object(
            Tree.primitive(null),
            []),
          (box) => (
            global_Object_assign(_box, box),
            populate(scope, variables, false, callback))))) :
    Base.EXTEND_STATIC(
      scope,
      [],
      closure_body_kind_array,
      (scope) => populate(scope, variables, false, callback))));

////////////////
// initialize //
////////////////

exports.initialize = (scope, kind, identifier, expression) => (
  Throw.assert(
    !(
      is_special_identifier(identifier) &&
      is_loose_kind(kind)),
    null,
    `Special variable cannot be loose`),
  Base.initialize(
    scope,
    kind,
    identifier,
    expression,
    Base._fetch_binding(scope, CASE_KEY),
    (
      is_special_identifier(identifier) ?
      Throw.deadcode :
      exports.write)));

/////////////
// Binding //
/////////////

const from_nullable_box = (nullable_box) => (
  Throw.assert(nullable_box !== null, null, `Missing box`),
  nullable_box);

exports._is_strict = (scope) => Base._fetch_binding(scope, STRICT_KEY);
exports._use_strict = (scope) => Base._extend_binding(scope, STRICT_KEY, true);

exports._extend_completion = (scope, nullable_box) => Base._extend_binding(scope, COMPLETION_KEY, nullable_box);
exports._has_completion = (scope) => Base._fetch_binding(scope, COMPLETION_KEY) !== null;
exports.get_completion = (scope) => Base.get(
  scope,
  from_nullable_box(
    Base._fetch_binding(scope, COMPLETION_KEY)));
exports.set_completion = (scope, expression) => Base.set(
  scope,
  from_nullable_box(
    Base._fetch_binding(scope, COMPLETION_KEY)),
  expression);

exports._fetch_sort = (scope, _sort) => (
  _sort = Base._fetch_binding(scope, SORT_KEY),
  _sort.arrow ? "arrow" : _sort.function);

exports._fetch_loop = (scope, _nullable_label) => (
  _nullable_label = Base._fetch_binding(scope, LOOP_KEY),
  Throw.assert(_nullable_label !== null, null, `missing loop label`),
  _nullable_label);

exports._extend_loop = (scope, label) => Base._extend_binding(scope, LOOP_KEY, label);

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

//////////
// eval //
//////////

exports.eval = (scope, expression) => (
  expression = Base.eval(scope, expression),
  State._register_scope(
    {
      context: {
        strict: Base._fetch_binding(scope, STRICT_KEY),
        sort: Base._fetch_binding(scope, SORT_KEY).function },
      stringified: global_JSON_stringify(scope)}),
  expression);

////////////
// Delete //
////////////

const regular_delete_callback_prototype = {
  on_miss () { return (
    Throw.assert(
      !Base._fetch_binding(this.scope, ENCLAVE_KEY),
      Throw.EnclaveLimitationAranError,
      `Aran cannot delete any external identifier`),
    Tree.primitive(true)); },
  on_static_dead_hit: (variable) => Tree.primitive(false),
  on_static_live_hit: (variable, read, write) => Tree.primitive(false),
  on_dynamic_dead_hit: () => Tree.primitive(false),
  on_dynamic_live_hit (tag, box) { return Intrinsic.delete_property(
    Base.get(this.scope, box),
    Tree.primitive(this.identifier),
    Base._fetch_binding(this.scope, STRICT_KEY),
    Intrinsic._success_result); }};

exports.delete = (scope, identifier) => (
  Throw.assert(
    !is_special_identifier(identifier),
    null,
    `Cannot delete special variable`),
  Base.lookup(
    scope,
    identifier,
    {
      __proto__: regular_delete_callback_prototype,
      scope,
      identifier}));

////////////
// Typeof //
////////////

const regular_typeof_callback_prototype = {
  on_miss () { return (
    Base._fetch_binding(this.scope, ENCLAVE_KEY) ?
    (
      Throw.assert(
        is_enclave_read_identifier(this.identifier),
        Throw.EnclaveLimitationAranError,
        `Forbidden typeof query of external identifier ${this.identifier}`),
      Tree.__enclave_typeof__(this.identifier)) :
    Tree.primitive("undefined")); },
  on_static_dead_hit (variable) { return (
    variable.kind === "import" ?
    Tree.unary(
      "typeof",
      Tree.import(variable.import, variable.source)) :
    Intrinsic.throw_reference_error(
      `Cannot read type from non-initialized static variable named ${variable.name}`)); },
  on_static_live_hit: (variable, read, write) => Tree.unary(
    "typeof",
    read()),
  on_dynamic_dead_hit () { return Intrinsic.throw_reference_error(
    `Cannot read type from non-initialized dynamic variable named ${this.identifier}`); },
  on_dynamic_live_hit (tag, box) { return Tree.unary(
    "typeof",
    Intrinsic.get(
      Base.get(this.scope, box),
      Tree.primitive(this.identifier),
      null)); }};

exports.typeof = (scope, identifier) => (
  Throw.assert(
    !is_special_identifier(identifier),
    null,
    `Cannot typeof special variable`),
  Base.lookup(
  scope,
  identifier,
  {
    __proto__: regular_typeof_callback_prototype,
    scope,
    identifier}));

//////////
// Read //
//////////

const special_read_callback_prototype = {
  on_miss () { return (
    Throw.assert(
      Base._fetch_binding(this.scope, ENCLAVE_KEY),
      null,
      `Missing special variable named '${this.identifier}'`),
    Tree.__enclave_read__(this.identifier)) },
  on_static_live_hit (variable, read, write) { return (
    (
      this.identifier === "this" &&
      Base._fetch_binding(this.scope, SORT_KEY).function === "derived-constructor") ?
    Tree.conditional(
      read(),
      read(),
      Intrinsic.throw_reference_error(`Cannot read variable named 'this' before calling super constructor`)) :
    read()); },
  on_static_dead_hit (variable) { Throw.abort(
    null,
    `Dead special variable named '${this.identifier}'`); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

const regular_read_callback_prototype = {
  on_miss () { return (
      Base._fetch_binding(this.scope, ENCLAVE_KEY) ?
      (
        Throw.assert(
          is_enclave_read_identifier(this.identifier),
          Throw.EnclaveLimitationAranError,
          `Forbidden read of external identifier ${this.identifier}`),
        Tree.__enclave_read__(this.identifier)) :
      Intrinsic.throw_reference_error(
        `Cannot read from missing variable ${this.identifier}`)); },
  on_static_dead_hit (variable) { return (
    variable.kind === "import" ?
    Tree.import(variable.import, variable.source) :
    Intrinsic.throw_reference_error(`Cannot read from non-initialized static variable named ${variable.name}`)); },
  on_static_live_hit: (variable, read, write) => read(),
  on_dynamic_dead_hit () { return Intrinsic.throw_reference_error(
    `Cannot read from non-initialized dynamic variable named ${this.identifier}`); },
  on_dynamic_live_hit (tag, box) { return Intrinsic.get(
    Base.get(this.scope, box),
    Tree.primitive(this.identifier),
    null); }};

exports.read = (scope, identifier) => (
  Throw.assert(
    identifier !== "super",
    null,
    `Cannot read super variable`),
  Base.lookup(
    scope,
    identifier,
    {
      __proto__: (
        is_special_identifier(identifier) ?
        special_read_callback_prototype :
        regular_read_callback_prototype),
      scope,
      identifier}));

///////////
// Write //
///////////

// First attempt optimistic write (ie not assigning right aran expression to a meta variable).
// If hit dynamic frame, go to pessimistic write.
// N.B. We can safely drop the aran expressions created during optimisitic write because they have no side effects(on the scope).

const DYNAMIC_FRAME_FAILURE = {};

const regular_write_callback_prototype = {
  failure (expression) { return (
    this.optimistic ?
    Tree.sequence(
      this.right,
      expression) :
    expression); },
  on_miss () { return (
    Base._fetch_binding(this.scope, ENCLAVE_KEY) ?
    (
      Throw.assert(
        is_enclave_write_identifier(this.identifier),
        Throw.EnclaveLimitationAranError,
        `Forbidden write of external identifier ${this.identifier}`),
      Tree.__enclave_write__(
        Base._fetch_binding(this.scope, STRICT_KEY),
        this.identifier,
        (
          this.optimistic ?
          this.right :
          Base.get(this.scope, this.right)))) :
    (
      Base._fetch_binding(this.scope, STRICT_KEY) ?
      this.failure(
        Intrinsic.throw_reference_error(
          `Cannot write to missing variable ${this.identifier}`)) :
      Intrinsic.define_property(
        Intrinsic.grab("aran.globalObjectRecord"),
        Tree.primitive(this.identifier),
        {
          __proto__: null,
          value: (
            this.optimistic ?
            this.right :
            Base.get(this.scope, this.right)),
          writable: true,
          enumerable: true,
          configurable: true},
        false,
        Intrinsic._success_result))); },
  on_static_dead_hit (variable) { return this.failure(
    Intrinsic.throw_reference_error(
      `Cannot write to non-initialized static variable named ${variable.name}`)); },
  on_static_live_hit (variable, read, write) { return (
    is_writable_kind(variable.kind) ?
    write(
      (
        this.optimistic ?
        this.right :
        Base.get(this.scope, this.right))) :
    this.failure(
      Intrinsic.throw_type_error(
        `Cannot write to static constant variable named ${variable.name}`))); },
  // console.assert(!this.optimistic)
  on_dynamic_dead_hit () { return this.failure(
    Intrinsic.throw_reference_error(
      `Cannot write to non-initialized dynamic variable named ${this.identifier}`)); },
  on_dynamic_live_hit (tag, box) { return (
    this.optimistic ?
    (
      (
        () => { throw DYNAMIC_FRAME_FAILURE; })
      ()) :
    Intrinsic.set(
      Base.get(this.scope, box),
      Tree.primitive(this.identifier),
      Base.get(this.scope, this.right),
      null,
      (
        tag === GLOBAL_DECLARATIVE_TAG ||
        Base._fetch_binding(this.scope, STRICT_KEY)),
      Intrinsic._success_result)); }};

exports.write = (scope, identifier, expression) => {
  Throw.assert(!is_special_identifier(identifier), null, `Cannot write special variable`);
  try {
    return Base.lookup(
      scope,
      identifier,
      {
        __proto__: regular_write_callback_prototype,
        optimistic: true,
        scope,
        identifier,
        right: expression}); }
  catch (error) {
    /* istanbul ignore next */
    if (error !== DYNAMIC_FRAME_FAILURE) {
      throw error; }
    return Base.box(
      scope,
      false,
      "RightHandSide",
      expression,
      (box) => Base.lookup(
        scope,
        identifier,
        {
          __proto__: regular_write_callback_prototype,
          optimistic: false,
          scope,
          identifier,
          right: box})); } };

///////////
// super //
///////////

const super_helper_callback_prototype = {
  on_miss () { Throw.abort(null, `Missing special variable during super access`) },
  on_static_live_hit (variable, read, write) { return (
    this.right === null ?
    read() :
    write(this.right)); },
  on_static_dead_hit (variable) { Throw.abort(null, `Dead special variable during super access`); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

const super_member_callback_prototype = {
  on_miss () { return (
    Throw.assert(
      Base._fetch_binding(this.scope, ENCLAVE_KEY),
      null,
      `Missing super identifier (member)`),
    Tree.__enclave_super_member__(this.key)); },
  on_static_dead_hit (variable) { return (
    Throw.abort(
      null,
      `Super identifier in deadzone (member)`)); },
  on_static_live_hit (variable, read, write, _expression) { return (
    _expression = Intrinsic.get(
      Intrinsic.get_prototype_of(
        Intrinsic.get(
          read(),
          Tree.primitive("prototype"),
          null)),
      this.key,
      null),
    (
      // This is an optimization because this should always be non-null for constructor/method
      Base._fetch_binding(this.scope, SORT_KEY).function === "derived-constructor" ?
      Tree.conditional(
        Base.lookup(
          this.scope,
          "this",
          {
            __proto__: super_helper_callback_prototype,
            right: null}),
        _expression,
        Intrinsic.throw_reference_error(`Cannot access super property before calling super constructor`)) :
      _expression)); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

const super_call_callback_prototype = {
  on_miss () { return (
    Throw.assert(
      Base._fetch_binding(this.scope, ENCLAVE_KEY),
      null,
      `Missing super identifier (call)`),
    // N.B.: new.target is passed under the hood but if super is external so is new.target!
    Tree.__enclave_super_call__(this.arguments)); },
  on_static_dead_hit (variable) { return (
    Throw.abort(
      null,
      `Super identifier in deadzone (call)`)); },
  on_static_live_hit (variable, read, write) { return Tree.conditional(
    Base.lookup(
      this.scope,
      "this",
      {
        __proto__: super_helper_callback_prototype,
        right: null}),
    Intrinsic.throw_reference_error(`Super constructor may only be called once`),
    Tree.sequence(
      Base.lookup(
        this.scope,
        "this",
        {
          __proto__: super_helper_callback_prototype,
          right: Intrinsic.construct(
            Intrinsic.get(
              read(),
              Tree.primitive("constructor"),
              null),
            this.arguments,
            Base.lookup(
              this.scope,
              "new.target",
              {
                __proto__: super_helper_callback_prototype,
                right: null}))}),
      Base.lookup(
        this.scope,
        "this",
        {
          __proto__: super_helper_callback_prototype,
          right: null}))); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

exports.super_member = (scope, expression) => Base.lookup(
  scope,
  "super",
  {
    __proto__: super_member_callback_prototype,
    scope,
    key: expression});

exports.super_call = (scope, expression) => Base.lookup(
  scope,
  "super",
  {
    __proto__: super_call_callback_prototype,
    scope,
    arguments: expression});
