"use strict";

// https://tc39.es/ecma262/#directive-prologue
exports._is_use_strict = (statements) => {
  for (let index = 0; index < statements.length; index++) {
    if (statements[index].type !== "ExpressionStatement") {
      return false;
    }
    if (statements[index].expression.type !== "Literal") {
      return false;
    }
    if (typeof statements[index].expression.value !== "string") {
      return false;
    }
    if (statements[index].expression.value === "use strict") {
      return true;
    }
  }
  return false;
};

exports._is_function_declaration = (statement) => statement.type === "FunctionDeclaration";

exports._is_not_function_declaration = (statement) => statement.type !== "FunctionDeclaration";

exports._is_spread_element = (argument) => argument.type === "SpreadElement";

exports._is_identifier = (pattern) => pattern.type === "Identifier";

exports._is_constructor_method = (method) => method.kind === "constructor";

exports._is_static_method = (method) => (
  method.kind !== "constructor" &&
  method.static);

exports._is_instance_method = (method) => (
  method.kind !== "constructor" &&
  !method.static);

// exports._is_init_property = (property) => (
//   property.type !== "SpreadElement" &&
//   property.kind === "init");
