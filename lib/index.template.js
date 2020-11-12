"use strict";

const global_Object_is = global.Object.is;
const global_Array_isArray = global.Array.isArray;
const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Error = global.Error;
const global_Map = global.Map;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_split = global.String.prototype.split;
const global_Array_prototype_join = global.Array.prototype.join;
const global_Object_assign = global.Object.assign;
const global_Math_round = global.Math.round;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;

const ArrayLite = require("array-lite");
const EstreeSentry = require("estree-sentry");
const Tree = require("./tree.js");
const Stratum = require("./stratum.js");
const Normalize = require("./normalize");
const Instrument = require("./instrument.js");
const Generate = require("./generate.js");

const show = {
  __proto__: null,
  label: Stratum._get_body, // console.assert(Stratum._is_base(label))
  identifier: (identifier) => (
    Stratum._is_meta(identifier) ?
    (
      // console.assert(Stratum._is_base(Stratum._get_body(identifier)))
      "%" +
      Stratum._get_body(
        Stratum._get_body(identifier))) :
    (
      Stratum._is_meta(
        Stratum._get_body(identifier)) ?
      (
        "#" + Stratum._get_body(
          Stratum._get_body(identifier))) :
      Stratum._get_body(
      Stratum._get_body(identifier))))};

const make_counter_identifier = (identifier, _counter) => (
  _counter = 0,
  () => identifier + (++_counter));

const make_instrument_namespace = () => ({
  __proto__: null,
  callee: make_counter_identifier("callee"),
  advice: "advice",
  parameters: "parameters"});

const make_generate_namespace = () => ({
  __proto__: null,
  callee: make_counter_identifier("CALLEE"),
  apply: "APPLY",
  builtin: "BUILTIN"});

const parameters = {
  __proto__: null,
  "error": "ERROR",
  "this": "THIS",
  "callee": "CALLEE",
  "arguments": "ARGUMENTS",
  "new.target": "NEW_TARGET"};

const convert = (identifier) => (
  identifier in parameters ?
  parameters[identifier] :
  identifier);

const make_const = (value) => () => value;

const null_const = make_const(null);
const false_const = make_const(false);
const null_expression_callback_object = {__proto__:null};
const false_expression_callback_object = {__proto__:null};
ArrayLite.forEach(
  [
    // Producer //
    "primitive",
    "builtin",
    "read",
    "arrow",
    "constructor",
    "function",
    "method",
    // Consumers //
    "eval",
    "write",
    "sequence",
    "conditional",
    "throw",
    // Combiners //
    "unary",
    "binary",
    "object",
    "construct",
    "apply"],
  (type) => {
    null_expression_callback_object[type] = null_const;
    false_expression_callback_object[type] = false_const});

const is_primitive_expression_callback_object = {
  __proto__: false_expression_callback_object,
  primitive: (context, node, primitive) => global_Object_is(context, primitive) };

const extract_builtin_name_expression_callback_object = {
  __proto__: null_expression_callback_object,
  builtin: (context, node, builtin) => builtin};

const extract_call_expression_callback_object = {
  __proto__: null_expression_callback_object,
  apply: (context, node, expression1, expression2, expressions) => ({
    __proto__: null,
    callee: expression1,
    this: expression2,
    arguments: expressions})};

const extract_read_identifier_expression_callback_object = {
  __proto__: null_expression_callback_object,
  read: (context, node, identifier) => identifier};

const apply = (visit, expression1, expression2, expressions, _call, _nullable_identifier) => (
  (
    (
      Tree._dispatch_expression(extract_builtin_name_expression_callback_object, null, expression1) ===
      "Array.of") &&
    Tree._dispatch_expression(is_primitive_expression_callback_object, void 0, expression2)) ?
  {
    type: "ArrayExpression",
    elements: ArrayLite.map(expressions, visit)} :
  (
    _call = Tree._dispatch_expression(extract_call_expression_callback_object, null, expression1),
    (
      (
        _call !== null &&
        (
          Tree._dispatch_expression(extract_builtin_name_expression_callback_object, null, _call.callee) ===
          "Reflect.get") &&
        Tree._dispatch_expression(is_primitive_expression_callback_object, void 0, _call.this) &&
        _call.arguments.length === 2 &&
        (
          Tree._dispatch_expression(extract_read_identifier_expression_callback_object, null, _call.arguments[0]) ===
          "advice") &&
        (
          Tree._dispatch_expression(extract_read_identifier_expression_callback_object, null, expression2) ===
          "advice")) ?
      {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Identifier",
            name: convert("advice")},
          property: visit(_call.arguments[1])},
        arguments: ArrayLite.map(expressions, visit)} :
      null)));

