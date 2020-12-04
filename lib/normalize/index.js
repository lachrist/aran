"use strict";

const State = require("./state.js");
const Scope = require("./scope/index.js");
const Visit = require("./visit");

Visit._init_prod();

// interface Context = {
//   source: "script" | "module" | "eval",
//   global_variable_array: [Variable],
//   state: {
//     nodes: [estree.Node],
//     serials: WeakMap(estree.Node -> Serial),
//     scopes: {Serial -> Scope}
//   }
// }
module.exports = (scope, node, context) => (
  scope = (
    scope === null ?
    Scope._make_root() :
    scope),
  scope = (
    (
      context.source === "module" ||
      Query._has_use_strict_directive(node.body)) ?
    Scope._use_strict(scope) :
    scope),
  _variables = (
    context.source === "module" ?
    [] :
    (
      context.source === "script" ?
      ArrayLite.concat(
        Query._get_closure_hoisting(node.body),
        Query._get_block_hoisting(node.body)) :
      // console.assert(context.source === "local-eval" || context.source === "global-eval")
      (
        Scope._is_strict(scope) ?
        [] :
        Query._get_closure_hoisting(node.body)))),
  ArrayLite.forEach(
    _variables,
    (variable1, _available) => (
      _available = Scope._is_available(scope, variable1.kind, variable1.name),
      (
        _available === true ||
        (
          _available === false ?
          Throw.abort(
            Throw.SyntaxError,
            `Duplicate local variable of kind ${variable1.kind} name ${variable1.name}`) :
          // console.assert(_available === null)
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
              `Duplicate global variable of kind ${variable1.kind} name ${variable1.name}`) :
            context.global_variable_array[context.global_variable_array.length] = variable1))))),
  State._run_session(
    state,
    () => Visit.PROGRAM(scope, node, {source:context.source})));
