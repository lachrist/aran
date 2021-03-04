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
exports.ClosureScope = Core.ClosureScope;
exports.PropertyScope = Core.PropertyScope;
exports.getPropertyValue = Core.getPropertyValue;
exports.makeEvalExpression = Core.makeEvalExpression;
exports.makeInputExpression = Core.makeInputExpression;
exports.DynamicScope = Core.DynamicScope;
exports.makeEmptyBlock = Core.makeEmptyBlock;
exports.makeBlock = Core.makeBlock;
exports.isStatic = Core.isStatic;
exports.isDynamic = Core.isDynamic;
exports.isRoot = Core.isRoot;

///////////////////
// declareStatic //
///////////////////

const makeDeclareStaticVariable = (name) => (scope, identifier, ghost, data) => Core.declareStaticVariable(
  scope,
  Identifier[name](identifier),
  ghost,
  data);

exports.declareBaseStaticVariable = makeDeclareStaticVariable("makeBase");

exports.declareMetaStaticVariable = makeDeclareStaticVariable("makeMeta");

////////////////////////////////////
// makeStaticInitializeExpression //
////////////////////////////////////

const makeMakeStaticInitializeExpression = (name) => (scope, identifier, expression) => Core.makeStaticInitializeExpression(
  scope,
  Identifier[name](identifier),
  expression);

exports.makeBaseStaticInitializeExpression = makeMakeStaticInitializeExpression("makeBase");

exports.makeMetaStaticInitializeExpression = makeMakeStaticInitializeExpression("makeMeta");

//////////////////////////
// makeLookupExpression //
//////////////////////////

const makeMakeLookupExpression = (name) => (scope, identifier, callbacks) => Core.makeLookupExpression(
  scope,
  Identifier[name](identifier),
  callbacks);

exports.makeBaseLookupExpression = makeMakeLookupExpression("makeBase");

exports.makeMetaLookupExpression = makeMakeLookupExpression("makeMeta");
