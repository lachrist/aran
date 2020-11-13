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

const deadcode = () => { throw new global_Error("This should never happen") };

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

exports._declare_base = (scope, base_kind, identifier) => Inner._declare(
  scope,
  base_kind,
  Stratum._base(identifier));
exports._declare_meta = (scope, writable, identifier, callback) => {
  if (identifier === "new.target") {
    identifier = "new_target";
  }
  identifier += "_" + global_String(Inner._get_depth(scope)) + "_";
  let counter = 0;
  const meta_kind = writable ? META_LET_KIND : META_CONST_KIND;
  while (!Scope._is_available_static(scope, meta_kind, Stratum._meta(identifier + global_String(counter)))) {
    counter++;
  }
  identifier = identifier + global_String(counter);
  Inner.declare(scope, meta_kind, Stratum._meta(identifier); // console.assert(* === null)
  return identifier
};

exports.initialize_base = (scope, base_kind, identifier, expression, callback) => Inner.initialize(
  scope,
  base_kind,
  Stratum._base(identifier),
  expression,
  callback);
exports.initialize_meta = (scope, writable, identifier, expression) => Inner.initialize(
  scope,
  writable ? META_LET_KIND : META_CONST_KIND,
  Stratum._meta(identifier),
  expression,
  deadcode);

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
