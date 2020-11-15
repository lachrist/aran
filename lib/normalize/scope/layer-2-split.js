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

const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Core = require("./layer-1-core.js");
const Stratum = require("../../stratum.js");

const BASE_VAR_KIND = "var";
const BASE_FUNCTION_KIND = "function";
const BASE_LET_KIND = "let";
const BASE_CONST_KIND = "const";
const BASE_CLASS_KIND = "class";

const META_LET_KIND = "meta-let";
const META_CONST_KIND = "meta-const";

const abort = (message) => { throw new global_Error(message) };

////////////
// Intact //
////////////

global_Object_assign(exports, Core);

delete exports._get_foreground;
delete exports._declare;
delete exports._initialize;
delete exports.lookup;
delete exports._get_tag;

///////////
// Split //
///////////

exports._is_writable_base = (scope, identifier) => Core._get_tag(scope, Stratum._base(identifier));
exports._is_writable_meta = (scope, identifier) => Core._get_tag(scope, Stratum._meta(identifier));

exports._get_foreground_base = (scope) => ArrayLite.map(
  ArrayLite.filter(
    Core._get_foreground(scope),
    Stratum._is_base),
  Stratum._get_body);

exports._declare_base = (scope, identifier, writable) => {
  const success = Core._declare(scope, Stratum._base(identifier), writable);
  if (success === true) {
    return null;
  }
  if (success === false) {
    throw new global_Error("Duplicate base variable declaration");
  }
  return success;
};
 exports._declare_meta = (scope, identifier, writable, callback) => {
  if (identifier === "new.target") {
    identifier = "new_target";
  }
  identifier += "_" + global_String(Core._get_depth(scope)) + "_";
  let counter = 0;
  let success = false;
  while (!success) {
    counter++;
    success = Core._declare(scope, Stratum._meta(identifier + global_String(counter)), writable);
    if (typeof success !== "boolean") {
      throw new global_Error("Cannot declare meta variable on dynamic frame");
    }
  }
  return identifier + global_String(counter);
};

exports._initialize_base = (scope, identifier, expression) => Core._initialize(
  scope,
  Stratum._base(identifier),
  expression);
exports.initialize_meta = (scope, identifier, expression, _result) => (
  _result = Core._initialize(
    scope,
    Stratum._meta(identifier),
    expression),
  (
    _result.done ?
    _result.value :
    abort("Cannot initialize meta variable on dynamic frame")));

exports.lookup_base = (scope, identifier, base_context, callbacks) => Core.lookup(
  scope,
  Stratum._base(identifier),
  base_context,
  callbacks);
exports.lookup_meta = (scope, identifier, meta_context, callbacks) => Core.lookup(
  scope,
  Stratum._meta(identifier),
  meta_context,
  callbacks);
