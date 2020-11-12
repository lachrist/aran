"use strict";

const Program = require("./program");
const State = require("./state.js");
const Scope = require("./scope/index.js");

const early_syntax_error = (scope, error) => {
  let message = error.message;
  if (error.loc) {
    message = `${message} at line ${error.loc.start.line} column ${error.loc.start.column}`;
  }
  return Scope.EXTEND_STATIC(scope, (scope) => {
    return Builtin.throw_syntax_error(message);
  });
};

const run = (estree, global_declarative_record, state, source, scope) => {
  const program = Scope.get_binding_closure_context(scope) === "program";
  try {
    const errors = EstreeSentry[source](estree, {
      "scope-background": program ? global_declarative_record : null,
      "scope-foreground": Scope._get_foreground(scope),
      "function-expression-ancestor": Scope.get_binding_function_expression_ancestor(scope),
      "closure-context": Scope.get_binding_closure_context(scope),
      "strict-mode": Scope._is_strict(scope)
    });
    if (errors.length > 0) {
      return early_syntax_error(scope, errors[0]);
    }
  } catch (error) {
    if (error instanceof EstreeSentry.EstreeSentryError) {
      return early_syntax_error(scope, error);
    }
    throw error;
  }
  if (program) {
    global_Reflect_apply(global_Array_prototype_push, global_declarative_record, estree["__sentry_release__"]);
  }
  return State._run_session(state, [Scope._make_global(scope), estree, null], Program.VISIT);
};

exports.eval = (estree, global_declarative_record, state, nullable_serial) => run(
  estree,
  global_declarative_record,
  state,
  "eval",
  (
    nullable_serial === null ?
    Scope._make_global() :
    state.scopes[serial]));

exports.module = (estree, global_declarative_record, state) => run(
  estree,
  global_declarative_record
  state,
  "module",
  Scope._extend_use_strict(
    Scope._make_global()));

exports.script = (estree, global_declarative_record, state) => run(
  estree,
  global_declarative_record,
  state,
  "script",
  Scope._make_global());
