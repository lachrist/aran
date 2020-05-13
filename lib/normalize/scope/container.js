"use strict";

// type Container = (Maybe Identifier, Primitive)

const global_Error = global.Error;

const Layer = require("./layer.js");
const Build = require("../build.js");

exports.get = (scope, container) => {
  if (container.nullable_identifier === null) {
    return Build.primitive(container.primitive);
  }
  return Layer.access_meta(scope, container.nullable_identifier, null);
};

exports.set = (scope, container, aran_expression) => {
  if (container.nullable_identifier === null) {
    throw new global_Error("Cannot set an inlined container");
  }
  return Layer.access_meta(scope, container.nullable_identifier, aran_expression);
};

const make = (scope, identifier1, either_primitive_aran_expression, kontinuation1, kontinuation2) => {
  if (typeof either_primitive_aran_expression !== "object" || either_primitive_aran_expression === null) {
    if (typeof either_primitive_aran_expression === "symbol") {
      throw new global_Error("Symbols cannot be contained");
    }
    return kontinuation1({
      nullable_identifier: null,
      primitive: either_primitive_aran_expression
    });
  }
  const {identifier:identifier2, aran_expression} = Layer.declare_initialize_meta(scope, identifier1, either_primitive_aran_expression);
  return kontinuation2(aran_expression, {
    nullable_identifier: identifier2,
    primitive: null
  });
};

exports.container = (scope, identifier, either_primitive_aran_expression, kontinuation) => {
  return make(scope, identifier, either_primitive_aran_expression, kontinuation, (aran_expression, container) => {
    return Build.sequence(aran_expression, kontinuation(container));
  });
};

exports.Container = (scope, identifier, either_primitive_aran_expression, kontinuation) => {
  return make(scope, identifier, either_primitive_aran_expression, kontinuation, (aran_expression, container) => {
    const aran_statement_array_1 = Build.Expression(aran_expression);
    const aran_statement_array_2 = kontinuation(container);
    for (let index = 0; index < aran_statement_array_2.length; index++) {
      aran_statement_array_1[aran_statement_array_1.length] = aran_statement_array_2[index];
    }
    return aran_statement_array_1;
  });
};
