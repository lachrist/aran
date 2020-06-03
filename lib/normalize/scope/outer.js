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
const Stratum = require("./stratum.js");

const global_Object_assign = global.Object.assign;

global_Object_assign(exports, Inner);

delete exports._is_writable;
exports._is_writable_base = (scope, identifier) => Inner._get_tag(scope, Stratum._base(identifier));
exports._is_writable_meta = (scope, identifier) => Inner._get_tag(scope, Stratum._meta(identifier));

delete exports._declare;
exports._declare_base = (scope, identifier, writable) => Inner._declare(scope, Stratum._base(identifier), writable);
exports._declare_meta = (scope, identifier, writable) => {
  let counter = 1;
  const depth = Inner._get_depth(scope);
  if (identifier === "new.target") {
    identifier = "new_target";
  }
  identifier += "_" + depth + "_";
  while (Inner._is_declared(scope, Stratum._meta(identifier + counter))) {
    counter++;
  }
  identifier += counter;
  Inner._declare(scope, Stratum._meta(identifier), writable);
  return identifier;
};

delete exports.initialize;
exports.initialize_base = (scope, identifier, expression) => Inner.initialize(scope, Stratum._base(identifier), expression);
exports.initialize_meta = (scope, identifier, expression) => Inner.initialize(scope, Stratum._meta(identifier), expression);

delete exports.lookup;
exports.lookup_base = (scope, identifier, base_context, callbacks) => Inner.lookup(scope, Stratum._base(identifier), base_context, callbacks);
exports.lookup_meta = (scope, identifier, meta_context, callbacks) => Inner.lookup(scope, Stratum._meta(identifier), meta_context, callbacks);
