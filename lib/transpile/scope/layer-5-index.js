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

exports.makeOpenExpression = Base.makeOpenExpression;
exports.makeCloseExpression = Base.makeCloseExpression;
exports.makeBoxExpression = Base.makeBoxExpression;
exports.makeBoxStatement = Base.makeBoxStatement;
exports.PrimitiveBox = Base.PrimitiveBox;
exports.IntrinsicBox = Base.IntrinsicBox;
exports.TestBox = Base.TestBox;
exports.makeInputExpression = Base.makeInputExpression;
exports.getDepth = Base.getDepth;

/////////////
// Binding //
/////////////

const from_nullable_box = (nullable_box) => (
  Throw.assert(nullable_box !== null, null, `Missing box`),
  nullable_box);

exports.isStrict = (scope) => Base.fetchBinding(scope, STRICT_KEY);
exports.StrictBindingScope = (scope) => Base.BindingScope(scope, STRICT_KEY, true);

exports.CompletionBindingScope = (scope, nullable_box) => Base.BindingScope(scope, COMPLETION_KEY, nullable_box);
exports.hasCompletion = (scope) => Base.fetchBinding(scope, COMPLETION_KEY) !== null;
exports.makeOpenCompletionExpression = (scope) => Base.makeOpenExpression(
  scope,
  from_nullable_box(
    Base.fetchBinding(scope, COMPLETION_KEY)));
exports.makeCloseCompletionExpression = (scope, expression) => Base.makeCloseExpression(
  scope,
  from_nullable_box(
    Base.fetchBinding(scope, COMPLETION_KEY)),
  expression);

exports.fetchSort = (scope, _sort) => (
  _sort = Base.fetchBinding(scope, SORT_KEY),
  _sort.arrow ? "arrow" : _sort.function);

exports.fetchLoop = (scope, _nullable_label) => (
  _nullable_label = Base.fetchBinding(scope, LOOP_KEY),
  Throw.assert(_nullable_label !== null, null, `missing loop label`),
  _nullable_label);

exports.LoopBindingScope = (scope, label) => Base.BindingScope(scope, LOOP_KEY, label);

///////////////
// Extension //
///////////////

const make_check_variable = (kinds) => ({kind}) => Throw.assert(
  ArrayLite.includes(kinds, kind),
  null,
  `Invalid variable`);

const declare_enclave_mapping = {
  __proto__: null,
  "var": "var",
  "function": "var",
  "let": "let",
  "const": "const",
  "class": "const",
  "param": null,
  "import": null};

const declare_enclave = (scope, kind, identifier, expression) => (
  Throw.assert(
    (
      kind !== "import" &&
      kind !== "param"),
    null,
    `Cannot enclave-declare import/param variables`),
  Throw.assert(
    Base.fetchBinding(scope, ENCLAVE_KEY),
    null,
    `Cannot enclave-declare on non-enclave scope`),
  Throw.assert(
    is_enclave_write_identifier(identifier),
    Throw.EnclaveLimitationAranError,
    `Forbidden declaration of external variable ${identifier}`),
  Tree.__DeclareEnclaveStatement__(
    declare_enclave_mapping[kind],
    identifier,
    expression));

const populate = (scope, variables, configurable, callback) => Tree.ListStatement(
  [
    Tree.ListStatement(
      ArrayLite.map(
        variables,
        (variable) => Base.makeDeclareStatement(
          scope,
          variable,
          // we makes rigid dynamic variables configurable so that if they
          // are not writable, they can still be reassigned over their deadzone marker.
          // This requires the delete operation to check for the globalDeclarativeRecord.
          (
            !is_loose_kind(variable.kind) ||
            configurable),
          declare_enclave))),
    callback(scope)]);

const clean_case = (scope) => (
  Base.fetchBinding(scope, CASE_KEY) ?
  Base.BindingScope(scope, CASE_KEY, false) :
  scope);