const construct = null_const;

const trap_name_array = [
  // Informers //
  "enter",
  "leave",
  "success",
  "break",
  "continue",
  "debugger",
  // Producers //
  "primitive",
  "builtin",
  "method",
  "closure",
  "read",
  // Consumers //
  "drop",
  "write",
  "failure",
  "test",
  "eval",
  // Combiners //
  "unary",
  "binary",
  "construct",
  "apply",
  "object"];

const prototype = {};

global_Reflect_defineProperty(
  prototype,
  "builtin",
  {
    __proto__: null,
    configurable: true,
    value: {
      __proto__: null,
      names: __BUILTIN_NAMES__,
      object: __BUILTIN_OBJECT__,
      script: __BUILTIN_SCRIPT__,
      estree: __BUILTIN_ESTREE__}});

global_Reflect_defineProperty(
  prototype,
  "unary",
  {
    __proto__: null,
    configurable: true,
    value: {
      __proto__: null,
      operators: __UNARY_OPERATORS__,
      closure: __UNARY_CLOSURE__,
      script: __UNARY_SCRIPT__,
      estree: __UNARY_ESTREE__}});

global_Reflect_defineProperty(
  prototype,
  "binary",
  {
    __proto__: null,
    configurable: true,
    value: {
      __proto__: null,
      operators: __BINARY_OPERATORS__,
      closure: __BINARY_CLOSURE__,
      script: __BINARY_SCRIPT__,
      estree: __BINARY_ESTREE__}});

global_Reflect_defineProperty(
  prototype,
  "object",
  {
    __proto__: null,
    configurable: true,
    value: {
      __proto__: null,
      closure: __OBJECT_CLOSURE__,
      script: __OBJECT_SCRIPT__,
      estree: __OBJECT_ESTREE__}});

const signal = (message) => { throw new global_Error(message) };

// type Mode = GlobalEval | LocalEval | Script
// type GlobalEval = {mode:"global-eval"}
// type LocaEval = {mode:"local-eval", serial:Natural}
// type Script = {mode:"script"}

