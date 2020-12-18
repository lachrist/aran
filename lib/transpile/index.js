"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_JSON_parse = global.JSON.parse;

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const State = require("./state.js");
const Query = require("./query");
const Scope = require("./scope/index.js");
const Visit = require("./visit");

Visit._prod_init();

// interface Options = {
//   source: "script" | "module" | "eval",
//   scope: null | Scope,
//   serial: null | Serial,
//   globals: [Variable],
//   nodes: [estree.Node],
//   serials: Map(estree.Node -> Serial),
//   scopes: {Serial -> Scope}
// }
module.exports = (node, options, _local, _scope) => (
  _local = (
    options.source === "eval" &&
    (
      options.scope !== null ||
      options.serial !== null)),
  _scope = (
    _local ?
    (
      options.scope !== null ?
      options.scope :
      (
        Throw.assert(
          global_Reflect_getOwnPropertyDescriptor(options.scopes, options.serial) !== void 0,
          Throw.InvalidOptionsAranError,
          `In eval mode, options.serial must refer to scope in options.scopes when provided`),
        global_JSON_parse(options.scopes[options.serial].stringified))) :
    Scope._extend_dynamic_global(
      Scope._make_root(options.source === "module"))),
  _scope = (
    Query._has_use_strict_directive(node.body) ?
    Scope._use_strict(_scope) :
    _scope),
  ArrayLite.forEach(
    (
      options.source === "module" ?
      [] :
      (
        options.source === "script" ?
        ArrayLite.concat(
          ArrayLite.flatMap(node.body, Query._get_deep_hoisting),
          ArrayLite.flatMap(node.body, Query._get_shallow_hoisting)) :
        // console.assert(options.source === "eval")
        (
          Scope._is_strict(_scope) ?
          [] :
          ArrayLite.flatMap(node.body, Query._get_deep_hoisting)))),
    (variable1, _maybe_boolean) => (
      _maybe_boolean = Scope._is_available(_scope, variable1.kind, variable1.name),
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
  State._run_session(
    {
      scopes: options.scopes,
      serials: options.serials,
      nodes: options.nodes},
    () => Visit._program(
      _scope,
      node,
      {
        source: options.source,
        local: _local})));
