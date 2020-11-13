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
const Inner = require("./inner.js");
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

exports.EXTEND_STATIC = Inner.EXTEND_STATIC;
exports.EXTEND_EMPTY = Inner.EXTEN_EMPTY;
exports._extend_dynamic = Inner._extend_dynamic;
exports._extend_binding = Inner._extend_binding;
exports._extend_closure = Inner._extend_closure;
exports._extend_horizon = Inner._extend_horizon;

exports._make_root = Inner._make_root;
exports._get_binding = Inner._get_binding;
exports.parameter = Inner.parameter;
exports.eval = Inner.eval;

///////////
// Split //
///////////

exports._get_background_base = Inner._get_background;
exports._get_foreground_base = (scope) => ArrayLite.map(
  ArrayLite.filter(
    Inner._get_foreground(scope),
    Stratum._is_base),
  Stratum._get_body);

exports._declare_base = (scope, identifier, base_tag) => Inner._declare(
  scope,
  Stratum._base(identifier),
  base_tag);
exports._declare_meta = (scope, identifier, meta_tag, callback) => {
  if (identifier === "new.target") {
    identifier = "new_target";
  }
  identifier += "_" + global_String(Inner._get_depth(scope)) + "_";
  let counter = 0;
  let success = false;
  while (!success) {
    counter++;
    success = Inner._declare(scope, Stratum._meta(identifier + global_String(counter)), meta_tag);
    if (typeof success !== "boolean") {
      throw new global_Error("Cannot declare meta variable on dynamic frame");
    }
  }
  return identifier + global_String(counter);
};

exports.initialize_base = (scope, identifier, expression, callback) => Inner.initialize(
  scope,
  Stratum._base(identifier),
  expression,
  callback);
const initialize_meta_callback = () => { throw new global_Error("Cannot initialize meta variable on dynamic frame") };
exports.initialize_meta = (scope, identifier, expression) => Inner.initialize(
  scope,
  Stratum._meta(identifier),
  expression,
  initialize_meta_callback);

exports.lookup_base = (scope, identifier, base_context, callbacks) => Inner.lookup(
  scope,
  Stratum._base(identifier),
  base_context,
  callbacks);
exports.lookup_meta = (scope, identifier, meta_context, callbacks) => Inner.lookup(
  scope,
  Stratum._meta(identifier),
  meta_context,
  callbacks);