exports.RootScope = (options, _scope) => (
  options = global_Object_assign(
    {
      enclave: false,
      strict: false,
      case: false,
      loop: null,
      completion: null,
      sort: "program"},
    options),
  _scope = Base.RootScope(),
  _scope = Base.BindingScope(_scope, ENCLAVE_KEY, options.enclave),
  _scope = Base.BindingScope(_scope, STRICT_KEY, options.strict),
  _scope = Base.BindingScope(_scope, CASE_KEY, options.case),
  _scope = Base.BindingScope(_scope, COMPLETION_KEY, options.completion),
  _scope = Base.BindingScope(_scope, LOOP_KEY, options.loop),
  _scope = Base.BindingScope(
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

exports.GlobalDynamicScope = (scope) => (
  scope = clean_case(scope),
  scope = Base.DynamicScope(
    scope,
    ["var", "function"],
    GLOBAL_OBJECT_TAG,
    false,
    Base.IntrinsicBox("aran.globalObjectRecord")),
  scope = Base.DynamicScope(
    scope,
    ["let", "const", "class"],
    GLOBAL_DECLARATIVE_TAG,
    false,
    Base.IntrinsicBox("aran.globalDeclarativeRecord")),
  scope);

exports.WithDynamicScope = (scope, box) => Base.DynamicScope(
  clean_case(scope),
  [],
  WITH_TAG,
  true,
  box);

// Normally modules should always be in strict mode and not have completions.
// We let these options open for testing purposes.
const module_kind_array = ["param", "var", "function", "import", "let", "const", "class"];
const check_module_variable = make_check_variable(module_kind_array);
exports.makeModuleBlock = (scope, variables, callback) => (
  ArrayLite.forEach(variables, check_module_variable),
  Base.makeBlock(
    clean_case(scope),
    module_kind_array,
    (scope) => populate(scope, variables, false, callback)));

const script_kind_array = ["param"];
const check_script_variable = make_check_variable(["param", "var", "function", "let", "const", "class"]);
exports.makeScriptBlock = (scope, variables, callback) => (
  ArrayLite.forEach(variables, check_script_variable),
  Base.makeBlock(
    clean_case(scope),
    script_kind_array,
    (scope) => populate(scope, variables, false, callback)));

const normal_eval_kind_array = ["param", "let", "const", "class"];
const strict_eval_kind_array = ["param", "var", "function", "let", "const", "class"];
const check_eval_variable = make_check_variable(["param", "var", "function", "let", "const", "class"]);
exports.makeEvalBlock = (scope, variables, callback) => (
  ArrayLite.forEach(variables, check_eval_variable),
  Base.makeBlock(
    clean_case(scope),
    (
      Base.fetchBinding(scope, STRICT_KEY) ?
      strict_eval_kind_array :
      normal_eval_kind_array),
    (scope) => populate(scope, variables, true, callback)));

exports.makeCaseBlock = (scope, callback) => Base.makeBlock(
  Base.BindingScope(scope, CASE_KEY, true),
  [],
  callback);

const block_kind_array = ["param", "let", "const", "class"];
const block_check_variable = make_check_variable(block_kind_array);
exports.makeNormalBlock = (scope, variables, callback) => (
  ArrayLite.forEach(variables, block_check_variable),
  Base.makeBlock(
    clean_case(scope),
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
exports.makeHeadClosureBlock = (scope, sort, dynamic, variables, callback, _box) => (
  ArrayLite.forEach(variables, check_closure_head_variable),
  scope = clean_case(scope),
  scope = Base.ClosureScope(scope),
  scope = Base.BindingScope(
    scope,
    SORT_KEY,
    (
      sort === "arrow" ?
      {
        arrow: true,
        function: Base.fetchBinding(scope, SORT_KEY).function} :
      {
        arrow: false,
        function: sort})),
  (
    dynamic ?
    (
      _box = Base.PrimitiveBox("dummy-primitive-box"),
      Base.makeBlock(
        Base.DynamicScope(
          scope,
          ["var", "function"],
          CLOSURE_TAG,
          false,
          _box),
        ["param"],
        (scope) => Base.makeBoxStatement(
          scope,
          false,
          "HeadClosureFrame",
          Intrinsic.makeObjectExpression(
            Tree.PrimitiveExpression(null),
            []),
          (box) => (
            global_Object_assign(_box, box),
            populate(scope, variables, false, callback))))) :
    Base.makeBlock(
      scope,
      closure_head_kind_array,
      (scope) => populate(scope, variables, false, callback))));

const closure_body_kind_array = ["var", "function", "let", "const", "class"];
const check_closure_body_variable = make_check_variable(closure_body_kind_array);
exports.makeBodyClosureBlock = (scope, dynamic, variables, callback, _box) => (
  ArrayLite.forEach(variables, check_closure_body_variable),
  scope = clean_case(scope),
  (
    dynamic ?
    (
      _box = Base.PrimitiveBox("dummy-primitive-box"),
      Base.makeBlock(
        Base.DynamicScope(
          scope,
          ["var", "function"],
          CLOSURE_TAG,
          false,
          _box),
        ["let", "const", "class"],
        (scope) => Base.makeBoxStatement(
          scope,
          false,
          "BodyClosureFrame",
          Intrinsic.makeObjectExpression(
            Tree.PrimitiveExpression(null),
            []),
          (box) => (
            global_Object_assign(_box, box),
            populate(scope, variables, false, callback))))) :
    Base.makeBlock(
      scope,
      closure_body_kind_array,
      (scope) => populate(scope, variables, false, callback))));

/////////////////
// isAvailable //
/////////////////

const is_global_declarative_tag = (tag) => tag === GLOBAL_DECLARATIVE_TAG;

exports.isAvailable = (scope, kind, identifier, _nullable_tag_array) => (
  _nullable_tag_array = Base.isAvailable(scope, kind, identifier),
  (
    _nullable_tag_array === null ?
    false :
    (
      _nullable_tag_array.length === 0 ?
      true :
      (
        Throw.assert(
          ArrayLite.every(_nullable_tag_array, is_global_declarative_tag),
          null,
          `Only the global declarative environment record can be query for availability`),
        null))));

/////////////////////////////
// makeInitializeStatement //
/////////////////////////////

const deadcode = Throw.DeadClosure("Scope.makeInitializeStatement");

exports.makeInitializeStatement = (scope, kind, identifier, expression) => Base.makeInitializeStatement(
  scope,
  kind,
  identifier,
  expression,
  Base.fetchBinding(scope, CASE_KEY),
  (
    is_special_identifier(identifier) ?
    (
      Throw.assert(
        !is_loose_kind(kind),
        null,
        `Special variables cannot be loose`),
      deadcode) :
    exports.makeWriteExpression),
  declare_enclave);

////////////////////////
// makeEvalExpression //
////////////////////////

exports.makeEvalExpression = (scope, expression) => (
  expression = Base.makeEvalExpression(scope, expression),
  State.registerScope(
    {
      context: {
        strict: Base.fetchBinding(scope, STRICT_KEY),
        sort: Base.fetchBinding(scope, SORT_KEY).function },
      stringified: global_JSON_stringify(scope)}),
  expression);

////////////
// Delete //
////////////

const regular_delete_callback_prototype = {
  on_miss () { return (
    Throw.assert(
      !Base.fetchBinding(this.scope, ENCLAVE_KEY),
      Throw.EnclaveLimitationAranError,
      `Aran cannot delete any external identifier`),
    Tree.PrimitiveExpression(true)); },
  on_static_dead_hit: (variable) => Tree.PrimitiveExpression(false),
  on_static_live_hit: (variable, read, write) => Tree.PrimitiveExpression(false),
  on_dynamic_dead_hit: () => Tree.PrimitiveExpression(false),
  on_dynamic_live_hit (tag, box) { return (
    // Variable of the global declarative record are made configurable
    // to enable overwritting over the deadzone marker but in reality
    // they are not configurable.
    tag === GLOBAL_DECLARATIVE_TAG ?
    Tree.PrimitiveExpression(false) :
    Intrinsic.makeDeletePropertyExpression(
      Base.makeOpenExpression(this.scope, box),
      Tree.PrimitiveExpression(this.identifier),
      Base.fetchBinding(this.scope, STRICT_KEY),
      Intrinsic.SUCCESS_RESULT)); }};

exports.makeDeleteExpression = (scope, identifier) => (
  Throw.assert(
    !is_special_identifier(identifier),
    null,
    `Cannot delete special variable`),
  Base.makeLookupExpression(
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
    Base.fetchBinding(this.scope, ENCLAVE_KEY) ?
    (
      Throw.assert(
        is_enclave_read_identifier(this.identifier),
        Throw.EnclaveLimitationAranError,
        `Forbidden typeof query of external identifier ${this.identifier}`),
      Tree.__TypeofEnclaveExpression__(this.identifier)) :
    Tree.PrimitiveExpression("undefined")); },
  on_static_dead_hit (variable) { return (
    variable.kind === "import" ?
    Tree.UnaryExpression(
      "typeof",
      Tree.ImportExpression(variable.import, variable.source)) :
    Intrinsic.makeThrowReferenceErrorExpression(
      `Cannot read type from non-initialized static variable named ${variable.name}`)); },
  on_static_live_hit: (variable, read, write) => Tree.UnaryExpression(
    "typeof",
    read()),
  on_dynamic_dead_hit () { return Intrinsic.makeThrowReferenceErrorExpression(
    `Cannot read type from non-initialized dynamic variable named ${this.identifier}`); },
  on_dynamic_live_hit (tag, box) { return Tree.UnaryExpression(
    "typeof",
    Intrinsic.makeGetExpression(
      Base.makeOpenExpression(this.scope, box),
      Tree.PrimitiveExpression(this.identifier),
      null)); }};

exports.makeTypeofExpression = (scope, identifier) => (
  Throw.assert(
    !is_special_identifier(identifier),
    null,
    `Cannot typeof special variable`),
  Base.makeLookupExpression(
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
      Base.fetchBinding(this.scope, ENCLAVE_KEY),
      null,
      `Missing special variable named '${this.identifier}'`),
    Tree.__ReadEnclaveExpression__(this.identifier)) },
  on_static_live_hit (variable, read, write) { return (
    (
      this.identifier === "this" &&
      Base.fetchBinding(this.scope, SORT_KEY).function === "derived-constructor") ?
    Tree.ConditionalExpression(
      read(),
      read(),
      Intrinsic.makeThrowReferenceErrorExpression(`Cannot read variable named 'this' before calling super constructor`)) :
    read()); },
  on_static_dead_hit (variable) { Throw.abort(
    null,
    `Dead special variable named '${this.identifier}'`); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

const regular_read_callback_prototype = {
  on_miss () { return (
      Base.fetchBinding(this.scope, ENCLAVE_KEY) ?
      (
        Throw.assert(
          is_enclave_read_identifier(this.identifier),
          Throw.EnclaveLimitationAranError,
          `Forbidden read of external identifier ${this.identifier}`),
        Tree.__ReadEnclaveExpression__(this.identifier)) :
      Intrinsic.makeThrowReferenceErrorExpression(
        `Cannot read from missing variable ${this.identifier}`)); },
  on_static_dead_hit (variable) { return (
    variable.kind === "import" ?
    Tree.ImportExpression(variable.import, variable.source) :
    Intrinsic.makeThrowReferenceErrorExpression(`Cannot read from non-initialized static variable named ${variable.name}`)); },
  on_static_live_hit: (variable, read, write) => read(),
  on_dynamic_dead_hit () { return Intrinsic.makeThrowReferenceErrorExpression(
    `Cannot read from non-initialized dynamic variable named ${this.identifier}`); },
  on_dynamic_live_hit (tag, box) { return Intrinsic.makeGetExpression(
    Base.makeOpenExpression(this.scope, box),
    Tree.PrimitiveExpression(this.identifier),
    null); }};

exports.makeReadExpression = (scope, identifier) => (
  Throw.assert(
    identifier !== "super",
    null,
    `Cannot read super variable`),
  Base.makeLookupExpression(
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
    Tree.SequenceExpression(
      this.right,
      expression) :
    expression); },
  on_miss () { return (
    Base.fetchBinding(this.scope, ENCLAVE_KEY) ?
    (
      Throw.assert(
        is_enclave_write_identifier(this.identifier),
        Throw.EnclaveLimitationAranError,
        `Forbidden write of external variable ${this.identifier}`),
      Tree.__WriteEnclaveExpression__(
        Base.fetchBinding(this.scope, STRICT_KEY),
        this.identifier,
        (
          this.optimistic ?
          this.right :
          Base.makeOpenExpression(this.scope, this.right)))) :
    (
      Base.fetchBinding(this.scope, STRICT_KEY) ?
      this.failure(
        Intrinsic.makeThrowReferenceErrorExpression(
          `Cannot write to missing variable ${this.identifier}`)) :
      Intrinsic.makeDefinePropertyExpression(
        Intrinsic.makeGrabExpression("aran.globalObjectRecord"),
        Tree.PrimitiveExpression(this.identifier),
        {
          __proto__: null,
          value: (
            this.optimistic ?
            this.right :
            Base.makeOpenExpression(this.scope, this.right)),
          writable: true,
          enumerable: true,
          configurable: true},
        false,
        Intrinsic.SUCCESS_RESULT))); },
  on_static_dead_hit (variable) { return this.failure(
    Intrinsic.makeThrowReferenceErrorExpression(
      `Cannot write to non-initialized static variable named ${variable.name}`)); },
  on_static_live_hit (variable, read, write) { return (
    is_writable_kind(variable.kind) ?
    write(
      (
        this.optimistic ?
        this.right :
        Base.makeOpenExpression(this.scope, this.right))) :
    this.failure(
      Intrinsic.makeThrowTypeErrorExpression(
        `Cannot write to static constant variable named ${variable.name}`))); },
  // console.assert(!this.optimistic)
  on_dynamic_dead_hit () { return this.failure(
    Intrinsic.makeThrowReferenceErrorExpression(
      `Cannot write to non-initialized dynamic variable named ${this.identifier}`)); },
  on_dynamic_live_hit (tag, box) { return (
    this.optimistic ?
    (
      (
        () => { throw DYNAMIC_FRAME_FAILURE; })
      ()) :
    Intrinsic.makeSetExpression(
      Base.makeOpenExpression(this.scope, box),
      Tree.PrimitiveExpression(this.identifier),
      Base.makeOpenExpression(this.scope, this.right),
      null,
      (
        tag === GLOBAL_DECLARATIVE_TAG ||
        Base.fetchBinding(this.scope, STRICT_KEY)),
      Intrinsic.SUCCESS_RESULT)); }};

exports.makeWriteExpression = (scope, identifier, expression) => {
  Throw.assert(!is_special_identifier(identifier), null, `Cannot write special variable`);
  try {
    return Base.makeLookupExpression(
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
    return Base.makeBoxExpression(
      scope,
      false,
      "RightHandSide",
      expression,
      (box) => Base.makeLookupExpression(
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
      Base.fetchBinding(this.scope, ENCLAVE_KEY),
      null,
      `Missing super identifier (member)`),
    Tree.__SuperMemberEnclaveExpression__(this.key)); },
  on_static_dead_hit (variable) { return (
    Throw.abort(
      null,
      `Super identifier in deadzone (member)`)); },
  on_static_live_hit (variable, read, write, _expression) { return (
    _expression = Intrinsic.makeGetExpression(
      Intrinsic.makeGetPrototypeOfExpression(
        Intrinsic.makeGetExpression(
          read(),
          Tree.PrimitiveExpression("prototype"),
          null)),
      this.key,
      null),
    (
      // This is an optimization because this should always be non-null for constructor/method
      Base.fetchBinding(this.scope, SORT_KEY).function === "derived-constructor" ?
      Tree.ConditionalExpression(
        Base.makeLookupExpression(
          this.scope,
          "this",
          {
            __proto__: super_helper_callback_prototype,
            right: null}),
        _expression,
        Intrinsic.makeThrowReferenceErrorExpression(`Cannot access super property before calling super constructor`)) :
      _expression)); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

const super_call_callback_prototype = {
  on_miss () { return (
    Throw.assert(
      Base.fetchBinding(this.scope, ENCLAVE_KEY),
      null,
      `Missing super identifier (call)`),
    // N.B.: new.target is passed under the hood but if super is external so is new.target!
    Tree.__SuperCallEnclaveExpression__(this.arguments)); },
  on_static_dead_hit (variable) { return (
    Throw.abort(
      null,
      `Super identifier in deadzone (call)`)); },
  on_static_live_hit (variable, read, write) { return Tree.ConditionalExpression(
    Base.makeLookupExpression(
      this.scope,
      "this",
      {
        __proto__: super_helper_callback_prototype,
        right: null}),
    Intrinsic.makeThrowReferenceErrorExpression(`Super constructor may only be called once`),
    Tree.SequenceExpression(
      Base.makeLookupExpression(
        this.scope,
        "this",
        {
          __proto__: super_helper_callback_prototype,
          right: Intrinsic.makeConstructExpression(
            Intrinsic.makeGetExpression(
              read(),
              Tree.PrimitiveExpression("constructor"),
              null),
            this.arguments,
            Base.makeLookupExpression(
              this.scope,
              "new.target",
              {
                __proto__: super_helper_callback_prototype,
                right: null}))}),
      Base.makeLookupExpression(
        this.scope,
        "this",
        {
          __proto__: super_helper_callback_prototype,
          right: null}))); },
  on_dynamic_dead_hit: null,
  on_dynamic_live_hit: null};

exports.makeSuperMemberExpression = (scope, expression) => Base.makeLookupExpression(
  scope,
  "super",
  {
    __proto__: super_member_callback_prototype,
    scope,
    key: expression});

exports.makeSuperCallExpression = (scope, expression) => Base.makeLookupExpression(
  scope,
  "super",
  {
    __proto__: super_call_callback_prototype,
    scope,
    arguments: expression});
