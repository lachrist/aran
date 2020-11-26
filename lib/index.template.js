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
const ParseEval = require("./parse-eval.js");
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

const abort = (message) => { throw new global_Error(message) };

// type Mode = GlobalEval | LocalEval | Script
// type GlobalEval = {mode:"global-eval"}
// type LocaEval = {mode:"local-eval", serial:Natural}
// type Script = {mode:"script"}

const weave = (aran, source, estree, pointcut, _serials) => { return (
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
            abort("The pointcut must be either an array, a closure, a boolean, or an object")))))),
  _serials = new global_Map(),
  Generate(
    Instrument(
      Normalize(
        estree,
        source,
        {
          __proto__: null,
          nodes: this.nodes,
          scopes: this.scopes,
          serials: _serials}),
      source,
      {
        __proto__: null,
        show: show,
        serials: _serials,
        pointcut: pointcut,
        namespace: make_instrument_namespace()}),
    source,
    {
      __proto__: null,
      convert: convert,
      apply: apply,
      construct: construct,
      namespace: make_generate_namespace()}))};

// const weave = (estree, pointcut,) => function weave (estree, pointcut, context, _nullable_scope, _serials, _closure) { return (
//   context = (
//     context === null || context === void 0 ?
//     {__proto__:null, mode:"script"} :
//     (
//       typeof context === "string" ?
//       {__proto__: null, mode:context} :
//       (
//         typeof context === "number" ?
//         {__proto__: null, mode:"local-eval", serial:context} :
//         (
//           typeof context === "object" && context !== null ?
//           context :
//           abort("The context should either be null/undefined (for 'script' mode), a string (for 'script' mode or 'global-eval' mode), a number (for 'local-eval' mode), or an object"))))),
//   (
//     (
//       context.mode !== "script" &&
//       context.mode !== "global-eval" &&
//       context.mode !== "local-eval") ?
//     abort("The mode should either be 'script', 'global-eval', or 'local-eval'") :
//     null),
//   (
//     context.mode === "local-eval" ?
//     (
//       typeof context.serial !== "number" ?
//       abort("In 'local-eval' mode, the serial should be a number") :
//       (
//         context.serial !== context.serial ?
//         abort("In 'local-eval' mode, the serial should not be NaN") :
//         (
//           global_Math_round(context.serial) !== context.serial ?
//           abort("In 'local-eval' mode, the serial should be an integer") :
//           (
//             context.serial < 0 ?
//             abort("In 'local-eval' mode, the serial should be a positive integer") :
//             (
//               !global_Reflect_getOwnPropertyDescriptor(this.scopes, context.serial) ?
//               abort("In 'local-eval' mode, the serial should refer to a node representing a direct eval call") :
//               null))))) :
//     null),
//   pointcut = (
//     global_Array_isArray(pointcut) ?
//     ArrayLite.reduce(
//       pointcut,
//       (object, name) => (
//         object[name] = true,
//         object),
//       {__proto__:null}) :
//     (
//       typeof pointcut === "function" ?
//       (
//         _closure = pointcut,
//         ArrayLite.reduce(
//           trap_name_array,
//           (object, name) => (
//             object[name] = (...args) => _closure(name, args),
//             object),
//           {__proto__:null})) :
//       (
//         pointcut === false ?
//         {__proto__:null} :
//         (
//           pointcut === true ?
//           ArrayLite.reduce(
//             trap_name_array,
//             (object, name) => (
//               object[name] = true,
//               object),
//             {__proto__:null}) :
//           (
//             (
//               typeof pointcut === "object" &&
//               pointcut !== null) ?
//             pointcut :
//             abort("The pointcut must be either an array, a closure, a boolean, or an object")))))),
//   _serials = new global_Map(),
//   Generate(
//     Instrument(
//       Normalize(
//         estree,
//         context,
//         {
//           __proto__: null,
//           nodes: this.nodes,
//           scopes: this.scopes,
//           serials: _serials}),
//       context,
//       {
//         __proto__: null,
//         show: show,
//         serials: _serials,
//         pointcut: pointcut,
//         namespace: make_instrument_namespace()}),
//     context,
//     {
//       __proto__: null,
//       convert: convert,
//       apply: apply,
//       construct: construct,
//       namespace: make_generate_namespace()}))};

const module_source = {
  mode: "module",
  serial: null};

global_Reflect_defineProperty(
  prototype,
  "module",
  {
    __proto__: null,
    value: function module (estree, pointcut) => {
      return weave(this, module_source, estree, pointcut) },
    writable: false,
    enumerable: false,
    configurable: true});

const script_source = {
  mode: "script",
  serial: null};

global_Reflect_defineProperty(
  prototype,
  "script",
  {
    __proto__ : null,
    value: function script (estree, pointcut) => {
      return weave(this, script_source, estree, pointcut) },
    writable: false,
    enumerable: false,
    configurable: true});

const eval_source = {
  mode: "eval",
  serial: null};

global_Reflect_defineProperty(
  prototype,
  "eval",
  {
    __proto__ : null,
    // type Input = Either String estree.Program
    // type Pointcut
    // type Serial = Maybe Number
    // type Parse = Maybe (String -> estree.Program)
    value: function (input, pointcut, serial, parse, _source, _scope, _sort) => { return (
      _source = (
        (
          (serial === void 0) ||
          (serial === null)) ?
        eval_source :
        {
          __proto__: eval_source,
          serial: serial}),
      (
        (_source.serial === null) ?
        null :
        (
          (typeof _source.serial !== "number") ?
          abort("In 'local-eval' mode, the serial should be a number") :
          (
            (_source.serial !== _source.serial) ?
            abort("In 'local-eval' mode, the serial should not be NaN") :
            (
              global_Math_round(_source.serial) !== _source.serial ?
              abort("In 'local-eval' mode, the serial should be an integer") :
              (
                (_source.serial < 0) ?
                abort("In 'local-eval' mode, the serial should be a positive integer") :
                (
                  global_Reflect_getOwnPropertyDescriptor(this.scopes, _source.serial) === void 0 ?
                  abort("In 'local-eval' mode, the serial should refer to a node representing a direct eval call") :
                  null)))))),
      weave(
        this,
        _source,
        (
          (typeof input === "string") ?
          (
            (
              (parse === void 0) ||
              (parse === null)) ?
            abort("aran.eval(input, pointcut, serial, [parse]): if input is a string then parse must be defined") :
            (
              _source.serial === null ?
              parse(code) :
              (
                _scope = this.scopes[_source.serial],
                _sort = Normalize._get_sort(this.scopes[_source.serial]),
                ParseEval(
                  code,
                  (
                    (
                      (
                        (_sort === "program") ||
                        (_sort === "arrow")) &&
                        Normalize._has_newtarget(_scope)) ?
                    "function" :
                    _sort),
                  {
                    __proto__: null,
                    strict: Normalize._is_strict(_scope),
                    derived: Normalize._has_super(_scope)})))) :
          input),
        pointcut)); },
    writable: false,
    enumerable: false,
    configurable: true});

global_Reflect_defineProperty(
  prototype.eval,
  "name",
  {
    value: "eval",
    writable: false,
    enumerable: false,
    configurable: true});

module.exports = function Aran (json) { return {
  __proto__: prototype,
  scopes: json ? json.scopes : {},
  nodes: json ? json.nodes : []};};
