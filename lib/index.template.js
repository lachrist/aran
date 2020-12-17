"use strict";

const global_Map = global.Map;
const global_Reflect_apply = global.Reflect.apply;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Stratum = require("./stratum.js");
const Parse = require("./parse.js");
const Transpile = require("./transpile");
const Instrument = require("./instrument.js");
const Generate = require("./generate.js");

const undefined_primitive_matcher = ["primitive", void 0];
const array_of_intrinsic_matcher = ["intrinsic", "Array.of"];
const get_advice_matcher = [
  "apply",
  ["intrinsic", "Reflect.get"],
  ["primitive", void 0],
  [
    ["intrinsic", "aran.advice"],
    [
      "primitive",
      (context, primitive) => (
        typeof primitive === "string" &&
        global_Reflect_apply(
          global_RegExp_prototype_test,
          /^[a-z]+$/,
          [primitive]))]]];
const advice_matcher = ["intrinsic", "aran.advice"];
const get_advice_extractor = (context, node, expression1, expression2, expressions) => Tree._extract(
  null,
  expressions[1],
  "primitive",
  primitive_extractor);
const primitive_extractor = (context, node, primitive) => primitive;

const instrument_namespace = {
  __proto__: null,
  callee: "callee"};

const instrument_show = {
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
      Stratum._is_base(identifier) ?
      (
        Stratum._is_meta(
          Stratum._get_body(identifier)) ?
        (
          "#" + Stratum._get_body(
            Stratum._get_body(identifier))) :
        Stratum._get_body(
        Stratum._get_body(identifier))) :
      // console.assert(identifeir === "input")
      "@"))};

const generate_namespace = {
  callee: "CALLEE",
  intrinsic: "INTRINSIC",
  arguments: "ARGUMENTS",
  error: "ERROR",
  export: "EXPORT",
  import: "IMPORT"};

const generate_convert = (identifier) => identifier;

const generate_construct = (expression, expressions, result, results) => null;

const generate_apply = (expression1, expression2, expressions, result, nullable_result, results, _name) => (
  (
    Tree._match(expression1, array_of_intrinsic_matcher)
    Tree._match(expression2, undefined_primitive_matcher)) ?
  (
    typeof result === "string" ?
    `[${ArrayLite.join(results}]` :
    {
      type: "ArrayExpression",
      elements: results}) :
  (
    (
      Tree._match(expression1, get_advice_matcher),
      Tree._match(expression2, advice_matcher)) ?
    // console.assert(nullable_result !== null)
    (
      _name = Tree._extract(null, expression1, "apply", get_advice_extractor),
      (
        typeof result === "string" ?
        `(${nullable_result}.${_name)}(${ArrayLite.join(_results, ",")}))` :
        {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: nullable_result,
            property: {
              type: "Identifier",
              name: _name}},
          arguments: results})) :
    null));

const prototype = {
  parse (code, options) { return Parse(
    code,
    global_Object_assign(
      {
        __proto__: null,
        source: "script",
        context: null,
        serial: null,
        parser: this.parser,
        scopes: this.scopes,
        parserOptions: null},
      options)); },
  transpile (estree, options) { return Transpile(
    estree,
    global_Object_assign(
      {
        __proto__: null,
        source: "script",
        serial: null,
        globals: this.globals,
        serials: new global_Map(),
        nodes: this.nodes,
        scopes: this.scopes},
      options)); },
  instrument (program, options) { return Instrument(
    program,
    global_Object_assign(
      {
        __proto__: null,
        source: "script",
        pointcut: false,
        serials: new global_Map(),
        namespace: instrument_namespace,
        show: instrument_show},
      options)); },
  generate (program, options) { return Generate(
    program,
    global_Object_assign(
      {
        __proto__: null,
        source: "script",
        output: "code",
        newline: "\n",
        indent: "  ",
        intrinsic: this.intrinsic,
        namespace: generate_namespace,
        convert: generate_convert,
        construct: generate_construct,
        apply: generate_apply},
      options)); },
  weave (input, options, _serials) { return (
    _serials = new global_Map(),
    this.generate(
      this.instrument(
        this.transpile(
          (
            typeof input === "string" ?
            this.parse(input, options) :
            input),
          global_Object_assign(
            {
              __proto__: null,
              serials: _serials},
            options)),
        global_Object_assign(
          {
            __proto__: null,
            serials: _serials},
          options)),
      options)); },
  intrinsic: {
    __proto__: null,
    names: __INTRINSIC_NAMES__,
    object: __INTRINSIC_OBJECT__,
    script: __INTRINSIC_SCRIPT__,
    estree: __INTRINSIC_ESTREE__},
  unary: {
    __proto__: null,
    operators: __UNARY_OPERATORS__,
    closure: __UNARY_CLOSURE__,
    script: __UNARY_SCRIPT__,
    estree: __UNARY_ESTREE__},
  binary: {
    __proto__: null,
    operators: __BINARY_OPERATORS__,
    closure: __BINARY_CLOSURE__,
    script: __BINARY_SCRIPT__,
    estree: __BINARY_ESTREE__},
  object: {
      __proto__: null,
      closure: __OBJECT_CLOSURE__,
      script: __OBJECT_SCRIPT__,
      estree: __OBJECT_ESTREE__}};

module.exports = function Aran (options) { return global_Object_assign(
  {
    __proto__: prototype,
    parser: null,
    intrinsic: "__aran_intrinsic__",
    globals: [],
    scopes: {},
    nodes: []},
  options); };
