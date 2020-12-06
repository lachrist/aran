"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const State = require("./state.js");
const Query = require("./query");
const Scope = require("./scope/index.js");
const Visit = require("./visit");

Visit._prod_init();

// interface Context = {
//   source: "script" | "module" | "eval",
//   scope: Scope
//   global_variable_array: [Variable],
//   state: {
//     nodes: [estree.Node],
//     serials: Map(estree.Node -> Serial),
//     scopes: {Serial -> Scope}
//   }
// }
module.exports = (node, context, _scope) => (
  _scope = (
    context.scope === null ?
    Scope._make_root() :
    context.scope),
  _scope = (
    (
      context.source === "module" ||
      Query._has_use_strict_directive(node.body)) ?
    Scope._use_strict(_scope) :
    _scope),
  _scope = (
    context.scope === null ?
    Scope._extend_dynamic_global(_scope) :
    _scope),
  ArrayLite.forEach(
    (
      context.source === "module" ?
      [] :
      (
        context.source === "script" ?
        ArrayLite.concat(
          Query._get_closure_hoisting(node.body),
          Query._get_block_hoisting(node.body)) :
        (
          Scope._is_strict(_scope) ?
          [] :
          Query._get_closure_hoisting(node.body)))),
    (variable1, _maybe_boolean) => (
      _maybe_boolean = Scope._is_available(_scope, variable1.kind, variable1.name),
      (
        _maybe_boolean === null ?
        (
          ArrayLite.some(
            context.global_variable_array,
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
          (
            context.global_variable_array[context.global_variable_array.length] = variable1,
            void 0)) :
        (
          _maybe_boolean ?
          void 0 :
          Throw.abort(
            Throw.SyntaxError,
            `Duplicate local variable named '${variable1.name}' of kind ${variable1.kind}`))))),
  State._run_session(
    context.state,
    () => Visit.PROGRAM(
      _scope,
      node,
      {source:context.source})));
