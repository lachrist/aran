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

// interface Options = {
//   source: "script" | "module" | "eval",
//   enclave: boolean,
//   serial: null | Serial,
//   globals: [Variable],
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
  Throw.assert(
    options.serial === null || options.source === "eval",
    null,
    `Only eval source can be local`),
  Throw.assert(
    options.serial === null || !options.enclave,
    null,
    `Enclave cannot be local`),
  Throw.assert(
    options.serial === null || global_Reflect_getOwnPropertyDescriptor(options.evals, options.serial) !== void 0,
    Throw.InvalidOptionsAranError,
    `In eval mode, options.serial must refer to scope in options.evals when provided`),
  _scope = (
    options.serial === null ?
    (
      (
        (scope) => (
          options.enclave ?
          scope :
          Scope.GlobalDynamicScope(scope)))
      (
        Scope.RootScope(
          {
            strict: (
              options.source === "module" ||
              Query.hasUseStrictDirective(node.body)),
            enclave: options.enclave}))) :
    (
      (
        (scope) => (
          Query.hasUseStrictDirective(node.body) ?
          Scope.StrictBindingScope(scope) :
          scope))
      (
        options.evals[options.serial].scope))),
  ArrayLite.forEach(
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
        (
          ArrayLite.some(
            options.globals,
            (variable2) => (
              variable1.name === variable2.name &&
              (
                (
                  variable1.kind !== "var" &&
                  variable1.kind !== "function") ||
                (
                  variable2.kind !== "var" &&
                  variable2.kind !== "function")))) ?
          Throw.abort(
            Throw.SyntaxError,
            `Duplicate global variable named '${variable1.name}' of kind ${variable1.kind}`) :
          // console.assert(!variable1.ghost && variable1.exports.length === 0)
          (
            options.globals[options.globals.length] = {
              kind: variable1.kind,
              name: variable1.name},
            void 0)) :
        (
          _maybe_boolean ?
          void 0 :
          Throw.abort(
            Throw.SyntaxError,
            `Duplicate local variable named '${variable1.name}' of kind ${variable1.kind}`))))),
  State.runSession(
    {
      evals: options.evals,
      serials: options.serials,
      nodes: options.nodes},
    () => Visit.visitProgram(
      _scope, 
      node,
      {
        source: (
          options.source === "eval" ?
          (
            options.serial === null ?
            null :
            options.evals[options.serial].identifiers) :
          options.source)})));