// type Source = Either Maybe Serial
const weave = (estree, pointcut, source, options, aran) => {
  let failure = null;
  try {
    const errors = EstreeSentry[source](estree, options);
    if (errors.length > 0) {
      failure = errors[0]; } }
  catch (error) {
    if (error instanceof EstreeSentry.EstreeSentryError) {
      failure = error; }
    else {
      throw error; } }
  let node = (
    failure === null ?
    Normalize(
      estree,
      source,

      {
        __proto__: null,
        nodes: this.nodes,
        scopes: this.scopes,
        serials: _serials})
  if (failure !== null) {
    node = Build.BLOCK([], Build.Lift(Build.throw(Build.construct(Build.builtin("SyntaxError")))
  } else {
    node =
  }


  return (
  context = (
    context === null || context === void 0 ?
    {__proto__:null, mode:"script"} :
    (
      typeof context === "string" ?
      {__proto__: null, mode:context} :
      (
        typeof context === "number" ?
        {__proto__: null, mode:"local-eval", serial:context} :
        (
          typeof context === "object" && context !== null ?
          context :
          signal("The context should either be null/undefined (for 'script' mode), a string (for 'script' mode or 'global-eval' mode), a number (for 'local-eval' mode), or an object"))))),
  (
    (
      context.mode !== "script" &&
      context.mode !== "global-eval" &&
      context.mode !== "local-eval") ?
    signal("The mode should either be 'script', 'global-eval', or 'local-eval'") :
    null),
  (
    context.mode === "local-eval" ?
    (
      typeof context.serial !== "number" ?
      signal("In 'local-eval' mode, the serial should be a number") :
      (
        context.serial !== context.serial ?
        signal("In 'local-eval' mode, the serial should not be NaN") :
        (
          global_Math_round(context.serial) !== context.serial ?
          signal("In 'local-eval' mode, the serial should be an integer") :
          (
            context.serial < 0 ?
            signal("In 'local-eval' mode, the serial should be a positive integer") :
            (
              !global_Reflect_getOwnPropertyDescriptor(this.scopes, context.serial) ?
              signal("In 'local-eval' mode, the serial should refer to a node representing a direct eval call") :
              null))))) :
    null),
  pointcut = (
    global_Array_isArray(pointcut) ?
    ArrayLite.reduce(
      pointcut,
      (object, name) => (
        object[name] = true,
        object),
      {__proto__:null}) :
    (
      typeof pointcut === "function" ?
      (
        _closure = pointcut,
        ArrayLite.reduce(
          trap_name_array,
          (object, name) => (
            object[name] = (...args) => _closure(name, args),
            object),
          {__proto__:null})) :
      (
        pointcut === false ?
        {__proto__:null} :
        (
          pointcut === true ?
          ArrayLite.reduce(
            trap_name_array,
            (object, name) => (
              object[name] = true,
              object),
            {__proto__:null}) :
          (
            (
              typeof pointcut === "object" &&
              pointcut !== null) ?
            pointcut :
            signal("The pointcut must be either an array, a closure, a boolean, or an object")))))),
  _serials = new global_Map(),
  Generate(
    Instrument(
      Normalize(
        estree,
        context,
        {
          __proto__: null,
          nodes: this.nodes,
          scopes: this.scopes,
          serials: _serials}),
      context,
      {
        __proto__: null,
        show: show,
        serials: _serials,
        pointcut: pointcut,
        namespace: make_instrument_namespace()}),
    context,
    {
      __proto__: null,
      convert: convert,
      apply: apply,
      construct: construct,
      namespace: make_generate_namespace()}))};

const weave = (estree, pointcut,) => function weave (estree, pointcut, context, _nullable_scope, _serials, _closure) { return (
  context = (
    context === null || context === void 0 ?
    {__proto__:null, mode:"script"} :
    (
      typeof context === "string" ?
      {__proto__: null, mode:context} :
      (
        typeof context === "number" ?
        {__proto__: null, mode:"local-eval", serial:context} :
        (
          typeof context === "object" && context !== null ?
          context :
          signal("The context should either be null/undefined (for 'script' mode), a string (for 'script' mode or 'global-eval' mode), a number (for 'local-eval' mode), or an object"))))),
  (
    (
      context.mode !== "script" &&
      context.mode !== "global-eval" &&
      context.mode !== "local-eval") ?
    signal("The mode should either be 'script', 'global-eval', or 'local-eval'") :
    null),
  (
    context.mode === "local-eval" ?
    (
      typeof context.serial !== "number" ?
      signal("In 'local-eval' mode, the serial should be a number") :
      (
        context.serial !== context.serial ?
        signal("In 'local-eval' mode, the serial should not be NaN") :
        (
          global_Math_round(context.serial) !== context.serial ?
          signal("In 'local-eval' mode, the serial should be an integer") :
          (
            context.serial < 0 ?
            signal("In 'local-eval' mode, the serial should be a positive integer") :
            (
              !global_Reflect_getOwnPropertyDescriptor(this.scopes, context.serial) ?
              signal("In 'local-eval' mode, the serial should refer to a node representing a direct eval call") :
              null))))) :
    null),
  pointcut = (
    global_Array_isArray(pointcut) ?
    ArrayLite.reduce(
      pointcut,
      (object, name) => (
        object[name] = true,
        object),
      {__proto__:null}) :
    (
      typeof pointcut === "function" ?
      (
        _closure = pointcut,
        ArrayLite.reduce(
          trap_name_array,
          (object, name) => (
            object[name] = (...args) => _closure(name, args),
            object),
          {__proto__:null})) :
      (
        pointcut === false ?
        {__proto__:null} :
        (
          pointcut === true ?
          ArrayLite.reduce(
            trap_name_array,
            (object, name) => (
              object[name] = true,
              object),
            {__proto__:null}) :
          (
            (
              typeof pointcut === "object" &&
              pointcut !== null) ?
            pointcut :
            signal("The pointcut must be either an array, a closure, a boolean, or an object")))))),
  _serials = new global_Map(),
  Generate(
    Instrument(
      Normalize(
        estree,
        context,
        {
          __proto__: null,
          nodes: this.nodes,
          scopes: this.scopes,
          serials: _serials}),
      context,
      {
        __proto__: null,
        show: show,
        serials: _serials,
        pointcut: pointcut,
        namespace: make_instrument_namespace()}),
    context,
    {
      __proto__: null,
      convert: convert,
      apply: apply,
      construct: construct,
      namespace: make_generate_namespace()}))};

global_Reflect_defineProperty(
  prototype,
  "module",
  {
    __proto__: null,
    configurable: true,
    value: function module (estree, pointcut) => {

    }});

module.exports = function Aran (json) { return {
  __proto__: prototype,
  scopes: json ? json.scopes : {},
  nodes: json ? json.nodes : []};};
