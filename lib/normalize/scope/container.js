"use strict";

// type Container = (Maybe Identifier, Primitive)

const global_Error = global.Error;

const Core = require("./core.js");
const Split = require("./split.js");
const Build = require("../build.js");
const ArrayLite = require("array-lite");

exports.get = (scope, {nullable_identifier, primitive}) => {
  if (nullable_identifier === null) {
    return Build.primitive(primitive);
  }
  return Direct.lookup_meta(scope, nullable_identifier, null);
};

exports.set = (scope, {nullable_identifier, primitive}, aran_expression) => {
  if (nullable_identifier === null) {
    throw new global_Error("Cannot set an inlined container");
  }
  return Direct.lookup_meta(scope, nullable_identifier, aran_expression);
};

const make = (scope, identifier, either_primitive_aran_expression) => {
  if (typeof either_primitive_aran_expression !== "object" || either_primitive_aran_expression === null) {
    return {
      __proto__: null,
      nullable_aran_expression: null,
      container: {
        __proto__: null,
        nullable_identifier: null,
        primitive: either_primitive_aran_expression
      }
    };
  }
  const {identifier, aran_expression} = Split.declare_initialize_meta(scope, identifier, either_primitive_aran_expression);
  return {
    __proto__: null,
    nullable_aran_expression: aran_expression,
    container: {
      __proto__: null,
      nullable_identifier: identifier,
      primitive: null
    }
  };
};

// type Kontinuation = Container -> AranExpression
exports.make_expression = (scope, identifier, either_primitive_aran_expression, kontinuation) => {
  const {nullable_aran_expression, container} = make(scope, identifier, either_primitive_aran_expression);
  if (nullable_aran_expression === null) {
    return kontinuation(container);
  }
  return Build.sequence(nullable_aran_expression, kontinuation(container));
};

// type Kontinuation = Container -> [AranStatement]
exports.make_statements = (scope, identifier, either_primitive_aran_expression, kontinuation) => {
  const {nullable_aran_expression, container} = make(scope, identifier, either_primitive_aran_expression);
  if (nullable_aran_expression === null) {
    return kontinuation(container);
  }
  return ArrayLite.concat(Build.Expression(nullable_aran_expression), kontinuation(container));
};
