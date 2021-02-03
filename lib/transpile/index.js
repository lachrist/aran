"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_JSON_parse = global.JSON.parse;

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const State = require("./state.js");
const Query = require("./query");
const Scope = require("./scope/index.js");
const Visit = require("./visit");

Visit.initializeProd();

const sources = {
  __proto__: null,
  "script": "script",
  "module": "module",
  "global-eval": "global-eval",
  "internal-local-eval": "local-eval",
  "external-local-eval": "local-eval"
};

State = {
  linker: (link) => undefined,
  globals: [{
    kind: "var" | "function" | "let" | "const" | "class",
    name: Identifier
  }]
};
Source = {
  type: "script",
  strict: false,
  enclave: boolean, // Are unbound variable allowed? Are enclave variable declaration allowed?
  locals: [],
  function: null
} | {
  type: "module",
  strict: true,
  enclave: boolean, // Are unbound variable allowed?
  locals: [],
  function: null
} | {
  type: "global-eval",
  strict: false,
  enclave: boolean, // Are unbound variable allowed? Are enclave loose variable declaration allowed?
  locals: [],
  function: null
} | {
  type: "local-eval",
  strict: boolean,
  enclave: true,
  locals: null,
  function: null | "function" | "method" | "constructor" | "derived-constructor" | "enclave-function" | "enclave-method" | "enclave-constructor" | "enclave-derived-constructor",
} | {
  type: "local-eval",
  strict: boolean,
  enclave: false,
  locals: [Identifier],
  function: null | "function" | "method" | "constructor" | "derived-constructor"
}

// interface Options = {
//   source:
//     {
//       type: "script",
//       globals: null | [Variables] } |
//     {
//       type: "module",
//       globals: null | [Variables] } |
//     {
//       type: "global-eval",
//       globals: null | [Variables] } |
//     {
//       type: "internal-local-eval",
//       globals: null | [Variables],
//       serial: number } |
//     {
//       type: "external-local-eval",
//       strict: boolean,
//       closure: "program" | "function" | "method" | "constructor" | "derived-constructor" }
//   nodes: [estree.Node],
//   serials: Map(estree.Node -> Serial),
//   evals: {Serial -> {
//     context: {
//       sort: "function" | "arrow" | "method" | "constructor" | "derived-constructor" | "program"
//       strict: boolean
//     },
//     identifiers: [Identifier],
//     scope: Scope
//   }
// }


// interface Options = {
//   source:
//     {
//       type: "script",
//       globals: null | [Variables] } |
//     {
//       type: "module",
//       globals: null | [Variables] } |
//     {
//       type: "global-eval",
//       globals: null | [Variables] } |
//     {
//       type: "internal-local-eval",
//       globals: null | [Variables],
//       serial: number } |
//     {
//       type: "external-local-eval",
//       strict: boolean,
//       closure: "program" | "function" | "method" | "constructor" | "derived-constructor" }
//   nodes: [estree.Node],
//   serials: Map(estree.Node -> Serial),
//   evals: {Serial -> {
//     context: {
//       sort: "function" | "arrow" | "method" | "constructor" | "derived-constructor" | "program"
//       strict: boolean
//     },
//     identifiers: [Identifier],
//     scope: Scope
//   }
// }
module.exports = (node, options, _local, _scope) => (
  _scope = (
    options.source.type === "internal-local-eval" ?
    (
      Throw.assert(
        options.serial === null || global_Reflect_getOwnPropertyDescriptor(options.evals, options.serial) !== void 0,
        Throw.InvalidOptionsAranError,
        `For internal-local-eval sources, options.serial must refer to scope in options.evals `),
      options.evals[options.serial].scope) :
    (
      options.source.type === "external-local-eval" ?
      Scope.RootScope(
        {
          enclave: true,
          strict: options.source.strict,
          closure: options.source.closure}) :
      (
        options.source.globals === null ?
        Scope.RootScope(
          {
            enclave: true,
            strict: options.source.type === "module",
            closure: "program"}) :
        Scope.GlobalDynamicScope(
          Scope.RootScope(
            {
              enclave: false,
              strict: options.source.type === "module",
              closure: "program"}))))),
  _scope = (
    Query.hasUseStrictDirective(node.body) ?
    Scope.StrictBindingScope(_scope) :
    _scope),
  (
    Scope.isEnclave(scope) ?
    void 0 :
    (
      Throw.assert(
        (
          options.source !== "internal-local-eval" ||
          options.globals !== null),
        null,
        `Global variables must be provided for transpilling an internal-local-eval source nested inside a non-enclave program`),
      // console.assert(global.Array.isArray(options.source.globals))
      ArrayLite.forEach(
        ArrayLite.map(
          (
            options.source === "module" ?
            [] :
            (
              options.source === "script" ?
              ArrayLite.concat(
                ArrayLite.flatMap(node.body, Query.getDeepHoisting),
                ArrayLite.flatMap(node.body, Query.getShallowHoisting)) :
              // console.assert(options.source === "eval")
              (
                Scope.isStrict(_scope) ?
                [] :
                ArrayLite.flatMap(node.body, Query.getDeepHoisting)))),
          (variable1, _maybe_boolean) => (
            _maybe_boolean = Scope.isAvailable(_scope, variable1.kind, variable1.name),
            (
              _maybe_boolean === null ?
              Throw.assert(
                !ArrayLite.some(
                  options.globals,
                  (variable2) => (
                    variable1.name === variable2.name &&
                    (
                      (
                        variable1.kind !== "var" &&
                        variable1.kind !== "function") ||
                      (
                        variable2.kind !== "var" &&
                        variable2.kind !== "function")))),
                null,
                `Duplicate global variable named '${variable1.name}' of kind ${variable1.kind}`) :
              Throw.assert(
                _maybe_boolean,
                Throw.SyntaxError,
                `Duplicate local variable named '${variable1.name}' of kind ${variable1.kind}`)),
            variable1),
          (variable) => options.globals[options.globals.length] = {
            kind: variable1.kind,
            name: variable1.name})))),
  State.runSession(
    {
      evals: options.evals,
      serials: options.serials,
      nodes: options.nodes},
    () => Visit.visitProgram(
      _scope, 
      node,
      {
        source: sources[options.source.type]})));
