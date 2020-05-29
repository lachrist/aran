
"use strict";

const ArrayLite = require("array-lite");
const Inner = require("./inner.js");
const Stratum = require("./stratum.js");

ArrayLite.forEach([
  "_extend_closure",
  "_extend_use_strict",
  "_extend_dynamic",
  "EXTEND_STATIC",
  "_is_strict",
  "_get_dynamic_frame",
  "parameter",
  "eval",
  "_deserialize"
], (key) => {
  exports[key] = Inner[key];
});

exports._is_writable_base = (scope, identifier) => Inner._get_tag(scope, Stratum._base(identifier));
exports._is_writable_meta = (scope, identifier) => Inner._get_tag(scope, Stratum._meta(identifier));

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

exports.initialize_base = (scope, identifier, aran_expression) => Inner.initialize(scope, Stratum._base(identifier), aran_expression);
exports.initialize_meta = (scope, identifier, aran_expression) => Inner.initialize(scope, Stratum._meta(identifier), aran_expression);

exports.lookup_base = (scope, identifier, context, callbacks) => Inner.lookup(scope, Stratum._base(identifier), context, callbacks);
exports.lookup_meta = (scope, identifier, context, callbacks) => Inner.lookup(scope, Stratum._meta(identifier), context, callbacks);
