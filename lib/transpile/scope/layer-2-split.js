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

exports.RootScope = Core.RootScope;
exports.getDepth = Core.getDepth;
exports.ClosureScope = Core.ClosureScope;
exports.BindingScope = Core.BindingScope;
exports.fetchBinding = Core.fetchBinding;
exports.makeEvalExpression = Core.makeEvalExpression;
exports.makeInputExpression = Core.makeInputExpression;

///////////
// Split //
///////////

exports.DynamicScope = (scope, kinds1, kinds2, dynamic_frame) => Core.DynamicScope(
  scope,
  ArrayLite.concat(
    ArrayLite.map(kinds1, Identifier.Base),
    ArrayLite.map(kinds2, Identifier.Meta)),
  dynamic_frame);

exports.makeBlock = (scope, kinds1, kinds2, callback1, callback2) => Core.makeBlock(
  scope,
  ArrayLite.concat(
    ArrayLite.map(kinds1, Identifier.Base),
    ArrayLite.map(kinds2, Identifier.Meta)),
  callback1,
  callback2);

const is_available_callback_prototype = {
  static: function (variable) { return this.callbacks.static(
    cleanup_variable(variable)); }};

exports.isAvailableBase = (scope, kind, identifier, callbacks) => Core.isAvailable(
  scope,
  Identifier.Base(kind),
  Identifier.Base(identifier),
  {
    __proto__: is_available_callback_prototype,
    callbacks});

exports.isAvailableMeta = (scope, kind, identifier, callbacks) => Core.isAvailable(
  scope,
  Identifier.Meta(kind),
  Identifier.Meta(identifier),
  {
    __proto__: is_available_callback_prototype,
    callbacks});

exports.declareBase = (scope, variable, _result) => (
  _result = Core.declare(
    scope,
    global_Object_assign(
      {},
      variable,
      {
        kind: Identifier.Base(variable.kind),
        name: Identifier.Base(variable.name)})),
  (
    (
      _result.type === "static" &&
      _result.conflict !== null) ?
    {
      type: "static",
      conflict: cleanup_variable(_result.conflict)} :
    _result));

exports.declareMeta = (scope, variable, _result) => (
  _result = Core.declare(
    scope,
    global_Object_assign(
      {},
      variable,
      {
        kind: Identifier.Meta(variable.kind),
        name: Identifier.Meta(variable.name)})),
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
    kind: Identifier.GetBody(variable.kind),
    name: Identifier.GetBody(variable.name)});

const cleanup_result = (result) => (
  result.type === "static" ?
  {
    type: "static",
    variable: cleanup_variable(result.variable),
    read: result.read,
    initialize: result.initialize} :
  result);

exports.initializeBase = (scope, kind, identifier, expression, maybe) => cleanup_result(
  Core.initialize(
    scope,
    Identifier.Base(kind),
    Identifier.Base(identifier),
    expression,
    maybe));

exports.initializeMeta = (scope, kind, identifier, expression, maybe) => cleanup_result(
  Core.initialize(
    scope,
    Identifier.Meta(kind),
    Identifier.Meta(identifier),
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

exports.makeLookupBaseExpression = (scope, identifier, callbacks) => Core.makeLookupExpression(
  scope,
  Identifier.Base(identifier),
  {
    __proto__: lookup_callback_prototype,
    callbacks});

exports.makeLookupMetaExpression = (scope, identifier, callbacks) => Core.makeLookupExpression(
  scope,
  Identifier.Meta(identifier),
  {
    __proto__: lookup_callback_prototype,
    callbacks});
