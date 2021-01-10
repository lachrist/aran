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

const ArrayLite = require("array-lite");
const Core = require("./layer-1-core.js");
const Identifier = require("../../identifier.js");

////////////
// Intact //
////////////

exports._make_root = Core._make_root;
exports._get_depth = Core._get_depth;
exports._extend_closure = Core._extend_closure;
exports._extend_binding = Core._extend_binding;
exports._fetch_binding = Core._fetch_binding;
exports.eval = Core.eval;
exports.input = Core.input;

///////////
// Split //
///////////

exports._extend_dynamic = (scope, kinds1, kinds2, dynamic_frame) => Core._extend_dynamic(
  scope,
  ArrayLite.concat(
    ArrayLite.map(kinds1, Identifier._base),
    ArrayLite.map(kinds2, Identifier._meta)),
  dynamic_frame);

exports.EXTEND_STATIC = (scope, labels, kinds1, kinds2, callback) => Core.EXTEND_STATIC(
  scope,
  labels,
  ArrayLite.concat(
    ArrayLite.map(kinds1, Identifier._base),
    ArrayLite.map(kinds2, Identifier._meta)),
  callback);

const is_available_callback_prototype = {
  static: function (variable) { return this.callbacks.static(
    cleanup_variable(variable)); }};
exports._is_available_base = (scope, kind, identifier, callbacks) => Core._is_available(
  scope,
  Identifier._base(kind),
  Identifier._base(identifier),
  {
    __proto__: is_available_callback_prototype,
    callbacks});
exports._is_available_meta = (scope, kind, identifier, callbacks) => Core._is_available(
  scope,
  Identifier._meta(kind),
  Identifier._meta(identifier),
  {
    __proto__: is_available_callback_prototype,
    callbacks});

exports._declare_base = (scope, variable, _result) => (
  _result = Core._declare(
    scope,
    global_Object_assign(
      {},
      variable,
      {
        kind: Identifier._base(variable.kind),
        name: Identifier._base(variable.name)})),
  (
    (
      _result.type === "static" &&
      _result.conflict !== null) ?
    {
      type: "static",
      conflict: cleanup_variable(_result.conflict)} :
    _result));
exports._declare_meta = (scope, variable, _result) => (
  _result = Core._declare(
    scope,
    global_Object_assign(
      {},
      variable,
      {
        kind: Identifier._meta(variable.kind),
        name: Identifier._meta(variable.name)})),
  (
    (
      _result.type === "static" &&
      _result.conflict !== null) ?
    {
      type: "static",
      conflict: cleanup_variable(_result.conflict)} :
    _result));

const cleanup_variable = (variable) => global_Object_assign(
  {},
  variable,
  {
    kind: Identifier._get_body(variable.kind),
    name: Identifier._get_body(variable.name)});

const cleanup_result = (result) => (
  result.type === "static" ?
  {
    type: "static",
    variable: cleanup_variable(result.variable),
    read: result.read,
    initialize: result.initialize} :
  result);

exports._initialize_base = (scope, kind, identifier, expression, maybe) => cleanup_result(
  Core._initialize(
    scope,
    Identifier._base(kind),
    Identifier._base(identifier),
    expression,
    maybe));
exports._initialize_meta = (scope, kind, identifier, expression, maybe) => cleanup_result(
  Core._initialize(
    scope,
    Identifier._meta(kind),
    Identifier._meta(identifier),
    expression,
    maybe));

const lookup_callback_prototype = {
  on_miss: function () { return this.callbacks.on_miss(); },
  on_static_live_hit: function (variable, read, write) { return this.callbacks.on_static_live_hit(
    cleanup_variable(variable),
    read,
    write); },
  on_static_dead_hit: function (variable) { return this.callbacks.on_static_dead_hit(
    cleanup_variable(variable)); },
  on_dynamic_frame: function (frame, expression) { return this.callbacks.on_dynamic_frame(frame, expression); }};
exports.lookup_base = (scope, identifier, callbacks) => Core.lookup(
  scope,
  Identifier._base(identifier),
  {
    __proto__: lookup_callback_prototype,
    callbacks});
exports.lookup_meta = (scope, identifier, callbacks) => Core.lookup(
  scope,
  Identifier._meta(identifier),
  {
    __proto__: lookup_callback_prototype,
    callbacks});
