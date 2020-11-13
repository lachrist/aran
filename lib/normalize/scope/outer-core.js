"use strict";

// type Writable = Boolean
// type Tag = Writable
// type Expression = lang.Expression
// type Identifier = normalize.scope.stratum.Identifier
// type Scope = normalize.scope.inner.Scope
// type BaseContext = normalize.scope.base.Context
// type MetaContext = normalize.scope.meta.Context
// type Depth = Number
// type Counter = Number

const global_String = global.String;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const InnerCore = require("./inner-core.js");
const Stratum = require("../../stratum.js");

const BASE_VAR_KIND = "var";
const BASE_FUNCTION_KIND = "function";
const BASE_LET_KIND = "let";
const BASE_CONST_KIND = "const";
const BASE_CLASS_KIND = "class";

const META_LET_KIND = "meta-let";
const META_CONST_KIND = "meta-const";

////////////
// Intact //
////////////

exports.EXTEND_STATIC = InnerCore.EXTEND_STATIC;
exports.EXTEND_EMPTY = InnerCore.EXTEN_EMPTY;
exports._extend_dynamic = InnerCore._extend_dynamic;
exports._extend_binding = InnerCore._extend_binding;
exports._extend_closure = InnerCore._extend_closure;
exports._extend_horizon = InnerCore._extend_horizon;

exports._get_background = InnerCore._get_background;
exports._make_root = InnerCore._make_root;
exports._get_binding = InnerCore._get_binding;
exports.parameter = InnerCore.parameter;
exports.eval = InnerCore.eval;

///////////
// Split //
///////////

exports._get_foreground_base = (scope) => ArrayLite.map(
  ArrayLite.filter(
    InnerCore._get_foreground(scope),
    Stratum._is_base),
  Stratum._get_body);

exports._declare_base = (scope, identifier, base_tag) => {
  const success = InnerCore._declare(scope, Stratum._base(identifier), base_tag);
  if (success === true) {
    return null;
  }
  if (success === false) {
    throw new global_Error("Duplicate base variable declaration");
  }
  return success;
};
 exports._declare_meta = (scope, identifier, meta_tag, callback) => {
  if (identifier === "new.target") {
    identifier = "new_target";
  }
  identifier += "_" + global_String(InnerCore._get_depth(scope)) + "_";
  let counter = 0;
  let success = false;
  while (!success) {
    counter++;
    success = InnerCore._declare(scope, Stratum._meta(identifier + global_String(counter)), meta_tag);
    if (typeof success !== "boolean") {
      throw new global_Error("Cannot declare meta variable on dynamic frame");
    }
  }
  return identifier + global_String(counter);
};

exports.initialize_base = (scope, identifier, expression, callback) => InnerCore.initialize(
  scope,
  Stratum._base(identifier),
  expression,
  callback);
const initialize_meta_callback = () => { throw new global_Error("Cannot initialize meta variable on dynamic frame") };
exports.initialize_meta = (scope, identifier, expression) => InnerCore.initialize(
  scope,
  Stratum._meta(identifier),
  expression,
  initialize_meta_callback);

exports.lookup_base = (scope, identifier, base_context, callbacks) => InnerCore.lookup(
  scope,
  Stratum._base(identifier),
  base_context,
  callbacks);
exports.lookup_meta = (scope, identifier, meta_context, callbacks) => InnerCore.lookup(
  scope,
  Stratum._meta(identifier),
  meta_context,
  callbacks);
